"""
Dataset routes for the HEALTH-AI ML Learning Tool.

GET  /api/datasets/{domain_id}  – serve a built-in CSV as DatasetResponse
POST /api/upload                – accept a user-uploaded CSV, return UploadResponse
"""
from __future__ import annotations

import io
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.api import ColumnInfo, DatasetResponse, UploadResponse

router = APIRouter(tags=["datasets"])

# ---------------------------------------------------------------------------
# Directory containing the built-in CSV files
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

# ---------------------------------------------------------------------------
# Domain metadata
# ---------------------------------------------------------------------------
DOMAIN_META: Dict[str, Dict[str, Any]] = {
    "cardiology": {
        "file": "cardiology.csv",
        "target": "readmission_30days",
        "suggested_features": [
            "age", "ejection_fraction", "serum_creatinine",
            "serum_sodium", "high_blood_pressure", "diabetes",
            "creatinine_phosphokinase", "platelets", "follow_up_days",
        ],
    },
    "nephrology": {
        "file": "nephrology.csv",
        "target": "classification",
        "suggested_features": [
            "age", "blood_pressure", "haemoglobin", "packed_cell_volume",
            "white_blood_cell_count", "red_blood_cell_count",
            "albumin", "sugar",
        ],
    },
    "breast_cancer": {
        "file": "breast_cancer.csv",
        "target": "diagnosis",
        "suggested_features": [
            "mean_radius", "mean_texture", "mean_perimeter", "mean_area",
            "mean_smoothness", "mean_compactness", "mean_concavity",
            "worst_radius", "worst_texture", "worst_perimeter", "worst_area",
        ],
    },
    "parkinsons": {
        "file": "parkinsons.csv",
        "target": "status",
        "suggested_features": [
            "MDVP_Fo_Hz", "MDVP_Fhi_Hz", "MDVP_Flo_Hz",
            "MDVP_Jitter_pct", "MDVP_Shimmer", "NHR", "HNR",
            "RPDE", "DFA", "spread1", "PPE",
        ],
    },
    "diabetes": {
        "file": "diabetes.csv",
        "target": "outcome",
        "suggested_features": [
            "pregnancies", "glucose", "blood_pressure", "skin_thickness",
            "insulin", "bmi", "diabetes_pedigree_function", "age",
        ],
    },
    "sepsis": {
        "file": "sepsis.csv",
        "target": "sepsis",
        "suggested_features": [
            "age", "heart_rate", "respiratory_rate", "temperature",
            "systolic_bp", "wbc_count", "lactate", "sofa_score",
        ],
    },
    "fetal_health": {
        "file": "fetal_health.csv",
        "target": "fetal_health",
        "suggested_features": [
            "baseline_value", "accelerations", "fetal_movement",
            "uterine_contractions", "abnormal_short_term_variability",
            "mean_value_of_short_term_variability", "histogram_mean",
            "histogram_variance",
        ],
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _detect_dtype(series: pd.Series) -> str:
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    nunique = series.dropna().nunique()
    total = len(series.dropna())
    if nunique == 0 or (total > 0 and nunique / total > 0.5):
        return "text"
    return "categorical"


def _build_column_infos(df: pd.DataFrame) -> List[ColumnInfo]:
    cols: List[ColumnInfo] = []
    for col in df.columns:
        series = df[col]
        missing_count = int(series.isna().sum())
        missing_pct = float(missing_count / len(series)) if len(series) > 0 else 0.0
        unique_count = int(series.nunique(dropna=True))
        sample_vals = series.dropna().head(3).tolist()
        # Ensure JSON-serialisable types
        sample_vals = [
            float(v) if isinstance(v, (np.floating, float)) else
            int(v) if isinstance(v, (np.integer, int)) else
            str(v)
            for v in sample_vals
        ]
        cols.append(
            ColumnInfo(
                name=col,
                dtype=_detect_dtype(series),
                missing_count=missing_count,
                missing_pct=round(missing_pct * 100, 2),
                unique_count=unique_count,
                sample_values=sample_vals,
            )
        )
    return cols


def _class_distribution(df: pd.DataFrame, target_col: str) -> Dict[str, int]:
    if target_col not in df.columns:
        return {}
    counts = df[target_col].value_counts(dropna=True)
    return {str(k): int(v) for k, v in counts.items()}


def _rows_as_dicts(df: pd.DataFrame, limit: int = 200) -> List[Dict[str, Any]]:
    """Convert first `limit` rows to JSON-serialisable dicts."""
    subset = df.head(limit).copy()
    # Convert numpy types
    records = []
    for record in subset.to_dict(orient="records"):
        clean: Dict[str, Any] = {}
        for k, v in record.items():
            if isinstance(v, (np.integer,)):
                clean[k] = int(v)
            elif isinstance(v, (np.floating,)):
                clean[k] = None if np.isnan(v) else float(v)
            elif isinstance(v, float) and np.isnan(v):
                clean[k] = None
            else:
                clean[k] = v
        records.append(clean)
    return records


def _guess_target(df: pd.DataFrame) -> str:
    """Heuristic: last column, or the first column with <= 10 unique values."""
    last_col = df.columns[-1]
    if df[last_col].nunique() <= 10:
        return last_col
    for col in df.columns:
        if df[col].nunique() <= 10:
            return col
    return last_col


def _guess_features(df: pd.DataFrame, target_col: str) -> List[str]:
    """All numeric columns except the target."""
    return [
        col for col in df.columns
        if col != target_col and pd.api.types.is_numeric_dtype(df[col])
    ]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/datasets/{domain_id}", response_model=DatasetResponse)
async def get_dataset(domain_id: str) -> DatasetResponse:
    csv_path = DATA_DIR / f"{domain_id}.csv"
    if not csv_path.exists():
        # Fallback to checking DOMAIN_META just in case
        meta = DOMAIN_META.get(domain_id)
        if meta and (DATA_DIR / meta["file"]).exists():
            csv_path = DATA_DIR / meta["file"]
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Data file for domain '{domain_id}' is not available on the server.",
            )

    try:
        df = pd.read_csv(csv_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read CSV: {exc}")

    # If it is in DOMAIN_META, use the guaranteed target/suggested. Otherwise guess automatically!
    meta = DOMAIN_META.get(domain_id)
    if meta:
        target_col: str = meta["target"]
        suggested: List[str] = [f for f in meta["suggested_features"] if f in df.columns]
    else:
        target_col = _guess_target(df)
        suggested = _guess_features(df, target_col)

    return DatasetResponse(
        domain_id=domain_id,
        columns=_build_column_infos(df),
        rows=_rows_as_dicts(df, 200),
        row_count=len(df),
        target_column=target_col,
        suggested_features=suggested,
        class_distribution=_class_distribution(df, target_col),
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)) -> UploadResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Cannot parse CSV: {exc}")

    if df.empty or len(df.columns) < 2:
        raise HTTPException(
            status_code=422,
            detail="CSV must have at least 2 columns and at least 1 data row.",
        )

    target_col = _guess_target(df)
    suggested = _guess_features(df, target_col)

    return UploadResponse(
        columns=_build_column_infos(df),
        rows=_rows_as_dicts(df, 200),
        row_count=len(df),
        target_column=target_col,
        suggested_features=suggested,
        class_distribution=_class_distribution(df, target_col),
    )
