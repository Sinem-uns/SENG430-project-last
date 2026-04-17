import pytest
import numpy as np
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def test_health_check():
    resp = client.get('/health')
    assert resp.status_code == 200
    assert resp.json()['status'] == 'ok'


# ---------------------------------------------------------------------------
# Dataset endpoints
# ---------------------------------------------------------------------------

def test_get_builtin_dataset_cardiology():
    resp = client.get('/api/datasets/cardiology')
    assert resp.status_code == 200
    data = resp.json()
    assert 'columns' in data
    assert 'rows' in data
    assert data['row_count'] > 0
    assert data['target_column'] == 'readmission_30days'


def test_get_builtin_dataset_diabetes():
    resp = client.get('/api/datasets/diabetes')
    assert resp.status_code == 200
    data = resp.json()
    assert data['target_column'] == 'outcome'


def test_get_builtin_dataset_fetal_health():
    resp = client.get('/api/datasets/fetal_health')
    assert resp.status_code == 200
    data = resp.json()
    assert data['target_column'] == 'fetal_health'


def test_unknown_domain_returns_404():
    resp = client.get('/api/datasets/unknown_domain_xyz')
    assert resp.status_code == 404


def test_dataset_response_has_columns_list():
    resp = client.get('/api/datasets/cardiology')
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data['columns'], list)
    assert len(data['columns']) > 0
    # Each column should have name and dtype
    col = data['columns'][0]
    assert 'name' in col
    assert 'dtype' in col


# ---------------------------------------------------------------------------
# Train endpoint helpers
# ---------------------------------------------------------------------------

def make_train_payload(model_type='logistic_regression', n=80):
    rng = np.random.default_rng(0)
    X = rng.random((n, 4)).tolist()
    y = rng.integers(0, 2, n).tolist()
    split = int(n * 0.8)
    return {
        'domain_id': 'cardiology',
        'model_type': model_type,
        'hyperparams': {'C': 1.0, 'max_iter': 100},
        'X_train': X[:split],
        'y_train': y[:split],
        'X_test': X[split:],
        'y_test': y[split:],
        'feature_names': ['a', 'b', 'c', 'd'],
        'class_names': ['No', 'Yes'],
        'task_type': 'binary',
    }


# ---------------------------------------------------------------------------
# Train endpoint tests
# ---------------------------------------------------------------------------

