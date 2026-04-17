"""
Pydantic v2 schemas for the HEALTH-AI ML Learning Tool API.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Shared sub-models
# ---------------------------------------------------------------------------

class MetricsResult(BaseModel):
    accuracy: float = Field(..., ge=0.0, le=1.0)
    sensitivity: float = Field(..., ge=0.0, le=1.0)
    specificity: float = Field(..., ge=0.0, le=1.0)
    precision: float = Field(..., ge=0.0, le=1.0)
    f1: float = Field(..., ge=0.0, le=1.0)
    auc: float = Field(..., ge=0.0, le=1.0)


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class SubgroupResult(BaseModel):
    name: str          # column name
    group: str         # group label
    n: int
    sensitivity: float
    specificity: float
    delta_sensitivity: float
    delta_specificity: float
    status: str        # "OK" | "Review" | "Warning"


class ColumnInfo(BaseModel):
    name: str
    dtype: str         # "numeric" | "categorical" | "text"
    missing_count: int
    missing_pct: float
    unique_count: int
    sample_values: List[Any]


class ChecklistItem(BaseModel):
    label: str
    checked: bool
    pre_checked: bool


# ---------------------------------------------------------------------------
# /api/preprocess
# ---------------------------------------------------------------------------

class PrepareRequest(BaseModel):
    X_raw: List[List[Any]] = Field(..., description="Raw feature matrix (rows x features)")
    y_raw: List[Any] = Field(..., description="Target labels")
    feature_names: List[str]
    test_size: float = Field(0.2, ge=0.1, le=0.4)
    missing_strategy: str = Field("median", pattern="^(median|mode|remove)$")
    normalize: str = Field("zscore", pattern="^(zscore|minmax|none)$")
    apply_smote: bool = False
    task_type: str = Field("binary", pattern="^(binary|multiclass)$")


class PrepareResponse(BaseModel):
    X_train: List[List[float]]
    y_train: List[int]
    X_test: List[List[float]]
    y_test: List[int]
    feature_names_out: List[str]
    class_names: List[str]
    n_train: int
    n_test: int
    class_dist_train: Dict[str, int]
    class_dist_test: Dict[str, int]
    smote_applied: bool


# ---------------------------------------------------------------------------
# /api/train
# ---------------------------------------------------------------------------

class TrainRequest(BaseModel):
    domain_id: Optional[str] = None
    model_type: str = Field(..., description="knn | svm | decision_tree | random_forest | logistic_regression | naive_bayes")
    hyperparams: Dict[str, Any] = Field(default_factory=dict)
    X_train: List[List[float]]
    y_train: List[int]
    X_test: List[List[float]]
    y_test: List[int]
    feature_names: List[str]
    class_names: List[str] = Field(default_factory=list)
    task_type: str = Field("binary", pattern="^(binary|multiclass)$")


class RocCurveData(BaseModel):
    fpr: List[float]
    tpr: List[float]
    thresholds: List[float]


class TrainResponse(BaseModel):
    metrics: MetricsResult
    confusion_matrix: List[List[int]]
    roc_curve: Optional[RocCurveData]
    feature_importance: List[FeatureImportanceItem]
    predictions: List[int]
    probabilities: List[List[float]]


# ---------------------------------------------------------------------------
# /api/explain
# ---------------------------------------------------------------------------

class ExplainRequest(BaseModel):
    model_type: str
    hyperparams: Dict[str, Any] = Field(default_factory=dict)
    X_train: List[List[float]]
    y_train: List[int]
    X_test: List[List[float]]
    feature_names: List[str]
    patient_index: int = Field(..., ge=0)


class ContributionItem(BaseModel):
    feature: str
    contribution: float
    value: float


class ExplainResponse(BaseModel):
    patient_prediction: int
    patient_probability: List[float]
    contributions: List[ContributionItem]


# ---------------------------------------------------------------------------
# /api/bias
# ---------------------------------------------------------------------------

class BiasRequest(BaseModel):
    predictions: List[int]
    y_true: List[int]
    subgroup_data: Dict[str, List[Any]]


class BiasResponse(BaseModel):
    overall_sensitivity: float
    overall_specificity: float
    subgroups: List[SubgroupResult]
    has_significant_bias: bool


# ---------------------------------------------------------------------------
# /api/certificate
# ---------------------------------------------------------------------------

class CertificateRequest(BaseModel):
    domain_label: str
    model_type: str
    model_params: Dict[str, Any] = Field(default_factory=dict)
    metrics: MetricsResult
    confusion_matrix: List[List[int]] = Field(default_factory=list)
    bias_summary: List[Dict[str, Any]] = Field(default_factory=list)
    feature_importance: List[Dict[str, Any]] = Field(default_factory=list)
    checklist_items: List[ChecklistItem] = Field(default_factory=list)
    generated_at: str


class CertificateResponse(BaseModel):
    pdf_base64: str


# ---------------------------------------------------------------------------
# /api/datasets  &  /api/upload
# ---------------------------------------------------------------------------

class DatasetResponse(BaseModel):
    domain_id: str
    columns: List[ColumnInfo]
    rows: List[Dict[str, Any]]
    row_count: int
    target_column: str
    suggested_features: List[str]
    class_distribution: Dict[str, int]


class UploadResponse(BaseModel):
    columns: List[ColumnInfo]
    rows: List[Dict[str, Any]]
    row_count: int
    target_column: str
    suggested_features: List[str]
    class_distribution: Dict[str, int]
