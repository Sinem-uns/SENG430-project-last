"""
Metrics computation service for the HEALTH-AI ML Learning Tool.
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)

from app.schemas.api import MetricsResult

logger = logging.getLogger(__name__)


def _safe_div(numerator: float, denominator: float, default: float = 0.0) -> float:
    return numerator / denominator if denominator != 0 else default


def compute_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray,
    task_type: str = "binary",
) -> MetricsResult:
    """
    Compute a standard set of classification metrics.

    For binary tasks:
        - sensitivity = recall for positive class (label=1)
        - specificity = recall for negative class (label=0)
        - precision, f1, AUC (standard binary ROC-AUC)

    For multiclass tasks:
        - macro-average recall used as a proxy for sensitivity/specificity
        - macro precision and f1
        - OvR AUC (macro)
    """
    classes = np.unique(y_true)
    n_classes = len(classes)

    accuracy = float(accuracy_score(y_true, y_pred))

    if task_type == "binary" and n_classes <= 2:
        # Sensitivity = TP / (TP + FN) for the positive class
        sensitivity = float(recall_score(y_true, y_pred, pos_label=1, zero_division=0))

        # Specificity = TN / (TN + FP) = recall for the negative class
        if 0 in classes:
            specificity = float(recall_score(y_true, y_pred, pos_label=0, zero_division=0))
        else:
            specificity = 0.0

        precision = float(precision_score(y_true, y_pred, pos_label=1, zero_division=0))
        f1 = float(f1_score(y_true, y_pred, pos_label=1, zero_division=0))

        # AUC
        auc = _compute_auc_binary(y_true, y_prob)

    else:
        # Multiclass: macro averages
        sensitivity = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
        specificity = sensitivity  # Symmetric macro recall proxy
        precision = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
        f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
        auc = _compute_auc_multiclass(y_true, y_prob, classes)

    return MetricsResult(
        accuracy=accuracy,
        sensitivity=sensitivity,
        specificity=specificity,
        precision=precision,
        f1=f1,
        auc=auc,
    )


def _compute_auc_binary(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Compute binary AUC. Returns 0.5 if it cannot be computed."""
    try:
        if y_prob.ndim == 2:
            # Take probability for positive class
            prob_pos = y_prob[:, -1]
        else:
            prob_pos = y_prob
        return float(roc_auc_score(y_true, prob_pos))
    except Exception:
        return 0.5


def _compute_auc_multiclass(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    classes: np.ndarray,
) -> float:
    """Compute macro OvR AUC for multiclass. Returns 0.5 on failure."""
    try:
        if y_prob.ndim == 1 or y_prob.shape[1] != len(classes):
            return 0.5
        return float(roc_auc_score(y_true, y_prob, multi_class="ovr", average="macro"))
    except Exception:
        return 0.5


def compute_confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    class_names: Optional[List[str]] = None,
) -> List[List[int]]:
    """
    Returns a 2-D list (standard confusion matrix).
    Labels are inferred from y_true unless class_names is provided.
    """
    labels = list(range(len(class_names))) if class_names else None
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    return cm.tolist()


def compute_roc_curve(
    y_true: np.ndarray,
    y_prob: np.ndarray,
) -> Optional[Dict]:
    """
    Compute binary ROC curve data.
    For multiclass, returns the first class (index 0) vs rest.
    Returns None if computation fails.
    """
    try:
        classes = np.unique(y_true)

        if y_prob.ndim == 2:
            if y_prob.shape[1] == 2:
                prob_pos = y_prob[:, 1]
            else:
                # Multiclass: class 0 vs rest
                prob_pos = y_prob[:, 0]
                y_binary = (y_true == classes[0]).astype(int)
                fpr_arr, tpr_arr, thresh_arr = roc_curve(y_binary, prob_pos)
                return {
                    "fpr": [round(float(v), 6) for v in fpr_arr],
                    "tpr": [round(float(v), 6) for v in tpr_arr],
                    "thresholds": [1.0 if np.isinf(v) else round(float(v), 6) for v in thresh_arr],
                }
        else:
            prob_pos = y_prob

        fpr_arr, tpr_arr, thresh_arr = roc_curve(y_true, prob_pos)
        return {
            "fpr": [round(float(v), 6) for v in fpr_arr],
            "tpr": [round(float(v), 6) for v in tpr_arr],
            "thresholds": [1.0 if np.isinf(v) else round(float(v), 6) for v in thresh_arr],
        }
    except Exception as exc:
        logger.warning("ROC curve computation failed: %s", exc)
        return None
