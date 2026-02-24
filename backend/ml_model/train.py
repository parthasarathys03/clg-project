"""
ML Training Pipeline
=====================
Trains a RandomForestClassifier on the student academic dataset.

Feature columns  : attendance_percentage, internal_marks,
                   assignment_score, study_hours_per_day
Target column    : performance_label  (Good | Average | At Risk)
Identity columns : student_id, student_name  — EXCLUDED from training
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix
)

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
DATA_DIR     = os.path.join(BASE_DIR, "..", "data")
DATASET_PATH = os.path.join(DATA_DIR, "student_data.csv")
MODEL_PATH   = os.path.join(BASE_DIR, "model.pkl")

# ── Feature config ───────────────────────────────────────────────────────────
FEATURE_COLS = [
    "attendance_percentage",
    "internal_marks",
    "assignment_score",
    "study_hours_per_day",
]
TARGET_COL   = "performance_label"
IDENTITY_COLS = ["student_id", "student_name"]   # Never used in training


def load_or_generate_dataset() -> pd.DataFrame:
    """Load dataset; auto-generate if missing."""
    if not os.path.exists(DATASET_PATH):
        print("[Train] Dataset not found. Generating synthetic data…")
        import sys, os as _os
        sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
        from data.generate_dataset import generate_dataset
        df = generate_dataset(n_samples=10000)
    else:
        df = pd.read_csv(DATASET_PATH)
        print(f"[Train] Loaded dataset: {len(df)} rows from {DATASET_PATH}")
    return df


def train_model() -> dict:
    """
    Full training pipeline.
    Returns a result dict with accuracy, report, importances, model path.
    """
    df = load_or_generate_dataset()

    # Validate columns
    missing = [c for c in FEATURE_COLS + [TARGET_COL] if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing columns: {missing}")

    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    # Encode labels to integers (required by sklearn RF)
    le = LabelEncoder()
    y_enc = le.fit_transform(y)                   # At Risk=0, Average=1, Good=2

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    # ── Model ────────────────────────────────────────────────────────────────
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # ── Evaluation ───────────────────────────────────────────────────────────
    y_pred      = clf.predict(X_test)
    accuracy    = accuracy_score(y_test, y_pred)
    report      = classification_report(
        y_test, y_pred,
        target_names=le.classes_,
        output_dict=True
    )

    # Cross-validation (5-fold)
    cv_scores   = cross_val_score(clf, X, y_enc, cv=5, scoring="accuracy")

    # Feature importances
    importances = {
        feat: round(float(imp), 4)
        for feat, imp in zip(FEATURE_COLS, clf.feature_importances_)
    }

    # ── Save model + label encoder ───────────────────────────────────────────
    payload = {
        "model":         clf,
        "label_encoder": le,
        "feature_cols":  FEATURE_COLS,
    }
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(payload, f)

    print(f"\n[Train] Model saved -> {MODEL_PATH}")
    print(f"[Train]   Accuracy     : {accuracy:.4f}")
    print(f"[Train]   CV mean/std  : {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")
    print(f"[Train]   Importances  : {importances}")

    return {
        "accuracy":            round(accuracy, 4),
        "cv_mean":             round(float(cv_scores.mean()), 4),
        "cv_std":              round(float(cv_scores.std()), 4),
        "model_path":          MODEL_PATH,
        "dataset_rows":        len(df),
        "feature_importances": importances,
        "classification_report": report,
    }


if __name__ == "__main__":
    result = train_model()
    print("\n[Train] Classification Report:")
    for label, metrics in result["classification_report"].items():
        if isinstance(metrics, dict):
            print(f"  {label:12s}  precision={metrics['precision']:.2f}  "
                  f"recall={metrics['recall']:.2f}  f1={metrics['f1-score']:.2f}")
