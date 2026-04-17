"""
Model building and feature importance service for the HEALTH-AI ML Learning Tool.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

import numpy as np
from sklearn.base import BaseEstimator
from sklearn.inspection import permutation_importance
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB

from app.schemas.api import FeatureImportanceItem

logger = logging.getLogger(__name__)

# Normalised model-type keys accepted by the API
_MODEL_ALIASES: Dict[str, str] = {
    "knn": "knn",
    "k-nearest neighbors": "knn",
    "k_nearest_neighbors": "knn",
    "svm": "svm",
    "support vector machine": "svm",
    "decision_tree": "decision_tree",
    "decisiontree": "decision_tree",
    "random_forest": "random_forest",
    "randomforest": "random_forest",
    "logistic_regression": "logistic_regression",
    "logisticregression": "logistic_regression",
    "naive_bayes": "naive_bayes",
    "naivebayes": "naive_bayes",
    "gaussiannb": "naive_bayes",
}


def _normalise_model_type(model_type: str) -> str:
    key = model_type.lower().replace("-", "_").replace(" ", "_")
    return _MODEL_ALIASES.get(key, key)


def build_model(model_type: str, hyperparams: Dict[str, Any]) -> BaseEstimator:
    """
    Instantiate a scikit-learn classifier from a model_type string and hyperparameter dict.
    All unknown keys in hyperparams are silently ignored to be lenient with front-end payloads.

    Supported model_type values:
        knn, svm, decision_tree, random_forest, logistic_regression, naive_bayes
    """
    mtype = _normalise_model_type(model_type)
    hp = hyperparams or {}

    if mtype == "knn":
        return KNeighborsClassifier(
            n_neighbors=int(hp.get("k", hp.get("n_neighbors", 5))),
            metric=str(hp.get("distance", hp.get("metric", "euclidean"))),
        )

    if mtype == "svm":
        return SVC(
            kernel=str(hp.get("kernel", "rbf")),
            C=float(hp.get("C", 1.0)),
            gamma=hp.get("gamma", "scale"),
            probability=True,
            random_state=42,
        )

    if mtype == "decision_tree":
        max_depth = hp.get("max_depth", None)
        return DecisionTreeClassifier(
            max_depth=int(max_depth) if max_depth is not None else None,
            min_samples_split=int(hp.get("min_samples_split", 2)),
            criterion=str(hp.get("criterion", "gini")),
            random_state=42,
        )

    if mtype == "random_forest":
        max_depth = hp.get("max_depth", None)
        return RandomForestClassifier(
            n_estimators=int(hp.get("n_estimators", hp.get("n_trees", 100))),
            max_depth=int(max_depth) if max_depth is not None else None,
            min_samples_split=int(hp.get("min_samples_split", 2)),
            random_state=42,
            n_jobs=-1,
        )

    if mtype == "logistic_regression":
        return LogisticRegression(
            C=float(hp.get("C", 1.0)),
            max_iter=int(hp.get("max_iter", 1000)),
            solver=str(hp.get("solver", "lbfgs")),
            random_state=42,
        )

    if mtype == "naive_bayes":
        return GaussianNB(
            var_smoothing=float(hp.get("var_smoothing", 1e-9)),
        )

    raise ValueError(
        f"Unknown model_type '{model_type}'. "
        "Supported: knn, svm, decision_tree, random_forest, logistic_regression, naive_bayes"
    )


def get_feature_importance(
    model: BaseEstimator,
    model_type: str,
    X_train: np.ndarray,
    feature_names: List[str],
) -> List[FeatureImportanceItem]:
    """
    Compute per-feature importance scores and return them sorted descending.

    Strategy by model type:
      - decision_tree / random_forest : model.feature_importances_
      - logistic_regression           : abs(coef_[0]) normalised to sum=1
      - knn / svm / naive_bayes       : permutation importance on X_train
    """
    mtype = _normalise_model_type(model_type)
    n_features = len(feature_names)
    importances: np.ndarray

    try:
        if mtype in ("decision_tree", "random_forest"):
            importances = np.array(model.feature_importances_, dtype=float)

        elif mtype == "logistic_regression":
            coef = model.coef_
            if coef.shape[0] == 1:
                raw = np.abs(coef[0])
            else:
                raw = np.mean(np.abs(coef), axis=0)
            total = raw.sum()
            importances = raw / total if total > 0 else raw

        else:
            # Permutation importance — use a small n_repeats for speed
            y_train_pred = model.predict(X_train)
            perm = permutation_importance(
                model,
                X_train,
                y_train_pred,
                n_repeats=5,
                random_state=42,
                n_jobs=-1,
            )
            raw = np.maximum(perm.importances_mean, 0)
            total = raw.sum()
            importances = raw / total if total > 0 else raw

    except Exception as exc:
        logger.warning("Feature importance computation failed: %s. Using uniform.", exc)
        importances = np.ones(n_features) / n_features

    # Safety: ensure length matches
    if len(importances) != n_features:
        importances = np.ones(n_features) / n_features

    items = [
        FeatureImportanceItem(feature=name, importance=float(imp))
        for name, imp in zip(feature_names, importances)
    ]
    items.sort(key=lambda x: x.importance, reverse=True)
    return items
