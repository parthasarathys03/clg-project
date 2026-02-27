"""
Demo Seed Module
================
Seeds 25 Tamil-named IT students across sections IT-A, IT-B, IT-C
for SKP Engineering College demo with realistic academic distribution:
  8 High Performing  ·  10 Average  ·  7 At-Risk

Public API:
    get_demo_students() -> list[dict]
    seed_demo_data()    -> int          # runs predictions, returns count
    reset_demo_data()   -> dict         # clears DB, re-seeds, returns summary
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import database as db
from models.schemas import StudentInput

# ── 25 demo students ─────────────────────────────────────────────────────────
# (student_id, student_name, section, attendance, marks, assignments, study_hours)

DEMO_STUDENTS = [
    # ── HIGH PERFORMING (8) ──────────────────────────────────────────────────
    ("SKP-IT-A01", "Aravind Kumar",      "IT-A", 92, 88, 90, 5.5),
    ("SKP-IT-A02", "Priya Dharshini",    "IT-A", 95, 91, 93, 6.0),
    ("SKP-IT-B01", "Karthikeyan R",      "IT-A", 88, 82, 85, 4.5),
    ("SKP-IT-B02", "Divya Lakshmi",      "IT-A", 90, 85, 88, 5.0),
    ("SKP-IT-C01", "Suriya Prakash",     "IT-A", 87, 80, 84, 4.0),
    ("SKP-IT-A03", "Nandhini S",         "IT-A", 93, 87, 91, 5.5),
    ("SKP-IT-B03", "Hariharan V",        "IT-A", 89, 83, 86, 4.5),
    ("SKP-IT-C02", "Swetha Ramesh",      "IT-A", 91, 86, 89, 5.0),

    # ── AVERAGE (10) ─────────────────────────────────────────────────────────
    ("SKP-IT-A04", "Muthu Krishnan",     "IT-A", 76, 62, 68, 3.0),
    ("SKP-IT-A05", "Sangeetha P",        "IT-A", 78, 65, 70, 3.5),
    ("SKP-IT-B04", "Vigneshwaran K",     "IT-A", 74, 58, 65, 2.5),
    ("SKP-IT-B05", "Tamilselvi M",       "IT-A", 77, 63, 67, 3.0),
    ("SKP-IT-C03", "Saravanan J",        "IT-A", 75, 60, 66, 2.5),
    ("SKP-IT-C04", "Kavitha Devi",       "IT-A", 79, 64, 69, 3.0),
    ("SKP-IT-A06", "Balamurugan S",      "IT-A", 73, 57, 63, 2.5),
    ("SKP-IT-B06", "Meenakshi R",        "IT-A", 76, 61, 66, 3.0),
    ("SKP-IT-C05", "Dinesh Kumar P",     "IT-A", 80, 66, 71, 3.5),
    ("SKP-IT-A07", "Jayashree V",        "IT-A", 75, 59, 64, 2.5),

    # ── AT RISK (7) ──────────────────────────────────────────────────────────
    ("SKP-IT-A08", "Ranjith Kumar",      "IT-A", 48, 32, 38, 1.0),
    ("SKP-IT-B07", "Deepika S",          "IT-A", 52, 38, 42, 1.5),
    ("SKP-IT-C06", "Manikandan R",       "IT-A", 45, 28, 35, 0.5),
    ("SKP-IT-B08", "Sathya Priya",       "IT-A", 55, 40, 45, 1.5),
    ("SKP-IT-C07", "Vikram S",           "IT-A", 50, 35, 40, 1.0),
    ("SKP-IT-A09", "Lakshmi Priya",      "IT-A", 58, 42, 48, 2.0),
    ("SKP-IT-C08", "Ashwin Kumar",       "IT-A", 42, 30, 33, 0.5),
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
    Run ML prediction + AI advisory for all 25 demo students and store in DB.
    The model must be ready before calling this (caller ensures auto-train).
    Returns number of students seeded.
    """
    # Import inside function to avoid circular import (demo_seed ↔ main)
    from main import _run_prediction

    count = 0
    for s in get_demo_students():
        student = StudentInput(**s)
        _run_prediction(student)
        count += 1
    return count


def reset_demo_data() -> dict:
    """
    Clear all predictions and batch jobs, then re-seed 25 demo students.
    Preserves training_history and model.pkl (no re-training needed).
    Returns summary dict.
    """
    from main import _auto_train
    from ml_analysis import analysis_service as cluster_svc

    # 1. Clear predictions and batch jobs
    db.clear_predictions()
    db.clear_batch_jobs()

    # 2. Invalidate stale cluster cache
    cluster_svc.invalidate_cache()

    # 3. Ensure model is trained (no-op if model.pkl exists)
    _auto_train()

    # 4. Re-seed all 25 demo students
    count = seed_demo_data()

    # 5. Invalidate cluster cache again (new prediction data)
    cluster_svc.invalidate_cache()

    return {"message": "Demo data reset successfully", "students_seeded": count}
