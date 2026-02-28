"""
Demo Seed Module  —  v2  (Cache-Backed Instant Reset)
=====================================================
Seeds 25 Tamil-named IT students across sections IT-A
for SKP Engineering College demo with realistic academic distribution:
  8 High Performing  ·  10 Average  ·  7 At-Risk

Architecture:
  - First seed: calls Gemini AI once per student, caches full response in DB
  - Reset: clears predictions → re-inserts from cache (INSTANT, no AI call)
  - Only calls AI again if cache is empty (first-ever launch)

Public API:
    get_demo_students() -> list[dict]
    seed_demo_data()    -> int          # runs predictions + caches, returns count
    reset_demo_data()   -> dict         # instant reset from cache
"""

import os
import sys
import time
import uuid
import logging
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import database as db
from models.schemas import StudentInput

logger = logging.getLogger("demo_seed")

# ── 25 demo students ─────────────────────────────────────────────────────────
# (student_id, student_name, section, attendance, marks, assignments, study_hours)

DEMO_STUDENTS = [
    # ── HIGH PERFORMING (8) ──────────────────────────────────────────────────
    ("SKP-IT-A01", "Aravind Kumar",      "IT-A", 92, 88, 90, 5.5),
    ("SKP-IT-A02", "Priya Dharshini",    "IT-A", 95, 91, 93, 6.0),
    ("SKP-IT-A03", "Karthikeyan R",      "IT-A", 88, 82, 85, 4.5),
    ("SKP-IT-A04", "Divya Lakshmi",      "IT-A", 90, 85, 88, 5.0),
    ("SKP-IT-A05", "Suriya Prakash",     "IT-A", 87, 80, 84, 4.0),
    ("SKP-IT-A06", "Nandhini S",         "IT-A", 93, 87, 91, 5.5),
    ("SKP-IT-A07", "Hariharan V",        "IT-A", 89, 83, 86, 4.5),
    ("SKP-IT-A08", "Swetha Ramesh",      "IT-A", 91, 86, 89, 5.0),

    # ── AVERAGE (10) ─────────────────────────────────────────────────────────
    ("SKP-IT-A09", "Muthu Krishnan",     "IT-A", 76, 62, 68, 3.0),
    ("SKP-IT-A10", "Sangeetha P",        "IT-A", 78, 65, 70, 3.5),
    ("SKP-IT-A11", "Vigneshwaran K",     "IT-A", 74, 58, 65, 2.5),
    ("SKP-IT-A12", "Tamilselvi M",       "IT-A", 77, 63, 67, 3.0),
    ("SKP-IT-A13", "Saravanan J",        "IT-A", 75, 60, 66, 2.5),
    ("SKP-IT-A14", "Kavitha Devi",       "IT-A", 79, 64, 69, 3.0),
    ("SKP-IT-A15", "Balamurugan S",      "IT-A", 73, 57, 63, 2.5),
    ("SKP-IT-A16", "Meenakshi R",        "IT-A", 76, 61, 66, 3.0),
    ("SKP-IT-A17", "Dinesh Kumar P",     "IT-A", 80, 66, 71, 3.5),
    ("SKP-IT-A18", "Jayashree V",        "IT-A", 75, 59, 64, 2.5),

    # ── AT RISK (7) ──────────────────────────────────────────────────────────
    ("SKP-IT-A19", "Ranjith Kumar",      "IT-A", 48, 32, 38, 1.0),
    ("SKP-IT-A20", "Deepika S",          "IT-A", 52, 38, 42, 1.5),
    ("SKP-IT-A21", "Manikandan R",       "IT-A", 45, 28, 35, 0.5),
    ("SKP-IT-A22", "Sathya Priya",       "IT-A", 55, 40, 45, 1.5),
    ("SKP-IT-A23", "Vikram S",           "IT-A", 50, 35, 40, 1.0),
    ("SKP-IT-A24", "Lakshmi Priya",      "IT-A", 58, 42, 48, 2.0),
    ("SKP-IT-A25", "Ashwin Kumar",       "IT-A", 42, 30, 33, 0.5),
]


def get_demo_students() -> list:
    """Return list of StudentInput-compatible dicts for all 25 demo students."""
    return [
        {
            "student_id":            sid,
            "student_name":          name,
            "attendance_percentage": float(att),
            "internal_marks":        float(marks),
            "assignment_score":      float(assign),
            "study_hours_per_day":   float(hours),
            "section":               _section,
            "department":            "Information Technology",
            "current_year":          4,
        }
        for sid, name, _section, att, marks, assign, hours in DEMO_STUDENTS
    ]


