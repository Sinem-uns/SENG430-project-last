"""
Generate realistic synthetic CSV datasets for the HEALTH-AI ML Learning Tool.

Run this script once to produce all sample data files:
    python data/generate_data.py

All datasets use numpy seed=42 for reproducibility.
"""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
OUT_DIR = Path(__file__).resolve().parent


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def _clip(arr: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return np.clip(arr, lo, hi)


def _bernoulli(p: np.ndarray) -> np.ndarray:
    return (RNG.random(len(p)) < p).astype(int)


# ---------------------------------------------------------------------------
# 1. Cardiology – Heart Failure 30-Day Readmission  (500 rows)
# ---------------------------------------------------------------------------

def generate_cardiology() -> pd.DataFrame:
    n = 500
    age = RNG.integers(50, 91, size=n)
    sex = RNG.choice(["M", "F"], size=n, p=[0.6, 0.4])
    ejection_fraction = RNG.integers(15, 66, size=n)
    serum_creatinine = np.round(_clip(RNG.normal(1.4, 1.1, n), 0.5, 9.0), 1)
    serum_sodium = RNG.integers(113, 149, size=n)
    high_blood_pressure = _bernoulli(np.full(n, 0.4))
    diabetes = _bernoulli(np.full(n, 0.35))
    anaemia = _bernoulli(np.full(n, 0.3))
    smoking = _bernoulli(np.full(n, 0.25))
    creatinine_phosphokinase = RNG.integers(23, 7862, size=n)
    platelets = np.round(_clip(RNG.normal(263000, 97000, n), 25000, 850000), 0)
    follow_up_days = RNG.integers(4, 286, size=n)

    # Logistic model for readmission risk
    log_odds = (
        -2.5
        + 0.04 * (age - 65)
        - 0.06 * (ejection_fraction - 38)
        + 0.4 * serum_creatinine
        - 0.03 * (serum_sodium - 136)
        + 0.4 * high_blood_pressure
        + 0.2 * diabetes
        + 0.2 * anaemia
    )
    prob = _sigmoid(log_odds)
    readmission = _bernoulli(prob)

    df = pd.DataFrame({
        "patient_id": range(1, n + 1),
        "age": age,
        "sex": sex,
        "ejection_fraction": ejection_fraction,
        "serum_creatinine": serum_creatinine,
        "serum_sodium": serum_sodium,
        "high_blood_pressure": high_blood_pressure,
        "diabetes": diabetes,
        "anaemia": anaemia,
        "smoking": smoking,
        "creatinine_phosphokinase": creatinine_phosphokinase,
        "platelets": platelets,
        "follow_up_days": follow_up_days,
        "readmission_30days": readmission,
    })
    return df


# ---------------------------------------------------------------------------
# 2. Diabetes – Pima-style  (768 rows)
# ---------------------------------------------------------------------------

def generate_diabetes() -> pd.DataFrame:
    n = 768
    pregnancies = RNG.integers(0, 18, size=n)
    glucose = _clip(RNG.normal(120, 32, n), 0, 199).astype(int)
    blood_pressure = _clip(RNG.normal(69, 19, n), 0, 122).astype(int)
    skin_thickness = _clip(RNG.normal(20, 16, n), 0, 99).astype(int)
    insulin = _clip(RNG.exponential(80, n), 0, 846).astype(int)
    bmi = np.round(_clip(RNG.normal(32, 8, n), 0, 67.1), 1)
    dpf = np.round(_clip(RNG.exponential(0.47, n), 0.078, 2.42), 3)
    age = _clip(RNG.normal(33, 11, n), 21, 81).astype(int)

    log_odds = (
        -4.5
        + 0.025 * (glucose - 120)
        + 0.05 * (bmi - 30)
        + 0.03 * (age - 30)
        + 0.15 * pregnancies
        + 0.5 * dpf
        - 0.01 * blood_pressure
    )
    prob = _sigmoid(log_odds)
    outcome = _bernoulli(prob)

    return pd.DataFrame({
        "pregnancies": pregnancies,
        "glucose": glucose,
        "blood_pressure": blood_pressure,
        "skin_thickness": skin_thickness,
        "insulin": insulin,
        "bmi": bmi,
        "diabetes_pedigree_function": dpf,
        "age": age,
        "outcome": outcome,
    })


# ---------------------------------------------------------------------------
# 3. Breast Cancer – Wisconsin-style  (569 rows)
# ---------------------------------------------------------------------------

def generate_breast_cancer() -> pd.DataFrame:
    n = 569
    # ~37% malignant
    malignant = (_bernoulli(np.full(n, 0.37))).astype(bool)

    def _feature(benign_mean, benign_std, mal_ratio=1.6, std_mult=1.2):
        vals = np.where(
            malignant,
            RNG.normal(benign_mean * mal_ratio, benign_std * std_mult, n),
            RNG.normal(benign_mean, benign_std, n),
        )
        return np.round(np.abs(vals), 4)

    df = pd.DataFrame({
        "mean_radius": _feature(12.0, 2.5),
        "mean_texture": _feature(17.5, 4.0, mal_ratio=1.15),
        "mean_perimeter": _feature(78.0, 12.0),
        "mean_area": _feature(462.0, 130.0),
        "mean_smoothness": np.round(np.abs(RNG.normal(0.096, 0.014, n)), 4),
        "mean_compactness": _feature(0.104, 0.052),
        "mean_concavity": _feature(0.089, 0.080),
        "mean_concave_points": _feature(0.049, 0.039),
        "mean_symmetry": np.round(np.abs(RNG.normal(0.181, 0.027, n)), 4),
        "mean_fractal_dimension": np.round(np.abs(RNG.normal(0.063, 0.007, n)), 4),
        "worst_radius": _feature(14.5, 4.0, mal_ratio=1.7),
        "worst_texture": _feature(25.5, 6.0, mal_ratio=1.15),
        "worst_perimeter": _feature(92.0, 20.0, mal_ratio=1.7),
        "worst_area": _feature(654.0, 300.0, mal_ratio=1.8),
        "worst_smoothness": np.round(np.abs(RNG.normal(0.132, 0.023, n)), 4),
        "diagnosis": malignant.astype(int),
    })
    return df


# ---------------------------------------------------------------------------
# 4. Parkinson's – UCI-style voice measures  (195 rows)
# ---------------------------------------------------------------------------

def generate_parkinsons() -> pd.DataFrame:
    n = 195
    # ~75% Parkinson's
    pk = (_bernoulli(np.full(n, 0.75))).astype(bool)

    def _f(h_mean, h_std, pk_mult=1.0, pk_std_mult=1.0):
        return np.where(
            pk,
            RNG.normal(h_mean * pk_mult, h_std * pk_std_mult, n),
            RNG.normal(h_mean, h_std, n),
        )

    df = pd.DataFrame({
        "MDVP_Fo_Hz": np.round(np.abs(_f(154, 40, pk_mult=0.85)), 3),
        "MDVP_Fhi_Hz": np.round(np.abs(_f(197, 100, pk_mult=0.9)), 3),
        "MDVP_Flo_Hz": np.round(np.abs(_f(116, 44, pk_mult=0.78)), 3),
        "MDVP_Jitter_pct": np.round(np.abs(_f(0.006, 0.006, pk_mult=2.5, pk_std_mult=2.0)), 5),
        "MDVP_Jitter_Abs": np.round(np.abs(_f(4.4e-5, 4e-5, pk_mult=2.5, pk_std_mult=2.0)), 7),
        "MDVP_RAP": np.round(np.abs(_f(0.003, 0.003, pk_mult=2.5, pk_std_mult=2.0)), 5),
        "MDVP_PPQ": np.round(np.abs(_f(0.003, 0.003, pk_mult=2.5, pk_std_mult=2.0)), 5),
        "Jitter_DDP": np.round(np.abs(_f(0.009, 0.009, pk_mult=2.5, pk_std_mult=2.0)), 5),
        "MDVP_Shimmer": np.round(np.abs(_f(0.029, 0.019, pk_mult=1.8, pk_std_mult=1.5)), 5),
        "MDVP_Shimmer_dB": np.round(np.abs(_f(0.282, 0.195, pk_mult=1.8, pk_std_mult=1.5)), 3),
        "Shimmer_APQ3": np.round(np.abs(_f(0.016, 0.010, pk_mult=1.8, pk_std_mult=1.5)), 5),
        "Shimmer_APQ5": np.round(np.abs(_f(0.018, 0.013, pk_mult=1.8, pk_std_mult=1.5)), 5),
        "MDVP_APQ": np.round(np.abs(_f(0.024, 0.017, pk_mult=1.8, pk_std_mult=1.5)), 5),
        "Shimmer_DDA": np.round(np.abs(_f(0.047, 0.030, pk_mult=1.8, pk_std_mult=1.5)), 5),
        "NHR": np.round(np.abs(_f(0.025, 0.040, pk_mult=2.0, pk_std_mult=2.0)), 5),
        "HNR": np.round(np.abs(_f(21.9, 4.4, pk_mult=0.88)), 3),
        "RPDE": np.round(_clip(_f(0.50, 0.10, pk_mult=1.05), 0.25, 0.97), 6),
        "DFA": np.round(_clip(_f(0.72, 0.055, pk_mult=1.0), 0.51, 0.87), 6),
        "spread1": np.round(_f(-5.7, 1.0, pk_mult=0.93), 6),
        "spread2": np.round(np.abs(_f(0.227, 0.083, pk_mult=1.1)), 6),
        "D2": np.round(np.abs(_f(2.38, 0.40, pk_mult=1.02)), 6),
        "PPE": np.round(np.abs(_f(0.207, 0.09, pk_mult=1.5, pk_std_mult=1.3)), 6),
        "status": pk.astype(int),
    })
    return df


# ---------------------------------------------------------------------------
# 5. Nephrology – CKD  (400 rows)
# ---------------------------------------------------------------------------

def generate_nephrology() -> pd.DataFrame:
    n = 400
    # ~60% CKD
    ckd = (_bernoulli(np.full(n, 0.60))).astype(bool)

    age = _clip(
        np.where(ckd, RNG.normal(55, 18, n), RNG.normal(42, 18, n)),
        2, 90,
    ).astype(int)
    blood_pressure = _clip(
        np.where(ckd, RNG.normal(80, 20, n), RNG.normal(70, 15, n)),
        50, 180,
    ).astype(int)

    sg_options = [1.005, 1.010, 1.015, 1.020, 1.025]
    sg_ckd_probs = [0.25, 0.35, 0.25, 0.10, 0.05]
    sg_healthy_probs = [0.05, 0.10, 0.20, 0.35, 0.30]
    specific_gravity = np.where(
        ckd,
        RNG.choice(sg_options, n, p=sg_ckd_probs),
        RNG.choice(sg_options, n, p=sg_healthy_probs),
    )

    albumin = np.where(
        ckd,
        RNG.choice([0, 1, 2, 3, 4, 5], n, p=[0.1, 0.2, 0.25, 0.20, 0.15, 0.10]),
        RNG.choice([0, 1, 2, 3, 4, 5], n, p=[0.70, 0.15, 0.08, 0.04, 0.02, 0.01]),
    )
    sugar = np.where(
        ckd,
        RNG.choice([0, 1, 2, 3, 4, 5], n, p=[0.30, 0.25, 0.20, 0.12, 0.08, 0.05]),
        RNG.choice([0, 1, 2, 3, 4, 5], n, p=[0.78, 0.12, 0.05, 0.03, 0.01, 0.01]),
    )

    rbc = np.where(ckd, RNG.choice(["normal", "abnormal"], n, p=[0.35, 0.65]),
                   RNG.choice(["normal", "abnormal"], n, p=[0.85, 0.15]))
    pus_cell = np.where(ckd, RNG.choice(["normal", "abnormal"], n, p=[0.30, 0.70]),
                        RNG.choice(["normal", "abnormal"], n, p=[0.80, 0.20]))

    haemoglobin = np.round(
        _clip(np.where(ckd, RNG.normal(10.5, 2.5, n), RNG.normal(15.0, 1.5, n)), 3.1, 17.8), 1
    )
    packed_cell_volume = _clip(
        np.where(ckd, RNG.normal(30, 9, n), RNG.normal(44, 5, n)), 9, 54
    ).astype(int)
    wbc = _clip(RNG.normal(8500, 3200, n), 2200, 26400).astype(int)
    rbc_count = np.round(
        _clip(np.where(ckd, RNG.normal(3.5, 0.9, n), RNG.normal(5.2, 0.6, n)), 2.1, 8.0), 1
    )
    hypertension = np.where(ckd,
                            RNG.choice(["yes", "no"], n, p=[0.65, 0.35]),
                            RNG.choice(["yes", "no"], n, p=[0.25, 0.75]))
    dm = np.where(ckd,
                  RNG.choice(["yes", "no"], n, p=[0.45, 0.55]),
                  RNG.choice(["yes", "no"], n, p=[0.15, 0.85]))
    cad = np.where(ckd,
                   RNG.choice(["yes", "no"], n, p=[0.25, 0.75]),
                   RNG.choice(["yes", "no"], n, p=[0.08, 0.92]))
    classification = np.where(ckd, "ckd", "notckd")

    return pd.DataFrame({
        "age": age,
        "blood_pressure": blood_pressure,
        "specific_gravity": specific_gravity,
        "albumin": albumin,
        "sugar": sugar,
        "red_blood_cells": rbc,
        "pus_cell": pus_cell,
        "haemoglobin": haemoglobin,
        "packed_cell_volume": packed_cell_volume,
        "white_blood_cell_count": wbc,
        "red_blood_cell_count": rbc_count,
        "hypertension": hypertension,
        "diabetes_mellitus": dm,
        "coronary_artery_disease": cad,
        "classification": classification,
    })


# ---------------------------------------------------------------------------
# 6. Sepsis – ICU sepsis prediction  (400 rows)
# ---------------------------------------------------------------------------

def generate_sepsis() -> pd.DataFrame:
    n = 400
    # ~40% sepsis
    sepsis = (_bernoulli(np.full(n, 0.40))).astype(bool)

    age = _clip(RNG.normal(55, 18, n), 18, 90).astype(int)
    heart_rate = _clip(
        np.where(sepsis, RNG.normal(115, 20, n), RNG.normal(88, 18, n)), 60, 180
    ).astype(int)
    respiratory_rate = _clip(
        np.where(sepsis, RNG.normal(26, 6, n), RNG.normal(17, 4, n)), 12, 40
    ).astype(int)
    temperature = np.round(
        _clip(np.where(sepsis, RNG.normal(38.6, 0.9, n), RNG.normal(37.1, 0.7, n)), 35.0, 41.0), 1
    )
    systolic_bp = _clip(
        np.where(sepsis, RNG.normal(100, 25, n), RNG.normal(128, 20, n)), 70, 180
    ).astype(int)
    wbc = np.round(
        _clip(np.where(sepsis, RNG.normal(16, 6, n), RNG.normal(8.5, 2.5, n)), 1.5, 30.0), 1
    )
    lactate = np.round(
        _clip(np.where(sepsis, RNG.exponential(3.5, n), RNG.exponential(1.2, n)), 0.5, 15.0), 1
    )
    sofa_score = _clip(
        np.where(sepsis, RNG.integers(4, 18, n), RNG.integers(0, 8, n)), 0, 24
    ).astype(int)
    mech_vent = np.where(
        sepsis,
        _bernoulli(np.full(n, 0.45)),
        _bernoulli(np.full(n, 0.12)),
    )
    icu_day = RNG.integers(1, 31, size=n)

    return pd.DataFrame({
        "age": age,
        "heart_rate": heart_rate,
        "respiratory_rate": respiratory_rate,
        "temperature": temperature,
        "systolic_bp": systolic_bp,
        "wbc_count": wbc,
        "lactate": lactate,
        "sofa_score": sofa_score,
        "mechanical_ventilation": mech_vent,
        "icu_day": icu_day,
        "sepsis": sepsis.astype(int),
    })


# ---------------------------------------------------------------------------
# 7. Fetal Health – CTG multiclass  (2126 rows)
# ---------------------------------------------------------------------------

def generate_fetal_health() -> pd.DataFrame:
    n = 2126
    # Distribution: ~78% Normal, ~14% Suspect, ~8% Pathological
    health_class = RNG.choice([1, 2, 3], size=n, p=[0.78, 0.14, 0.08])
    is_normal = health_class == 1
    is_suspect = health_class == 2
    is_pathological = health_class == 3

    def _fc(n_mean, s_mean, p_mean, std, lo=None, hi=None):
        vals = (
            np.where(is_normal, RNG.normal(n_mean, std, n), 0)
            + np.where(is_suspect, RNG.normal(s_mean, std * 1.2, n), 0)
            + np.where(is_pathological, RNG.normal(p_mean, std * 1.5, n), 0)
        )
        if lo is not None and hi is not None:
            vals = _clip(vals, lo, hi)
        return vals

    baseline = _fc(133, 135, 136, 10, 106, 160).astype(int)
    accelerations = np.round(_clip(_fc(0.004, 0.002, 0.001, 0.003), 0, 0.019), 6)
    fetal_movement = np.round(_clip(_fc(0.009, 0.005, 0.002, 0.015), 0, 0.481), 6)
    uterine_contractions = np.round(_clip(_fc(0.004, 0.003, 0.005, 0.003), 0, 0.015), 6)
    light_decels = np.round(_clip(_fc(0.001, 0.003, 0.005, 0.002), 0, 0.015), 6)
    severe_decels = np.round(_clip(_fc(0.0, 0.0001, 0.0004, 0.0002), 0, 0.001), 7)
    prolongued_decels = np.round(_clip(_fc(0.0, 0.0001, 0.0008, 0.0003), 0, 0.005), 7)
    abnormal_stv = _fc(13, 25, 45, 12, 12, 87).astype(int)
    mean_stv = np.round(_fc(1.3, 0.9, 0.7, 0.6, 0.2, 7.0), 2)
    hist_mean = _fc(137, 130, 125, 18, 73, 182).astype(int)
    hist_variance = _fc(18, 35, 65, 25, 0, 269).astype(int)

    return pd.DataFrame({
        "baseline_value": baseline,
        "accelerations": accelerations,
        "fetal_movement": fetal_movement,
        "uterine_contractions": uterine_contractions,
        "light_decelerations": light_decels,
        "severe_decelerations": severe_decels,
        "prolongued_decelerations": prolongued_decels,
        "abnormal_short_term_variability": abnormal_stv,
        "mean_value_of_short_term_variability": mean_stv,
        "histogram_mean": hist_mean,
        "histogram_variance": hist_variance,
        "fetal_health": health_class,
    })


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

GENERATORS = {
    "cardiology.csv": generate_cardiology,
    "diabetes.csv": generate_diabetes,
    "breast_cancer.csv": generate_breast_cancer,
    "parkinsons.csv": generate_parkinsons,
    "nephrology.csv": generate_nephrology,
    "sepsis.csv": generate_sepsis,
    "fetal_health.csv": generate_fetal_health,
}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename, generator in GENERATORS.items():
        out_path = OUT_DIR / filename
        print(f"Generating {filename} ...", end=" ", flush=True)
        df = generator()
        df.to_csv(out_path, index=False)
        print(f"OK  ({len(df)} rows, {len(df.columns)} cols)  -> {out_path}")


if __name__ == "__main__":
    main()
