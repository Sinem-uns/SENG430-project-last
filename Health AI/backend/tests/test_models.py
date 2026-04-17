import numpy as np
import pytest
from app.services.models import build_model, get_feature_importance


def make_simple_data():
    rng = np.random.default_rng(42)
    X = rng.random((50, 4))
    y = (X[:, 0] > 0.5).astype(int)
    return X, y


@pytest.mark.parametrize("model_type,params", [
    ('knn', {'k': 5, 'distance': 'euclidean'}),
    ('svm', {'kernel': 'rbf', 'C': 1.0}),
    ('decision_tree', {'max_depth': 3}),
    ('random_forest', {'n_trees': 10, 'max_depth': 3}),
    ('logistic_regression', {'C': 1.0, 'max_iter': 100}),
    ('naive_bayes', {'var_smoothing': 1e-9}),
])
def test_all_models_fit_predict(model_type, params):
    X, y = make_simple_data()
    model = build_model(model_type, params)
    model.fit(X, y)
    preds = model.predict(X)
    assert preds.shape == (50,)
    assert set(preds).issubset({0, 1})


@pytest.mark.parametrize("model_type,params", [
    ('decision_tree', {'max_depth': 3}),
    ('random_forest', {'n_trees': 10, 'max_depth': 3}),
    ('logistic_regression', {'C': 1.0, 'max_iter': 100}),
    ('knn', {'k': 5, 'distance': 'euclidean'}),
])
def test_feature_importance_returns_all_features(model_type, params):
    X, y = make_simple_data()
    feature_names = ['feat_a', 'feat_b', 'feat_c', 'feat_d']
    model = build_model(model_type, params)
    model.fit(X, y)
    importances = get_feature_importance(model, model_type, X, feature_names)
    assert len(importances) == 4
    names = [fi.feature for fi in importances]
    assert set(names) == set(feature_names)
    values = [fi.importance for fi in importances]
    assert all(v >= 0 for v in values)


def test_feature_importance_sum_approx_one_for_trees():
    X, y = make_simple_data()
    feature_names = ['a', 'b', 'c', 'd']
    model = build_model('random_forest', {'n_trees': 10, 'max_depth': 3})
    model.fit(X, y)
    importances = get_feature_importance(model, 'random_forest', X, feature_names)
    total = sum(fi.importance for fi in importances)
    assert abs(total - 1.0) < 0.01


def test_feature_importance_sum_approx_one_for_logistic():
    X, y = make_simple_data()
    feature_names = ['a', 'b', 'c', 'd']
    model = build_model('logistic_regression', {'C': 1.0, 'max_iter': 200})
    model.fit(X, y)
    importances = get_feature_importance(model, 'logistic_regression', X, feature_names)
    total = sum(fi.importance for fi in importances)
    assert abs(total - 1.0) < 0.01


def test_unknown_model_type_raises_value_error():
    with pytest.raises(ValueError, match="Unknown model_type"):
        build_model('unknown_model', {})


def test_build_model_knn_default_params():
    model = build_model('knn', {})
    # Should not raise; defaults to 5 neighbors
    assert model is not None


def test_build_model_decision_tree_without_depth():
    X, y = make_simple_data()
    model = build_model('decision_tree', {})
    model.fit(X, y)
    preds = model.predict(X)
    assert preds.shape == (50,)


def test_feature_importance_returns_feature_importance_items():
    """Returned items should have .feature (str) and .importance (float) attributes."""
    X, y = make_simple_data()
    feature_names = ['w', 'x', 'y_feat', 'z']
    model = build_model('decision_tree', {'max_depth': 3})
    model.fit(X, y)
    importances = get_feature_importance(model, 'decision_tree', X, feature_names)
    for item in importances:
        assert hasattr(item, 'feature')
        assert hasattr(item, 'importance')
        assert isinstance(item.feature, str)
        assert isinstance(item.importance, float)


def test_feature_importance_sorted_descending():
    """Results should be sorted by importance descending."""
    X, y = make_simple_data()
    feature_names = ['a', 'b', 'c', 'd']
    model = build_model('random_forest', {'n_trees': 20, 'max_depth': 3})
    model.fit(X, y)
    importances = get_feature_importance(model, 'random_forest', X, feature_names)
    values = [fi.importance for fi in importances]
    assert values == sorted(values, reverse=True)
