"""
Preprocessing service for the HEALTH-AI ML Learning Tool.
Handles missing value imputation, normalization, train/test splitting, and SMOTE.
"""
from __future__ import annotations

import logging
from typing import List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler, StandardScaler

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def validate_and_clean_dataframe(
    df: pd.DataFrame,
    feature_cols: List[str],
    target_col: str,
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Validate that the requested columns exist, drop fully-empty columns,
    and return (X_df, y_series).
    Raises ValueError for irrecoverable problems.
    """
    missing_cols = [c for c in feature_cols + [target_col] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Columns not found in dataframe: {missing_cols}")

    X_df = df[feature_cols].copy()
    y = df[target_col].copy()

    # Drop columns where ALL values are missing
    all_null = X_df.columns[X_df.isnull().all()].tolist()
    if all_null:
        logger.warning("Dropping all-null columns: %s", all_null)
        X_df.drop(columns=all_null, inplace=True)

    # Drop rows where target is missing
    valid_mask = y.notna()
    X_df = X_df[valid_mask]
    y = y[valid_mask]

    if len(y) < 10:
        raise ValueError("Dataset has fewer than 10 valid rows after cleaning.")

    return X_df, y


def apply_missing_strategy(
    X: np.ndarray,
    strategy: str,
    feature_names: List[str],
) -> np.ndarray:
    """
    Fill or remove missing values in X (numpy float array).

    Parameters
    ----------
    X : 2-D numpy array, may contain NaN
    strategy : "median" | "mode" | "remove"
    feature_names : list of feature name strings (length == X.shape[1])

    Returns
    -------
    X_filled : numpy array with no NaN values
    """
    if strategy == "remove":
        # Drop rows that contain any NaN
        mask = ~np.isnan(X).any(axis=1)
        return X[mask]

    X_filled = X.copy().astype(float)
    for col_idx in range(X_filled.shape[1]):
        col = X_filled[:, col_idx]
        nan_mask = np.isnan(col)
        if not nan_mask.any():
            continue

        valid_vals = col[~nan_mask]
        if len(valid_vals) == 0:
            # All missing — fill with 0
            fill_val = 0.0
        elif strategy == "median":
            fill_val = float(np.median(valid_vals))
        elif strategy == "mode":
            # Use the most frequent value among valid entries
            values, counts = np.unique(valid_vals, return_counts=True)
            fill_val = float(values[np.argmax(counts)])
        else:
            fill_val = float(np.median(valid_vals))

        X_filled[nan_mask, col_idx] = fill_val

    return X_filled


def normalize_features(
    X_train: np.ndarray,
    X_test: np.ndarray,
    method: str,
) -> Tuple[np.ndarray, np.ndarray, Optional[object]]:
    """
    Normalize/scale features.

    Parameters
    ----------
    X_train, X_test : 2-D float arrays
    method : "zscore" | "minmax" | "none"

    Returns
    -------
    (X_train_norm, X_test_norm, scaler_or_None)
    Scaler is fit only on X_train to avoid data leakage.
    """
    if method == "none":
        return X_train.copy(), X_test.copy(), None

    if method == "zscore":
        scaler = StandardScaler()
    elif method == "minmax":
        scaler = MinMaxScaler()
    else:
        return X_train.copy(), X_test.copy(), None

    X_train_norm = scaler.fit_transform(X_train)
    X_test_norm = scaler.transform(X_test)
    return X_train_norm, X_test_norm, scaler


def apply_smote(
    X_train: np.ndarray,
    y_train: np.ndarray,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Apply SMOTE oversampling to the training set.
    Falls back to original data if SMOTE cannot be applied
    (e.g. too few samples per class).
    """
    try:
        from imblearn.over_sampling import SMOTE  # type: ignore

        # SMOTE requires at least k_neighbors + 1 samples in the minority class
        classes, counts = np.unique(y_train, return_counts=True)
        min_count = int(counts.min())
        k_neighbors = min(5, min_count - 1)

        if k_neighbors < 1:
            logger.warning("SMOTE skipped: minority class has too few samples (%d).", min_count)
            return X_train, y_train

        smote = SMOTE(k_neighbors=k_neighbors, random_state=42)
        X_resampled, y_resampled = smote.fit_resample(X_train, y_train)
        return X_resampled, y_resampled

    except Exception as exc:
        logger.warning("SMOTE failed: %s — returning original data.", exc)
        return X_train, y_train


def split_data(
    X: np.ndarray,
    y: np.ndarray,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Stratified train/test split with fallback to random split."""
    try:
        return train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)
    except ValueError:
        # Stratified split fails when a class has only 1 sample
        return train_test_split(X, y, test_size=test_size, random_state=random_state)
