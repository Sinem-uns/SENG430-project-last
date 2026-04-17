"""
Training routes for the HEALTH-AI ML Learning Tool.

POST /api/preprocess  – run preprocessing pipeline, return split arrays
POST /api/train       – train a model on pre-split arrays, return metrics + extras
"""
from __future__ import annotations

import logging
from collections import Counter
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

from app.schemas.api import (
    PrepareRequest,
    PrepareResponse,
    RocCurveData,
    TrainRequest,
    TrainResponse,
)
from app.services import metrics as metrics_svc
from app.services import models as model_svc
from app.services import preprocessing as prep_svc

router = APIRouter(tags=["train"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helper: convert mixed-type X_raw to float numpy array
# ---------------------------------------------------------------------------

def _convert_X_raw(X_raw: List[List[Any]]) -> np.ndarray:
    """Convert X_raw (list-of-lists, possibly mixed types) to float numpy array."""
    if not X_raw:
        return np.empty((0, 0), dtype=float)
    n_rows = len(X_raw)
    n_cols = len(X_raw[0])
    X_np = np.empty((n_rows, n_cols), dtype=float)
    for row_i, row in enumerate(X_raw):
        for col_i, val in enumerate(row):
            try:
                X_np[row_i, col_i] = float(val)
            except (TypeError, ValueError):
                X_np[row_i, col_i] = np.nan
    return X_np


# ---------------------------------------------------------------------------
# /api/preprocess
# ---------------------------------------------------------------------------

@router.post("/preprocess", response_model=PrepareResponse)
async def preprocess(req: PrepareRequest) -> PrepareResponse:
    """
    Full preprocessing pipeline:
      1. Convert raw arrays to numpy (coerce bad values to NaN)
      2. Apply missing-value strategy
      3. Encode labels to consecutive integers
      4. Train/test split (stratified when possible)
      5. Normalize features (fit on train only)
      6. Optionally apply SMOTE to training set (binary only)
    """
    if len(req.X_raw) == 0 or len(req.y_raw) == 0:
        raise HTTPException(status_code=422, detail="X_raw and y_raw must be non-empty.")
    if len(req.X_raw) != len(req.y_raw):
        raise HTTPException(status_code=422, detail="X_raw and y_raw must have the same length.")

    # 1. Convert to float numpy
    try:
        X_float = _convert_X_raw(req.X_raw)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Cannot convert X_raw to numeric: {exc}")

    # 2. Fill / remove missing values
    try:
        X_filled = prep_svc.apply_missing_strategy(X_float, req.missing_strategy, req.feature_names)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Missing value strategy failed: {exc}")

    if X_filled.shape[0] < 10:
        raise HTTPException(
            status_code=422,
            detail="Too few rows remain after applying missing value strategy (need at least 10).",
        )

    # Align y after possible row removal (strategy="remove")
    y_raw_arr = np.array(req.y_raw)
    if req.missing_strategy == "remove":
        # Re-compute mask: rows that had no NaN in original X_float
        row_mask = ~np.isnan(X_float).any(axis=1)
        y_raw_arr = y_raw_arr[row_mask]

    # Safety: trim to match X_filled rows
    y_raw_arr = y_raw_arr[: X_filled.shape[0]]

    # 3. Encode labels
    classes_raw = sorted(set(y_raw_arr.tolist()), key=lambda x: (str(type(x)), x))
    class_names = [str(c) for c in classes_raw]
    label_map = {c: i for i, c in enumerate(classes_raw)}
    try:
        y_encoded = np.array([label_map[v] for v in y_raw_arr], dtype=int)
    except KeyError as exc:
        raise HTTPException(status_code=422, detail=f"Unknown label value: {exc}")

    # 4. Train/test split
    try:
        X_tr, X_te, y_tr, y_te = prep_svc.split_data(X_filled, y_encoded, test_size=req.test_size)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Train/test split failed: {exc}")

    # 5. Normalize
    try:
        X_tr_norm, X_te_norm, _ = prep_svc.normalize_features(X_tr, X_te, req.normalize)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Normalization failed: {exc}")

    # 6. SMOTE (binary only)
    smote_applied = False
    if req.apply_smote and req.task_type == "binary" and len(np.unique(y_tr)) == 2:
        X_tr_norm, y_tr = prep_svc.apply_smote(X_tr_norm, y_tr)
        smote_applied = True

    def _dist(y: np.ndarray) -> Dict[str, int]:
        return {class_names[k]: int(v) for k, v in Counter(y.tolist()).items()}

    return PrepareResponse(
        X_train=X_tr_norm.tolist(),
        y_train=y_tr.tolist(),
        X_test=X_te_norm.tolist(),
        y_test=y_te.tolist(),
        feature_names_out=req.feature_names,
        class_names=class_names,
        n_train=len(y_tr),
        n_test=len(y_te),
        class_dist_train=_dist(y_tr),
        class_dist_test=_dist(y_te),
        smote_applied=smote_applied,
    )


# ---------------------------------------------------------------------------
# /api/train
# ---------------------------------------------------------------------------

@router.post("/train", response_model=TrainResponse)
async def train_model(req: TrainRequest) -> TrainResponse:
    """
    Build and train a sklearn classifier from model_type + hyperparams.
    Evaluate on the provided test set and return all results.
    """
    if not req.X_train or not req.y_train:
        raise HTTPException(status_code=422, detail="X_train and y_train must be non-empty.")
    if not req.X_test or not req.y_test:
        raise HTTPException(status_code=422, detail="X_test and y_test must be non-empty.")
    if len(req.feature_names) != len(req.X_train[0]):
        raise HTTPException(
            status_code=422,
            detail=f"feature_names length ({len(req.feature_names)}) does not match "
                   f"number of columns in X_train ({len(req.X_train[0])}).",
        )

    X_train = np.array(req.X_train, dtype=float)
    y_train = np.array(req.y_train, dtype=int)
    X_test = np.array(req.X_test, dtype=float)
    y_test = np.array(req.y_test, dtype=int)

    # Build & fit model
    try:
        model = model_svc.build_model(req.model_type, req.hyperparams)
        model.fit(X_train, y_train)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model training failed: {exc}")

    # Predictions
    try:
        y_pred = model.predict(X_test)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    # Probabilities
    try:
        y_prob: np.ndarray = model.predict_proba(X_test)
    except Exception:
        # Fallback: one-hot encode from predictions
        n_classes = len(np.unique(y_train))
        y_prob = np.eye(n_classes)[y_pred]

    # Metrics
    try:
        result_metrics = metrics_svc.compute_metrics(y_test, y_pred, y_prob, req.task_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Metrics computation failed: {exc}")

    # Confusion matrix
    try:
        cm = metrics_svc.compute_confusion_matrix(y_test, y_pred, req.class_names or None)
    except Exception:
        cm = [[0]]

    # ROC curve
    roc_data: Optional[RocCurveData] = None
    try:
        roc_raw = metrics_svc.compute_roc_curve(y_test, y_prob)
        if roc_raw:
            roc_data = RocCurveData(**roc_raw)
    except Exception:
        pass

    # Feature importance
    try:
        feat_imp = model_svc.get_feature_importance(
            model, req.model_type, X_train, req.feature_names
        )
    except Exception as exc:
        logger.warning("Feature importance computation failed: %s", exc)
        feat_imp = []

    return TrainResponse(
        metrics=result_metrics,
        confusion_matrix=cm,
        roc_curve=roc_data,
        feature_importance=feat_imp,
        predictions=y_pred.tolist(),
        probabilities=y_prob.tolist(),
    )
