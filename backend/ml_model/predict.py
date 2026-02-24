"""
Prediction Module
==================
Loads the trained RandomForestClassifier and produces:
  - risk_level       : Good | Average | At Risk
  - confidence       : max class probability
  - probabilities    : per-class probabilities
  - key_factors      : top contributing features (for explanation)
"""

import os
import pickle
import numpy as np
from typing import Optional

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

_cached_payload: Optional[dict] = None


def _load_payload() -> dict:
    global _cached_payload
    if _cached_payload is not None:
        return _cached_payload
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Please call POST /api/train first."
        )
    with open(MODEL_PATH, "rb") as f:
        _cached_payload = pickle.load(f)
    return _cached_payload


def reload_model():
    """Force reload model from disk (call after re-training)."""
    global _cached_payload
    _cached_payload = None
    _load_payload()


def predict(
    attendance_percentage: float,
    internal_marks: float,
    assignment_score: float,
    study_hours_per_day: float,
) -> dict:
    """
    Returns prediction dict:
      {
        risk_level, confidence, probabilities, key_factors
      }
    """
    payload  = _load_payload()
    clf      = payload["model"]
    le       = payload["label_encoder"]
    features = payload["feature_cols"]

    X = np.array([[
        attendance_percentage,
        internal_marks,
        assignment_score,
        study_hours_per_day,
    ]])

    # Raw probabilities
    proba    = clf.predict_proba(X)[0]           # shape: (n_classes,)
    pred_idx = int(np.argmax(proba))
    classes  = list(le.classes_)                 # ['At Risk', 'Average', 'Good']

    risk_level  = classes[pred_idx]
    confidence  = float(proba[pred_idx])
    probabilities = {cls: round(float(p), 4) for cls, p in zip(classes, proba)}

    # ── Key factors (feature importance + value analysis) ────────────────────
    importances    = clf.feature_importances_
    sorted_indices = np.argsort(importances)[::-1]
    values         = X[0]

    key_factors = []
    thresholds = {
        "attendance_percentage": (75, "Attendance is below recommended 75%"),
        "internal_marks":        (60, "Internal marks below passing threshold"),
        "assignment_score":      (60, "Assignment scores need improvement"),
        "study_hours_per_day":   (3,  "Study hours are insufficient (< 3 hrs/day)"),
    }

    for idx in sorted_indices:
        feat  = features[idx]
        value = values[idx]
        thr, msg = thresholds[feat]
        if value < thr:
            key_factors.append(f"{feat.replace('_', ' ').title()}: {value} (below {thr})")
        else:
            key_factors.append(f"{feat.replace('_', ' ').title()}: {value} (within range)")

    return {
        "risk_level":    risk_level,
        "confidence":    round(confidence, 4),
        "probabilities": probabilities,
        "key_factors":   key_factors,
    }


def is_model_ready() -> bool:
    return os.path.exists(MODEL_PATH)
