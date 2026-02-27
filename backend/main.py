"""
AI-Based Student Performance Prediction and Advisory System
============================================================
FastAPI Backend  |  Python 3.10+

Endpoints:
  GET    /api/health                      → system health & model status
  POST   /api/train                       → train / retrain the ML model
  POST   /api/predict                     → predict + explain + advise a single student
  GET    /api/dashboard                   → aggregated teacher dashboard stats
  GET    /api/predictions                 → paginated prediction history
  DELETE /api/predictions/{id}            → delete a prediction record
  GET    /api/dataset/info                → dataset statistics
  POST   /api/batch-upload                → bulk predict from uploaded CSV
  GET    /api/student/{student_id}/progress → per-student prediction timeline
  GET    /api/alerts                      → students with consecutive At Risk flags
  GET    /api/rankings                    → all students ranked by composite score
  GET    /api/export                      → download predictions as CSV
  GET    /api/model/insights              → feature importances + training history
  GET    /api/training-history            → list of past training runs
  GET    /api/student-clusters            → t-SNE + KMeans behaviour cluster analysis (IEEE)
"""

import io
import os
import sys
import csv
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# ── Ensure backend directory is on path ──────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from models.schemas import (
    StudentInput, TrainResponse,
    BatchUploadResponse, AlertsResponse, AlertStudent,
    StudentProgressResponse, RankingsResponse, RankingEntry,
    ModelInsightsResponse, TrainingHistoryEntry,
)
from ml_model import predict as predictor
from ml_model import train as trainer
from ai_advisory.advisor import get_explanation_and_advisory
import database as db
from ml_analysis import analysis_service as cluster_svc

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Student Performance Advisory System",
    version="2.0.0",
    description=(
        "Predicts student academic risk levels using RandomForestClassifier "
        "and provides AI-generated explanations and study advisory. "
        "Institutional SaaS edition with SQLite persistence."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    db.init_db()
    # Auto-seed demo data if database is empty (first launch)
    if db.get_prediction_count() == 0:
        import threading
        def _background_seed():
            try:
                _auto_train()
                from demo_seed import seed_demo_data
                seed_demo_data()
                cluster_svc.invalidate_cache()
                print("[STARTUP] Demo data seeded: 25 students ready")
            except Exception as e:
                print(f"[STARTUP] Auto-seed failed: {e}")
        threading.Thread(target=_background_seed, daemon=True).start()


# ─── shared helpers ───────────────────────────────────────────────────────────

def _auto_train():
    """Train and reload model if not ready."""
    if not predictor.is_model_ready():
        try:
            trainer.train_model()
            predictor.reload_model()
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Model not ready and auto-training failed: {exc}"
            )