def test_train_logistic_regression():
    payload = make_train_payload('logistic_regression')
    resp = client.post('/api/train', json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert 'metrics' in data
    assert 'confusion_matrix' in data
    assert 'feature_importance' in data
    m = data['metrics']
    assert 0 <= m['accuracy'] <= 1
    assert 0 <= m['sensitivity'] <= 1
    assert 0 <= m['auc'] <= 1


def test_train_random_forest():
    payload = make_train_payload('random_forest')
    payload['hyperparams'] = {'n_trees': 10, 'max_depth': 3}
    resp = client.post('/api/train', json=payload)
    assert resp.status_code == 200


def test_train_knn():
    payload = make_train_payload('knn')
    payload['hyperparams'] = {'k': 3, 'distance': 'euclidean'}
    resp = client.post('/api/train', json=payload)
    assert resp.status_code == 200


def test_train_svm():
    payload = make_train_payload('svm')
    payload['hyperparams'] = {'kernel': 'rbf', 'C': 1.0}
    resp = client.post('/api/train', json=payload)
    assert resp.status_code == 200


def test_train_decision_tree():
    payload = make_train_payload('decision_tree')
    payload['hyperparams'] = {'max_depth': 3}
    resp = client.post('/api/train', json=payload)
    assert resp.status_code == 200


def test_train_naive_bayes():
    payload = make_train_payload('naive_bayes')
    payload['hyperparams'] = {'var_smoothing': 1e-9}
    resp = client.post('/api/train', json=payload)
    assert resp.status_code == 200


def test_train_response_has_feature_importance():
    payload = make_train_payload('random_forest')
    payload['hyperparams'] = {'n_trees': 10, 'max_depth': 3}
    resp = client.post('/api/train', json=payload)
    assert resp.status_code == 200
    data = resp.json()
    fi = data['feature_importance']
    assert isinstance(fi, list)
    assert len(fi) == 4  # 4 features
    for item in fi:
        assert 'feature' in item
        assert 'importance' in item


def test_train_response_confusion_matrix_shape():
    payload = make_train_payload('logistic_regression')
    resp = client.post('/api/train', json=payload)
    assert resp.status_code == 200
    cm = resp.json()['confusion_matrix']
    assert isinstance(cm, list)
    # Binary: 2x2
    assert len(cm) == 2
    for row in cm:
        assert len(row) == 2


# ---------------------------------------------------------------------------
# Preprocess endpoint
# ---------------------------------------------------------------------------

def test_preprocess_endpoint():
    rng = np.random.default_rng(1)
    X_raw = rng.random((100, 3)).tolist()
    y_raw = rng.integers(0, 2, 100).tolist()
    payload = {
        'X_raw': X_raw,
        'y_raw': y_raw,
        'feature_names': ['x1', 'x2', 'x3'],
        'test_size': 0.2,
        'missing_strategy': 'median',
        'normalize': 'zscore',
        'apply_smote': False,
        'task_type': 'binary',
    }
    resp = client.post('/api/preprocess', json=payload)
    assert resp.status_code == 200
    d = resp.json()
    assert d['n_train'] > 0
    assert d['n_test'] > 0
    assert d['n_train'] + d['n_test'] == 100


def test_preprocess_minmax_normalize():
    rng = np.random.default_rng(2)
    X_raw = rng.random((50, 2)).tolist()
    y_raw = rng.integers(0, 2, 50).tolist()
    payload = {
        'X_raw': X_raw,
        'y_raw': y_raw,
        'feature_names': ['a', 'b'],
        'test_size': 0.2,
        'missing_strategy': 'median',
        'normalize': 'minmax',
        'apply_smote': False,
        'task_type': 'binary',
    }
    resp = client.post('/api/preprocess', json=payload)
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Bias endpoint
# ---------------------------------------------------------------------------

def test_bias_endpoint():
    y_true = [0, 0, 1, 1, 0, 1, 0, 1]
    y_pred = [0, 1, 1, 0, 0, 1, 0, 1]
    payload = {
        'predictions': y_pred,
        'y_true': y_true,
        'subgroup_data': {'sex': ['M', 'M', 'F', 'F', 'M', 'F', 'M', 'F']}
    }
    resp = client.post('/api/bias', json=payload)
    assert resp.status_code == 200
    d = resp.json()
    assert 'subgroups' in d
    assert isinstance(d['has_significant_bias'], bool)


def test_bias_endpoint_returns_subgroup_metrics():
    y_true = [0, 0, 0, 0, 1, 1, 1, 1]
    y_pred = [0, 0, 1, 0, 1, 0, 1, 1]
    payload = {
        'predictions': y_pred,
        'y_true': y_true,
        'subgroup_data': {'group': ['A', 'A', 'A', 'A', 'B', 'B', 'B', 'B']}
    }
    resp = client.post('/api/bias', json=payload)
    assert resp.status_code == 200
    d = resp.json()
    subgroups = d['subgroups']
    assert len(subgroups) >= 2
    for sg in subgroups:
        assert 'name' in sg
        assert 'group' in sg
        assert 'sensitivity' in sg
        assert 'specificity' in sg
        assert 'status' in sg


def test_bias_mismatched_lengths_returns_422():
    payload = {
        'predictions': [0, 1, 0],
        'y_true': [0, 1],  # different length
        'subgroup_data': {'sex': ['M', 'F', 'M']}
    }
    resp = client.post('/api/bias', json=payload)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Certificate endpoint
# ---------------------------------------------------------------------------

def test_certificate_endpoint():
    payload = {
        'domain_label': 'Cardiology — Heart Failure',
        'model_type': 'Random Forest',
        'model_params': {'nTrees': 100, 'maxDepth': 5},
        'metrics': {
            'accuracy': 0.82,
            'sensitivity': 0.76,
            'specificity': 0.88,
            'precision': 0.79,
            'f1': 0.77,
            'auc': 0.85,
        },
        'bias_summary': [
            {
                'name': 'Sex',
                'group': 'Female',
                'n': 120,
                'sensitivity': 0.74,
                'specificity': 0.87,
                'delta_sensitivity': -0.02,
                'delta_specificity': -0.01,
                'status': 'OK',
            }
        ],
        'checklist_items': [
            {'label': 'Human oversight defined', 'checked': True, 'pre_checked': False}
        ],
        'generated_at': '2026-03-24T10:00:00Z',
    }
    resp = client.post('/api/certificate', json=payload)
    assert resp.status_code == 200
    d = resp.json()
    assert 'pdf_base64' in d
    assert len(d['pdf_base64']) > 100  # non-trivial base64
