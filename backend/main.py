"""
AI-Based Student Performance Prediction and Advisory System
============================================================
FastAPI Backend  |  Python 3.10+

Endpoints:
  GET  /api/health              → system health & model status
  POST /api/train               → train / retrain the ML model
  POST /api/predict             → predict + explain + advise a single student
  GET  /api/dashboard           → aggregated teacher dashboard stats
  GET  /api/predictions         → paginated prediction history
  GET  /api/dataset/info        → dataset statistics
"""

import os
import sys
import json
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

# ── Ensure backend directory is on path ──────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from models.schemas import (
    StudentInput, PredictionResult, ExplanationRequest,
    ExplanationResponse, DashboardStats, TrainResponse
)
from ml_model import predict as predictor
from ml_model import train as trainer
from ai_advisory.advisor import get_explanation_and_advisory

# ── In-memory prediction store (replace with SQLite for persistence) ──────────
_prediction_history: List[dict] = []

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Student Performance Advisory System",
    version="1.0.0",
    description=(
        "Predicts student academic risk levels using RandomForestClassifier "
        "and provides AI-generated explanations and study advisory."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  HEALTH                                                                      ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model_ready": predictor.is_model_ready(),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY", "").strip()),
        "predictions_in_memory": len(_prediction_history),
    }


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  TRAINING                                                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.post("/api/train", response_model=TrainResponse)
def train_model():
    """
    Trains the RandomForestClassifier.
    Auto-generates synthetic dataset if student_data.csv is absent.
    """
    try:
        result = trainer.train_model()
        predictor.reload_model()        # refresh cached payload
        return TrainResponse(
            message="Model trained successfully",
            accuracy=result["accuracy"],
            model_path=result["model_path"],
            dataset_rows=result["dataset_rows"],
            feature_importances=result["feature_importances"],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  PREDICTION + EXPLANATION + ADVISORY                                         ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.post("/api/predict")
def predict_student(student: StudentInput):
    """
    Full pipeline: ML prediction → AI explanation → AI advisory.

    Steps:
      1. Validate input
      2. Auto-train model if not present
      3. Run RandomForest prediction
      4. Call AI advisory module (OpenAI or fallback)
      5. Store result in memory
      6. Return unified response
    """
    # ── Auto-train if model missing ───────────────────────────────────────────
    if not predictor.is_model_ready():
        try:
            trainer.train_model()
            predictor.reload_model()
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Model not ready and auto-training failed: {exc}"
            )

    # ── ML Prediction ─────────────────────────────────────────────────────────
    try:
        ml_result = predictor.predict(
            attendance_percentage=student.attendance_percentage,
            internal_marks=student.internal_marks,
            assignment_score=student.assignment_score,
            study_hours_per_day=student.study_hours_per_day,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction error: {exc}")

    # ── AI Explanation + Advisory ─────────────────────────────────────────────
    try:
        advisory = get_explanation_and_advisory(
            student_name=student.student_name,
            attendance=student.attendance_percentage,
            internal_marks=student.internal_marks,
            assignment_score=student.assignment_score,
            study_hours=student.study_hours_per_day,
            risk_level=ml_result["risk_level"],
            confidence=ml_result["confidence"],
            key_factors=ml_result["key_factors"],
        )
    except Exception as exc:
        # Non-fatal: return prediction with fallback advisory
        advisory = {
            "explanation": "Advisory generation failed. Please review input data manually.",
            "recommendations": [
                "Ensure attendance is above 75%.",
                "Target 60+ in internal marks.",
                "Submit all assignments on time.",
                "Study at least 3 hours daily.",
            ],
            "fallback_used": True,
        }

    # ── Build response ────────────────────────────────────────────────────────
    timestamp = datetime.now().isoformat()
    record = {
        "id":              str(uuid.uuid4()),
        "student_id":      student.student_id,
        "student_name":    student.student_name,
        "risk_level":      ml_result["risk_level"],
        "confidence":      ml_result["confidence"],
        "probabilities":   ml_result["probabilities"],
        "key_factors":     ml_result["key_factors"],
        "explanation":     advisory["explanation"],
        "recommendations": advisory["recommendations"],
        "fallback_used":   advisory["fallback_used"],
        "inputs": {
            "attendance_percentage": student.attendance_percentage,
            "internal_marks":        student.internal_marks,
            "assignment_score":      student.assignment_score,
            "study_hours_per_day":   student.study_hours_per_day,
        },
        "timestamp": timestamp,
    }

    _prediction_history.append(record)

    return record


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  TEACHER DASHBOARD                                                           ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/dashboard")
def get_dashboard():
    """Aggregated statistics for the teacher dashboard."""
    if not _prediction_history:
        return {
            "total_students":         0,
            "risk_distribution":      {"Good": 0, "Average": 0, "At Risk": 0},
            "average_attendance":     0,
            "average_internal_marks": 0,
            "average_assignment_score": 0,
            "average_study_hours":    0,
            "recent_predictions":     [],
        }

    dist = {"Good": 0, "Average": 0, "At Risk": 0}
    total_att = total_marks = total_assign = total_hours = 0

    for rec in _prediction_history:
        dist[rec["risk_level"]] = dist.get(rec["risk_level"], 0) + 1
        inp = rec["inputs"]
        total_att    += inp["attendance_percentage"]
        total_marks  += inp["internal_marks"]
        total_assign += inp["assignment_score"]
        total_hours  += inp["study_hours_per_day"]

    n = len(_prediction_history)

    return {
        "total_students":           n,
        "risk_distribution":        dist,
        "average_attendance":       round(total_att / n, 1),
        "average_internal_marks":   round(total_marks / n, 1),
        "average_assignment_score": round(total_assign / n, 1),
        "average_study_hours":      round(total_hours / n, 1),
        "recent_predictions":       _prediction_history[-10:][::-1],
    }


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  PREDICTION HISTORY                                                          ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/predictions")
def get_predictions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = Query(None, regex="^(Good|Average|At Risk)$"),
    search: Optional[str] = None,
):
    """Paginated + filterable prediction history."""
    filtered = _prediction_history.copy()

    if risk_level:
        filtered = [r for r in filtered if r["risk_level"] == risk_level]
    if search:
        s = search.lower()
        filtered = [
            r for r in filtered
            if s in r["student_name"].lower() or s in r["student_id"].lower()
        ]

    total = len(filtered)
    start = (page - 1) * limit
    end   = start + limit
    items = filtered[::-1][start:end]      # newest first

    return {
        "total":  total,
        "page":   page,
        "limit":  limit,
        "items":  items,
    }


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  DATASET INFO                                                                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/dataset/info")
def dataset_info():
    """Returns summary statistics about the training dataset."""
    import pandas as pd
    data_path = os.path.join(os.path.dirname(__file__), "data", "student_data.csv")
    if not os.path.exists(data_path):
        return {"available": False, "message": "Dataset not generated yet. Train the model first."}

    df = pd.read_csv(data_path)
    dist = df["performance_label"].value_counts().to_dict()

    return {
        "available":    True,
        "total_rows":   len(df),
        "label_distribution": dist,
        "feature_stats": {
            col: {
                "mean": round(float(df[col].mean()), 2),
                "std":  round(float(df[col].std()), 2),
                "min":  round(float(df[col].min()), 2),
                "max":  round(float(df[col].max()), 2),
            }
            for col in ["attendance_percentage", "internal_marks",
                        "assignment_score", "study_hours_per_day"]
        },
    }


# ── Run directly ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