def _run_prediction(student: StudentInput, batch_id: str = None) -> dict:
    """Core predict + advise pipeline. Returns a storable record dict."""
    _auto_train()

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
    except Exception:
        advisory = {
            "explanation":    "Advisory generation failed. Please review input data manually.",
            "risk_factors":   [],
            "strengths":      [],
            "recommendations": [
                {"priority": 1, "category": "Attendance",      "action": "Ensure attendance is above 75%.",       "timeframe": "2 weeks",  "expected_impact": "Reduces At-Risk probability."},
                {"priority": 2, "category": "Internal Marks",  "action": "Target 60+ in internal marks.",         "timeframe": "3 weeks",  "expected_impact": "Passes the critical threshold."},
                {"priority": 3, "category": "Assignment Score","action": "Submit all assignments on time.",        "timeframe": "1 week",   "expected_impact": "Improves composite score."},
                {"priority": 4, "category": "Study Hours",     "action": "Study at least 3 hours daily.",         "timeframe": "Ongoing",  "expected_impact": "Builds consistent retention."},
            ],
            "weekly_plan":    {},
            "report_summary": "Advisory generation failed. Manual review recommended.",
            "fallback_used":  True,
            "ai_provider":    "rule-based",
        }

    record = {
        "id":              str(uuid.uuid4()),
        "student_id":      student.student_id,
        "student_name":    student.student_name,
        "risk_level":      ml_result["risk_level"],
        "confidence":      ml_result["confidence"],
        "probabilities":   ml_result["probabilities"],
        "key_factors":     ml_result["key_factors"],
        "explanation":     advisory["explanation"],
        "risk_factors":    advisory.get("risk_factors", []),
        "strengths":       advisory.get("strengths", []),
        "recommendations": advisory["recommendations"],
        "weekly_plan":     advisory.get("weekly_plan", {}),
        "report_summary":  advisory.get("report_summary", ""),
        "fallback_used":   advisory["fallback_used"],
        "ai_provider":     advisory.get("ai_provider", "rule-based"),
        "inputs": {
            "attendance_percentage": student.attendance_percentage,
            "internal_marks":        student.internal_marks,
            "assignment_score":      student.assignment_score,
            "study_hours_per_day":   student.study_hours_per_day,
        },
        "timestamp":    datetime.now().isoformat(),
        "section":      student.section,
        "department":   student.department,
        "current_year": student.current_year,
    }
    db.insert_prediction(record, batch_id=batch_id)
    return record


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  HEALTH                                                                      ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/health")
def health():
    stats = db.get_dashboard_stats()
    has_gemini    = bool(os.getenv("GEMINI_API_KEY", "").strip())
    has_openai    = bool(os.getenv("OPENAI_API_KEY", "").strip())
    ai_configured = has_gemini or has_openai
    ai_provider   = "gemini" if has_gemini else ("openai" if has_openai else "rule-based")
    return {
        "status": "ok",
        "model_ready": predictor.is_model_ready(),
        "openai_configured": ai_configured,   # kept for backward-compat
        "ai_provider": ai_provider,
        "predictions_stored": stats["total_students"],
    }


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  TRAINING                                                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.post("/api/train", response_model=TrainResponse)
def train_model():
    try:
        result = trainer.train_model()
        predictor.reload_model()
        db.insert_training_history(
            accuracy=result["accuracy"],
            cv_score=result.get("cv_score"),
            dataset_rows=result["dataset_rows"],
            feature_importances=result["feature_importances"],
        )
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
# ║  DEMO RESET                                                                  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.post("/api/demo/reset")
def reset_demo():
    """Clear all predictions and batch jobs, re-seed 25 demo students."""
    try:
        from demo_seed import reset_demo_data
        result = reset_demo_data()
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Demo reset failed: {exc}")


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  SINGLE PREDICTION                                                           ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.post("/api/predict")
def predict_student(student: StudentInput):
    return _run_prediction(student)


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  TEACHER DASHBOARD                                                           ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/dashboard")
def get_dashboard():
    stats = db.get_dashboard_stats()
    recent = db.get_predictions(page=1, limit=10)["items"]
    return {**stats, "recent_predictions": recent}


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  PREDICTION HISTORY                                                          ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/predictions")
def get_predictions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = None,
    section: Optional[str] = Query(None),
):
    return db.get_predictions(page=page, limit=limit, risk_level=risk_level, search=search, section=section)


@app.delete("/api/predictions/{pred_id}")
def delete_prediction(pred_id: str):
    deleted = db.delete_prediction(pred_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"message": "Deleted", "id": pred_id}


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  DATASET INFO                                                                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/dataset/info")
def dataset_info():
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


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  BATCH UPLOAD                                                                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

BATCH_REQUIRED_COLS = {
    "student_id", "student_name", "department", "current_year",
    "section", "attendance", "CA_1_internal_marks", "assignments", "study_hours",
}

