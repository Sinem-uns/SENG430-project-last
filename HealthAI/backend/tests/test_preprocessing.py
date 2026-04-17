import numpy as np
import pytest
from app.services.preprocessing import apply_missing_strategy, normalize_features


def test_median_fill_replaces_nan():
    X = np.array([[1.0, 2.0], [np.nan, 3.0], [3.0, np.nan]])
    result = apply_missing_strategy(X, 'median', ['a', 'b'])
    assert not np.isnan(result).any()
    assert result[1, 0] == 2.0  # median of [1, 3]


def test_mode_fill_replaces_nan():
    X = np.array([[1.0, 2.0], [np.nan, 2.0], [1.0, np.nan]])
    result = apply_missing_strategy(X, 'mode', ['a', 'b'])
    assert not np.isnan(result).any()


def test_remove_drops_rows_with_nan():
    """
    apply_missing_strategy with 'remove' drops NaN rows from X.
    y must be filtered separately to stay aligned.
    """
    X = np.array([[1.0, 2.0], [np.nan, 3.0], [3.0, 4.0]])
    y = np.array([0, 1, 0])

    # Build mask before calling apply_missing_strategy
    nan_mask = ~np.isnan(X).any(axis=1)
    X_clean = apply_missing_strategy(X, 'remove', ['a', 'b'])
    y_clean = y[nan_mask]

    assert X_clean.shape[0] == 2
    assert y_clean.shape[0] == 2


def test_remove_no_nan_returns_all_rows():
    X = np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])
    result = apply_missing_strategy(X, 'remove', ['a', 'b'])
    assert result.shape[0] == 3
    assert not np.isnan(result).any()


def test_zscore_normalizes_to_unit_variance():
    X_train = np.array([[1.0, 10.0], [2.0, 20.0], [3.0, 30.0]])
    X_test = np.array([[1.5, 15.0]])
    X_train_n, X_test_n, scaler = normalize_features(X_train, X_test, 'zscore')
    assert abs(X_train_n[:, 0].mean()) < 1e-10
    assert abs(X_train_n[:, 0].std() - 1.0) < 1e-10


def test_zscore_normalizes_second_feature():
    X_train = np.array([[1.0, 10.0], [2.0, 20.0], [3.0, 30.0]])
    X_test = np.array([[1.5, 15.0]])
    X_train_n, X_test_n, scaler = normalize_features(X_train, X_test, 'zscore')
    assert abs(X_train_n[:, 1].mean()) < 1e-10
    assert abs(X_train_n[:, 1].std() - 1.0) < 1e-10


def test_minmax_normalizes_to_0_1():
    X_train = np.array([[0.0, 0.0], [1.0, 100.0], [0.5, 50.0]])
    X_test = np.array([[0.25, 25.0]])
    X_train_n, X_test_n, scaler = normalize_features(X_train, X_test, 'minmax')
    assert X_train_n.min() >= 0.0
    assert X_train_n.max() <= 1.0


def test_minmax_test_values_within_range():
    X_train = np.array([[0.0, 0.0], [1.0, 100.0]])
    X_test = np.array([[0.5, 50.0]])
    X_train_n, X_test_n, scaler = normalize_features(X_train, X_test, 'minmax')
    # Test values should be in [0, 1] for in-range inputs
    assert X_test_n[0, 0] == pytest.approx(0.5, abs=1e-6)
    assert X_test_n[0, 1] == pytest.approx(0.5, abs=1e-6)


def test_none_normalizer_returns_unchanged():
    X_train = np.array([[1.0, 2.0], [3.0, 4.0]])
    X_test = np.array([[5.0, 6.0]])
    X_train_n, X_test_n, _ = normalize_features(X_train, X_test, 'none')
    np.testing.assert_array_equal(X_train_n, X_train)
    np.testing.assert_array_equal(X_test_n, X_test)


def test_none_normalizer_returns_none_scaler():
    X_train = np.array([[1.0, 2.0], [3.0, 4.0]])
    X_test = np.array([[5.0, 6.0]])
    _, _, scaler = normalize_features(X_train, X_test, 'none')
    assert scaler is None


def test_zscore_scaler_is_returned():
    X_train = np.array([[1.0, 2.0], [2.0, 3.0], [3.0, 4.0]])
    X_test = np.array([[2.0, 3.0]])
    _, _, scaler = normalize_features(X_train, X_test, 'zscore')
    assert scaler is not None


def test_median_fill_all_columns():
    """All NaNs are replaced; no column left with NaN."""
    X = np.array([[np.nan, np.nan], [2.0, 4.0], [4.0, 8.0]])
    result = apply_missing_strategy(X, 'median', ['x', 'y'])
    assert not np.isnan(result).any()
    # median of [2, 4] = 3.0, median of [4, 8] = 6.0
    assert result[0, 0] == pytest.approx(3.0, abs=1e-6)
    assert result[0, 1] == pytest.approx(6.0, abs=1e-6)