def seed_demo_data() -> int:
    """
    Run ML prediction + AI advisory for all 25 demo students.
    Uses cache: if AI response already cached, skips API call entirely.
    Adds delay between AI calls to respect rate limits.
    Returns number of students seeded.
    """
    from main import _run_prediction

    count = 0
    students = get_demo_students()
    for i, s in enumerate(students):
        student = StudentInput(**s)
        _run_prediction(student)
        count += 1
        logger.info("DEMO_SEED seeded %d/%d: %s", count, len(students), s["student_name"])
        # Delay between API calls to respect Gemini rate limits
        if i < len(students) - 1:
            time.sleep(4)
    return count


def _seed_from_cache() -> int:
    """
    Re-insert 25 demo students using cached AI advisories from DB.
    No AI calls — instant insertion. Returns count of seeded students.
    """
    from ml_model import predict as predictor
    from ai_advisory.advisor import _build_risk_factors, _metrics_hash

    count = 0
    students = get_demo_students()

    for s in students:
        student = StudentInput(**s)

        # ML prediction (instant, no AI)
        ml_result = predictor.predict(
            attendance_percentage=student.attendance_percentage,
            internal_marks=student.internal_marks,
            assignment_score=student.assignment_score,
            study_hours_per_day=student.study_hours_per_day,
        )

        # Look up cached advisory
        cache_key = _metrics_hash(
            student.student_id,
            student.attendance_percentage,
            student.internal_marks,
            student.assignment_score,
            student.study_hours_per_day,
        )
        cached = db.get_cached_advisory(cache_key)

        if cached:
            advisory = cached
            risk_factors = _build_risk_factors(
                student.attendance_percentage, student.internal_marks,
                student.assignment_score, student.study_hours_per_day,
            )
        else:
            # Cache miss — this shouldn't happen if seed_demo_data ran before
            logger.warning("DEMO_CACHE_MISS student=%s — will need fresh AI call", s["student_name"])
            return -1  # Signal caller to do full seed

        record = {
            "id":              str(uuid.uuid4()),
            "student_id":      student.student_id,
            "student_name":    student.student_name,
            "risk_level":      ml_result["risk_level"],
            "confidence":      ml_result["confidence"],
            "probabilities":   ml_result["probabilities"],
            "key_factors":     ml_result["key_factors"],
            "explanation":     advisory.get("explanation", ""),
            "risk_factors":    risk_factors,
            "strengths":       advisory.get("strengths", []),
            "recommendations": advisory.get("recommendations", []),
            "weekly_plan":     advisory.get("weekly_plan", {}),
            "report_summary":  advisory.get("report_summary", ""),
            "fallback_used":   advisory.get("fallback_used", False),
            "ai_provider":     advisory.get("ai_provider", "gemini"),
            "model_name":      advisory.get("model_name", ""),
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
        db.insert_prediction(record)
        count += 1

    logger.info("DEMO_SEED_FROM_CACHE completed: %d students inserted instantly", count)
    return count


def reset_demo_data() -> dict:
    """
    Clear all predictions and batch jobs, then re-seed 25 demo students.
    Uses cached AI advisories for INSTANT reset (no Gemini calls).
    If cache is empty, falls back to full AI generation.
    """
    from main import _auto_train
    from ml_analysis import analysis_service as cluster_svc

    # 1. Clear predictions and batch jobs
    db.clear_predictions()
    db.clear_batch_jobs()

    # 2. Invalidate stale cluster cache
    cluster_svc.invalidate_cache()

    # 3. Ensure model is trained
    _auto_train()

    # 4. Try instant reset from cache
    cache_count = db.get_advisory_cache_count()
    if cache_count >= len(DEMO_STUDENTS):
        count = _seed_from_cache()
        if count > 0:
            cluster_svc.invalidate_cache()
            logger.info("DEMO_RESET_INSTANT students=%d from_cache=True", count)
            return {"message": "Demo reset complete (instant from cache)", "students_seeded": count, "from_cache": True}
        # Cache miss — fall through to full seed

    # 5. Full seed with AI (first time only)
    logger.info("DEMO_RESET_FULL_SEED cache_entries=%d needed=%d", cache_count, len(DEMO_STUDENTS))
    count = seed_demo_data()
    cluster_svc.invalidate_cache()

    return {"message": "Demo reset complete (AI generated)", "students_seeded": count, "from_cache": False}