@app.post("/api/batch-upload")
async def batch_upload(file: UploadFile = File(...)):
    """
    Accept a CSV file with columns:
      student_name, student_id, attendance_percentage,
      internal_marks, assignment_score, study_hours_per_day
    Runs prediction for every valid row and returns results.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV is empty.")

    missing = BATCH_REQUIRED_COLS - set(r.strip() for r in (reader.fieldnames or []))
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV missing required columns: {', '.join(sorted(missing))}"
        )

    batch_id = str(uuid.uuid4())
    db.insert_batch_job(batch_id, file.filename, len(rows))

    results = []
    errors  = []
    for i, row in enumerate(rows):
        try:
            student = StudentInput(
                student_id=str(row["student_id"]).strip(),
                student_name=str(row["student_name"]).strip(),
                attendance_percentage=float(row["attendance"]),
                internal_marks=float(row["CA_1_internal_marks"]),
                assignment_score=float(row["assignments"]),
                study_hours_per_day=float(row["study_hours"]),
                section=str(row["section"]).strip(),
                department=str(row["department"]).strip(),
                current_year=int(float(row["current_year"])),
            )
            record = _run_prediction(student, batch_id=batch_id)
            results.append(record)
        except Exception as exc:
            errors.append({"row": i + 2, "error": str(exc)})

    db.update_batch_job(batch_id, len(results), "done")
    cluster_svc.invalidate_cache()

    return {
        "batch_id":  batch_id,
        "filename":  file.filename,
        "total":     len(rows),
        "processed": len(results),
        "failed":    len(errors),
        "errors":    errors[:10],
        "results":   results,
    }


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  STUDENT PROGRESS                                                            ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/student/{student_id}/progress")
def student_progress(student_id: str):
    history = db.get_all_predictions_for_student(student_id)
    if not history:
        raise HTTPException(status_code=404, detail="No records found for this student.")
    return {
        "student_id":   student_id,
        "student_name": history[0]["student_name"],
        "history":      history,
        "total":        len(history),
    }


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  ALERTS                                                                      ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/alerts")
def get_alerts(min_consecutive: int = Query(2, ge=1)):
    students = db.get_alerts(min_consecutive=min_consecutive)
    return {"count": len(students), "students": students}


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  RANKINGS                                                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/rankings")
def get_rankings():
    ranked = db.get_rankings()
    return {"total": len(ranked), "rankings": ranked}


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  EXPORT CSV                                                                  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/export")
def export_predictions():
    """Stream all predictions as a downloadable CSV file."""
    all_data = db.get_predictions(page=1, limit=100000)["items"]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "student_id", "student_name", "risk_level", "confidence",
        "attendance_percentage", "internal_marks", "assignment_score",
        "study_hours_per_day", "explanation", "timestamp",
    ])
    for r in all_data:
        inp = r.get("inputs", {})
        writer.writerow([
            r["student_id"], r["student_name"], r["risk_level"],
            round(r["confidence"] * 100, 1),
            inp.get("attendance_percentage", ""),
            inp.get("internal_marks", ""),
            inp.get("assignment_score", ""),
            inp.get("study_hours_per_day", ""),
            r.get("explanation", ""),
            r["timestamp"],
        ])

    output.seek(0)
    filename = f"predictions_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  MODEL INSIGHTS                                                              ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/model/insights")
def model_insights():
    history = db.get_training_history()

    # Feature importances from the loaded model (if ready)
    fi = {}
    if predictor.is_model_ready():
        try:
            payload = predictor._load_payload()
            model  = payload["model"]
            feats  = payload["feature_cols"]
            fi = {f: round(float(imp), 4)
                  for f, imp in zip(feats, model.feature_importances_)}
        except Exception:
            pass

    return {
        "feature_importances":  fi,
        "training_history":     history,
        "current_accuracy":     history[0]["accuracy"] if history else None,
        "last_trained":         history[0]["trained_at"] if history else None,
    }


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  TRAINING HISTORY                                                            ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/training-history")
def training_history():
    return {"history": db.get_training_history()}


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  STUDENT BEHAVIOUR CLUSTERS  (IEEE — t-SNE + KMeans)                         ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.get("/api/student-clusters")
def student_clusters(refresh: bool = Query(False)):
    """
    Return t-SNE 2D coordinates + KMeans cluster labels for all students.

    Results are computed once and cached in memory.  Pass ?refresh=true to
    force recomputation (e.g. after the dataset has been regenerated).

    Response schema:
        {
            "total_students": int,
            "clusters": [
                {
                    "cluster_id":      int,
                    "student_count":   int,
                    "avg_attendance":  float,
                    "avg_marks":       float,
                    "avg_assignments": float,
                    "avg_study_hours": float,
                    "interpretation":  str
                }
            ],
            "points": [{"x": float, "y": float, "cluster": int}, ...]
        }
    """
    try:
        result = cluster_svc.get_student_clusters(force_recompute=refresh)
        return result
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Dataset not available. Please train the model first "
                f"(POST /api/train) to generate student_data.csv. Detail: {exc}"
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Clustering error: {exc}")


# ── Run directly ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
