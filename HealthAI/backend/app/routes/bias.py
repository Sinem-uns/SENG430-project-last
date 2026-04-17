"""
Bias audit route for the HEALTH-AI ML Learning Tool.

POST /api/bias  – compute per-subgroup sensitivity & specificity,
                  flag groups with large performance disparities.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

import numpy as np
from fastapi import APIRouter, HTTPException

from app.schemas.api import BiasRequest, BiasResponse, SubgroupResult

router = APIRouter(tags=["bias"])
logger = logging.getLogger(__name__)

# Thresholds for bias status (percentage points as fractions)
THRESHOLD_OK = 0.05       # ≤ 5pp  → OK
THRESHOLD_REVIEW = 0.10   # ≤ 10pp → Review  (> 10pp → Warning)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sensitivity(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Sensitivity = TP / (TP + FN) for positive class (1)."""
    tp = int(((y_true == 1) & (y_pred == 1)).sum())
    fn = int(((y_true == 1) & (y_pred == 0)).sum())
    return tp / (tp + fn) if (tp + fn) > 0 else 0.0


def _specificity(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Specificity = TN / (TN + FP) for negative class (0)."""
    tn = int(((y_true == 0) & (y_pred == 0)).sum())
    fp = int(((y_true == 0) & (y_pred == 1)).sum())
    return tn / (tn + fp) if (tn + fp) > 0 else 0.0


def _bias_status(delta: float) -> str:
    """Classify a performance delta into OK / Review / Warning."""
    abs_delta = abs(delta)
    if abs_delta <= THRESHOLD_OK:
        return "OK"
    if abs_delta <= THRESHOLD_REVIEW:
        return "Review"
    return "Warning"


# ---------------------------------------------------------------------------
# /api/bias
# ---------------------------------------------------------------------------

@router.post("/bias", response_model=BiasResponse)
async def evaluate_bias(req: BiasRequest) -> BiasResponse:
    """
    For each subgroup column provided in subgroup_data, iterate over
    unique group values, compute sensitivity and specificity, and compare
    against the overall population metrics.

    Status thresholds (absolute delta vs overall):
      |delta| ≤ 5pp   → OK
      5pp < |delta| ≤ 10pp → Review
      |delta| > 10pp  → Warning
    """
    if len(req.predictions) != len(req.y_true):
        raise HTTPException(
            status_code=422,
            detail="predictions and y_true must have the same length.",
        )

    y_pred = np.array(req.predictions, dtype=int)
    y_true = np.array(req.y_true, dtype=int)
    n_total = len(y_true)

    if n_total == 0:
        raise HTTPException(status_code=422, detail="predictions list is empty.")

    # Validate subgroup_data lengths
    for col_name, values in req.subgroup_data.items():
        if len(values) != n_total:
            raise HTTPException(
                status_code=422,
                detail=f"subgroup_data['{col_name}'] has {len(values)} entries "
                       f"but predictions has {n_total}.",
            )

    # Overall metrics
    overall_sens = _sensitivity(y_true, y_pred)
    overall_spec = _specificity(y_true, y_pred)

    subgroup_results: List[SubgroupResult] = []

    for col_name, raw_values in req.subgroup_data.items():
        group_arr = np.array(raw_values)
        unique_groups = sorted(set(raw_values), key=lambda x: str(x))

        for group_val in unique_groups:
            mask = group_arr == group_val
            n_group = int(mask.sum())

            if n_group < 2:
                # Skip groups too small to compute meaningful metrics
                logger.debug("Skipping subgroup %s=%s: only %d samples.", col_name, group_val, n_group)
                continue

            y_true_g = y_true[mask]
            y_pred_g = y_pred[mask]

            sens_g = _sensitivity(y_true_g, y_pred_g)
            spec_g = _specificity(y_true_g, y_pred_g)

            delta_sens = sens_g - overall_sens
            delta_spec = spec_g - overall_spec

            # Status is driven by the worst (largest absolute) delta
            max_delta = max(abs(delta_sens), abs(delta_spec))
            status = _bias_status(max_delta)

            subgroup_results.append(
                SubgroupResult(
                    name=col_name,
                    group=str(group_val),
                    n=n_group,
                    sensitivity=round(sens_g, 4),
                    specificity=round(spec_g, 4),
                    delta_sensitivity=round(delta_sens, 4),
                    delta_specificity=round(delta_spec, 4),
                    status=status,
                )
            )

    has_significant_bias = any(sg.status == "Warning" for sg in subgroup_results)

    return BiasResponse(
        overall_sensitivity=round(overall_sens, 4),
        overall_specificity=round(overall_spec, 4),
        subgroups=subgroup_results,
        has_significant_bias=has_significant_bias,
    )
