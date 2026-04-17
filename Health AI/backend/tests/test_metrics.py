import numpy as np
import pytest
from app.services.metrics import compute_metrics, compute_confusion_matrix


def test_perfect_binary_classifier():
    y_true = np.array([0, 0, 1, 1, 1])
    y_pred = np.array([0, 0, 1, 1, 1])
    y_prob = np.array([[1, 0], [1, 0], [0, 1], [0, 1], [0, 1]], dtype=float)
    m = compute_metrics(y_true, y_pred, y_prob, 'binary')
    assert m.accuracy == 1.0
    assert m.sensitivity == 1.0
    assert m.specificity == 1.0
    assert m.precision == 1.0
    assert m.f1 == 1.0
    assert m.auc == 1.0


def test_all_wrong_binary_classifier():
    y_true = np.array([0, 0, 1, 1])
    y_pred = np.array([1, 1, 0, 0])
    y_prob = np.array([[0, 1], [0, 1], [1, 0], [1, 0]], dtype=float)
    m = compute_metrics(y_true, y_pred, y_prob, 'binary')
    assert m.accuracy == 0.0
    assert m.sensitivity == 0.0
    assert m.specificity == 0.0


def test_confusion_matrix_binary():
    y_true = [0, 0, 1, 1]
    y_pred = [0, 1, 1, 0]
    cm = compute_confusion_matrix(y_true, y_pred, ['Neg', 'Pos'])
    assert len(cm) == 2
    assert cm[0][0] == 1  # TN
    assert cm[0][1] == 1  # FP
    assert cm[1][0] == 1  # FN
    assert cm[1][1] == 1  # TP


def test_multiclass_metrics_return_valid_range():
    y_true = np.array([0, 1, 2, 0, 1, 2])
    y_pred = np.array([0, 1, 2, 1, 0, 2])
    y_prob = np.eye(3)[[0, 1, 2, 1, 0, 2]].astype(float)
    m = compute_metrics(y_true, y_pred, y_prob, 'multiclass')
    assert 0.0 <= m.accuracy <= 1.0
    assert 0.0 <= m.sensitivity <= 1.0
    assert 0.0 <= m.auc <= 1.0


def test_metrics_float_bounds():
    """All metrics must be between 0 and 1"""
    rng = np.random.default_rng(42)
    y_true = rng.integers(0, 2, 100)
    y_pred = rng.integers(0, 2, 100)
    y_prob = rng.random((100, 2))
    y_prob = y_prob / y_prob.sum(axis=1, keepdims=True)
    m = compute_metrics(y_true, y_pred, y_prob, 'binary')
    for val in [m.accuracy, m.sensitivity, m.specificity, m.precision, m.f1, m.auc]:
        assert 0.0 <= val <= 1.0


def test_confusion_matrix_no_class_names():
    y_true = [0, 1, 0, 1]
    y_pred = [0, 0, 1, 1]
    cm = compute_confusion_matrix(y_true, y_pred)
    assert len(cm) == 2
    # 2x2 matrix
    for row in cm:
        assert len(row) == 2


def test_confusion_matrix_multiclass():
    y_true = [0, 1, 2, 0, 1, 2]
    y_pred = [0, 1, 2, 1, 0, 2]
    cm = compute_confusion_matrix(y_true, y_pred, ['A', 'B', 'C'])
    assert len(cm) == 3
    for row in cm:
        assert len(row) == 3


def test_metrics_returns_metric_result_object():
    """compute_metrics should return a MetricsResult Pydantic model."""
    y_true = np.array([0, 1, 0, 1])
    y_pred = np.array([0, 1, 1, 0])
    y_prob = np.array([[0.9, 0.1], [0.2, 0.8], [0.4, 0.6], [0.7, 0.3]])
    m = compute_metrics(y_true, y_pred, y_prob, 'binary')
    assert hasattr(m, 'accuracy')
    assert hasattr(m, 'sensitivity')
    assert hasattr(m, 'specificity')
    assert hasattr(m, 'precision')
    assert hasattr(m, 'f1')
    assert hasattr(m, 'auc')


def test_perfect_classifier_auc_is_1():
    y_true = np.array([0, 0, 0, 1, 1, 1])
    y_pred = np.array([0, 0, 0, 1, 1, 1])
    # Perfect probabilities
    y_prob = np.column_stack([
        np.array([1.0, 1.0, 1.0, 0.0, 0.0, 0.0]),
        np.array([0.0, 0.0, 0.0, 1.0, 1.0, 1.0]),
    ])
    m = compute_metrics(y_true, y_pred, y_prob, 'binary')
    assert m.auc == pytest.approx(1.0, abs=1e-6)
