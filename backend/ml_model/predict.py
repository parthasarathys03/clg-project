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


def _apply_hard_rules(
    risk_level: str,
    attendance: float,
    internal_marks: float,
    assignment_score: float,
    study_hours: float,
) -> str:
    """
    Post-ML institutional hard rules.

    The RandomForest may give "Average" when one metric is catastrophically low
    but others are excellent (e.g. attendance=20, marks=100).  These rules
    enforce minimum thresholds that override the model for such edge cases.

    Edge case 1 — Critically low attendance (<50 %)
      Most universities bar students from sitting exams below ~60 % attendance.
      No matter how good the marks are, the student cannot progress → At Risk.

    Edge case 2 — Critical failure in marks / hours
      A single metric below 35 % of its threshold signals fundamental disengagement.

    Edge case 3 — Three or more metrics simultaneously below threshold
      Broad underperformance the model may still rate "Average" → force At Risk.

    Edge case 4 — Downgrade unwarranted "Good" when attendance is below threshold
      A student cannot be "Good" while missing more than 1-in-4 classes.
    """
    # Rule 1: Attendance critically low — bars from exams
    if attendance < 50:
        return "At Risk"

    # Rule 2: Internal marks in critical failure zone
    if internal_marks < 35:
        return "At Risk"

    # Rule 3: Assignment score in critical failure zone
    if assignment_score < 35:
        return "At Risk"

    # Rule 4: Negligible study time combined with attendance shortfall
    if study_hours < 1.5 and attendance < 75:
        return "At Risk"

    # Rule 5: Three or more metrics below their threshold simultaneously
    below = sum([
        attendance    < 75,
        internal_marks < 60,
        assignment_score < 60,
        study_hours   < 3,
    ])
    if below >= 3:
        return "At Risk"

    # Rule 6: Cannot be "Good" while attendance is below the minimum threshold
    if attendance < 75 and risk_level == "Good":
        return "Average"

    return risk_level


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

    ml_risk_level = classes[pred_idx]
    probabilities = {cls: round(float(p), 4) for cls, p in zip(classes, proba)}

    # Apply institutional hard rules — overrides model for extreme edge cases
    risk_level = _apply_hard_rules(
        ml_risk_level,
        attendance_percentage,
        internal_marks,
        assignment_score,
        study_hours_per_day,
    )

    # Confidence: if hard rule overrode the ML verdict, use the probability of the
    # overridden class so the number stays consistent with the displayed label.
    if risk_level != ml_risk_level and risk_level in classes:
        overridden_idx = classes.index(risk_level)
        confidence = float(proba[overridden_idx])
    else:
        confidence = float(proba[pred_idx])

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
