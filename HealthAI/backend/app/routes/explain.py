"""
Explainability route for the HEALTH-AI ML Learning Tool.

POST /api/explain  – re-train model and compute per-feature contributions
                     for a single patient in X_test.
"""
from __future__ import annotations

import logging
from typing import List

import numpy as np
from fastapi import APIRouter, HTTPException

from app.schemas.api import ContributionItem, ExplainRequest, ExplainResponse
from app.services import models as model_svc

router = APIRouter(tags=["explain"])
logger = logging.getLogger(__name__)


def _normalise_model_type(model_type: str) -> str:
    return model_type.lower().replace("-", "_").replace(" ", "_")


# ---------------------------------------------------------------------------
# /api/explain
# ---------------------------------------------------------------------------

@router.post("/explain", response_model=ExplainResponse)
async def explain(req: ExplainRequest) -> ExplainResponse:
    """
    Re-train model, then compute feature contributions for a single patient.

    Contribution strategies by model type
    ──────────────────────────────────────
    Tree-based (decision_tree, random_forest):
        contribution_i = feature_importance_i * (value_i - mean_i)
        (captures direction via sign of deviation from mean)

    Logistic Regression:
        contribution_i = coef_i * (value_i - mean_i) / std_i
        (linear contribution in log-odds space)

    Others (knn, svm, naive_bayes):
        Permutation-style: swap feature to its column median, measure
        change in predicted probability for the positive class, then restore.
    """
    if req.patient_index >= len(req.X_test):
        raise HTTPException(
            status_code=422,
            detail=f"patient_index {req.patient_index} is out of range "
                   f"(X_test has {len(req.X_test)} rows).",
        )

    if not req.X_train or not req.y_train:
        raise HTTPException(status_code=422, detail="X_train and y_train must be non-empty.")

    X_train = np.array(req.X_train, dtype=float)
    y_train = np.array(req.y_train, dtype=int)
    X_test = np.array(req.X_test, dtype=float)

    # Re-train model
    try:
        model = model_svc.build_model(req.model_type, req.hyperparams)
        model.fit(X_train, y_train)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model training failed: {exc}")

    patient_row = X_test[req.patient_index].reshape(1, -1)

    # Prediction for this patient
    try:
        patient_pred = int(model.predict(patient_row)[0])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    # Probabilities
    try:
        patient_prob: List[float] = model.predict_proba(patient_row)[0].tolist()
    except Exception:
        n_classes = len(np.unique(y_train))
        patient_prob = [0.0] * n_classes
        patient_prob[patient_pred] = 1.0

    # Feature contributions
    feature_values = patient_row[0]
    mtype = _normalise_model_type(req.model_type)
    feature_names = req.feature_names

    contributions: List[ContributionItem] = []

    try:
        if mtype in ("decision_tree", "random_forest"):
            contributions = _tree_contributions(
                model, X_train, feature_values, feature_names
            )
        elif mtype == "logistic_regression":
            contributions = _logistic_contributions(
                model, X_train, feature_values, feature_names
            )
        else:
            contributions = _permutation_contributions(
                model, X_train, patient_row, feature_values, feature_names
            )
    except Exception as exc:
        logger.warning("Contribution computation failed: %s — using zero contributions.", exc)
        contributions = [
            ContributionItem(feature=f, contribution=0.0, value=float(v))
            for f, v in zip(feature_names, feature_values)
        ]

    # Sort by absolute contribution (descending)
    contributions.sort(key=lambda x: abs(x.contribution), reverse=True)

    return ExplainResponse(
        patient_prediction=patient_pred,
        patient_probability=patient_prob,
        contributions=contributions,
    )


# ---------------------------------------------------------------------------
# Strategy implementations
# ---------------------------------------------------------------------------

def _tree_contributions(
    model,
    X_train: np.ndarray,
    feature_values: np.ndarray,
    feature_names: List[str],
) -> List[ContributionItem]:
    """
    Tree-based contribution:
        importance_i * (value_i - train_mean_i)
    Sign captures whether the feature is above/below the training mean.
    """
    importances = model.feature_importances_
    train_means = X_train.mean(axis=0)
    items = []
    for i, (name, val, imp, mean) in enumerate(
        zip(feature_names, feature_values, importances, train_means)
    ):
        contribution = float(imp) * float(val - mean)
        items.append(ContributionItem(feature=name, contribution=contribution, value=float(val)))
    return items


def _logistic_contributions(
    model,
    X_train: np.ndarray,
    feature_values: np.ndarray,
    feature_names: List[str],
) -> List[ContributionItem]:
    """
    Logistic Regression contribution:
        coef_i * (value_i - mean_i) / max(std_i, 1e-8)
    """
    coef = model.coef_
    if coef.shape[0] == 1:
        coef_vec = coef[0]
    else:
        # Multiclass: average absolute contribution across classes
        coef_vec = np.mean(coef, axis=0)

    train_means = X_train.mean(axis=0)
    train_stds = X_train.std(axis=0)
    train_stds = np.where(train_stds < 1e-8, 1e-8, train_stds)

    items = []
    for name, val, c, mean, std in zip(
        feature_names, feature_values, coef_vec, train_means, train_stds
    ):
        contribution = float(c) * float((val - mean) / std)
        items.append(ContributionItem(feature=name, contribution=contribution, value=float(val)))
    return items


def _permutation_contributions(
    model,
    X_train: np.ndarray,
    patient_row: np.ndarray,
    feature_values: np.ndarray,
    feature_names: List[str],
) -> List[ContributionItem]:
    """
    Permutation-style contribution:
        Set each feature to its training median one at a time.
        contribution_i = P(y=1 | original) - P(y=1 | feature_i = median_i)
    Captures how much each feature shifts the predicted probability.
    """
    try:
        base_prob = model.predict_proba(patient_row)[0]
        # Use the last class probability as the "positive" class
        base_p = float(base_prob[-1])
    except Exception:
        return [
            ContributionItem(feature=f, contribution=0.0, value=float(v))
            for f, v in zip(feature_names, feature_values)
        ]

    medians = np.median(X_train, axis=0)
    items = []

    for i, (name, val, median) in enumerate(zip(feature_names, feature_values, medians)):
        perturbed = patient_row.copy()
        perturbed[0, i] = float(median)
        try:
            perturbed_prob = model.predict_proba(perturbed)[0]
            perturbed_p = float(perturbed_prob[-1])
        except Exception:
            perturbed_p = base_p

        contribution = base_p - perturbed_p  # positive → this feature raises risk
        items.append(ContributionItem(feature=name, contribution=contribution, value=float(val)))

    return items
