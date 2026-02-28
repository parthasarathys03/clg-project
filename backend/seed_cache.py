"""
Seed Demo Cache Script
======================
Populates advisory_cache with entries for all 25 demo students.
Uses existing predictions or generates new advisories via Ollama.
After this, /api/demo/reset will be INSTANT (zero AI calls).
"""
import os
import sys
import json
import time
import hashlib
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

import database as db
from demo_seed import DEMO_STUDENTS, get_demo_students
from ai_advisory.advisor import _metrics_hash, _build_risk_factors

# Check Ollama availability
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")


def generate_ollama_advisory(student_name, attendance, marks, assignment, study_hours, risk_level):
    """Generate advisory using Ollama directly (simplified prompt for speed)."""
    prompt = f"""Generate a JSON academic advisory for a student.

Student: {student_name}
Attendance: {attendance}%
Internal Marks: {marks}/100
Assignment Score: {assignment}/100
Study Hours/Day: {study_hours}
Risk Level: {risk_level}

Return ONLY valid JSON with these exact keys:
{{
  "explanation": "2-3 sentences analyzing the student's academic performance based on the metrics",
  "strengths": ["1-2 positive points about the student"],
  "recommendations": [
    {{"priority": 1, "category": "Study Hours", "action": "Specific action", "timeframe": "1 week", "expected_impact": "Expected improvement"}},
    {{"priority": 2, "category": "Attendance", "action": "Specific action", "timeframe": "2 weeks", "expected_impact": "Expected improvement"}},
    {{"priority": 3, "category": "Internal Marks", "action": "Specific action", "timeframe": "1 month", "expected_impact": "Expected improvement"}},
    {{"priority": 4, "category": "General", "action": "General advice", "timeframe": "Ongoing", "expected_impact": "Continuous improvement"}}
  ],
  "weekly_plan": {{
    "Monday": "Study activity for Monday",
    "Tuesday": "Study activity for Tuesday",
    "Wednesday": "Study activity for Wednesday",
    "Thursday": "Study activity for Thursday",
    "Friday": "Study activity for Friday",
    "Saturday": "Review activity for Saturday",
    "Sunday": "Rest and preparation for Sunday"
  }},
  "report_summary": "Brief summary for institutional report"
}}

Output ONLY the JSON, no other text."""

    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            format="json",
            options={"temperature": 0.3},
        )
        data = json.loads(response.message.content)
        return data
    except Exception as e:
        print(f"  Ollama error: {e}")
        return None


def get_risk_level(attendance, marks, assignment, study_hours):
    """Quick risk classification."""
    score = (attendance * 0.3 + marks * 0.35 + assignment * 0.2 + min(study_hours * 10, 100) * 0.15)
    if score >= 70:
        return "Good"
    elif score >= 50:
        return "Average"
    return "At Risk"


def seed_cache():
    """Populate advisory_cache for all 25 demo students."""
    print("=" * 60)
    print("DEMO CACHE SEEDING")
    print("=" * 60)
    
    students = get_demo_students()
    cached = 0
    generated = 0
    failed = 0
    
    for i, s in enumerate(students, 1):
        sid = s["student_id"]
        name = s["student_name"]
        att = s["attendance_percentage"]
        marks = s["internal_marks"]
        assign = s["assignment_score"]
        hours = s["study_hours_per_day"]
        
        # Calculate cache key
        cache_key = _metrics_hash(sid, att, marks, assign, hours)
        
        # Check if already cached
        existing = db.get_cached_advisory(cache_key)
        if existing:
            print(f"[{i:2d}/25] {name}: ✓ Already cached")
            cached += 1
            continue
        
        # Try to find from existing predictions
        history = db.get_all_predictions_for_student(sid)
        if history:
            # Use latest prediction's advisory
            latest = history[-1]
            advisory = {
                "explanation": latest.get("explanation", ""),
                "strengths": latest.get("strengths", []),
                "recommendations": latest.get("recommendations", []),
                "weekly_plan": latest.get("weekly_plan", {}),
                "report_summary": latest.get("report_summary", ""),
                "fallback_used": latest.get("fallback_used", False),
                "ai_provider": latest.get("ai_provider", "gemini"),
                "model_name": latest.get("model_name", ""),
            }
            if advisory["explanation"]:
                db.store_cached_advisory(
                    cache_key=cache_key,
                    student_id=sid,
                    metrics_hash=cache_key,
                    ai_response=advisory,
                    ai_provider=advisory.get("ai_provider", "gemini"),
                    model_name=advisory.get("model_name", ""),
                )
                print(f"[{i:2d}/25] {name}: ✓ Cached from existing prediction")
                cached += 1
                continue
        
        # Generate new advisory via Ollama
        if OLLAMA_AVAILABLE:
            print(f"[{i:2d}/25] {name}: Generating via Ollama...", end=" ", flush=True)
            risk = get_risk_level(att, marks, assign, hours)
            advisory_data = generate_ollama_advisory(name, att, marks, assign, hours, risk)
            
            if advisory_data:
                advisory = {
                    "explanation": advisory_data.get("explanation", ""),
                    "strengths": advisory_data.get("strengths", []),
                    "recommendations": advisory_data.get("recommendations", []),
                    "weekly_plan": advisory_data.get("weekly_plan", {}),
                    "report_summary": advisory_data.get("report_summary", ""),
                    "fallback_used": True,
                    "ai_provider": "ollama",
                    "model_name": OLLAMA_MODEL,
                }
                db.store_cached_advisory(
                    cache_key=cache_key,
                    student_id=sid,
                    metrics_hash=cache_key,
                    ai_response=advisory,
                    ai_provider="ollama",
                    model_name=OLLAMA_MODEL,
                )
                print("✓ Generated & cached")
                generated += 1
                time.sleep(1)  # Rate limiting
                continue
            else:
                print("✗ Failed")
                failed += 1
        else:
            print(f"[{i:2d}/25] {name}: ✗ No Ollama available")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"RESULTS: {cached} cached, {generated} generated, {failed} failed")
    print(f"Total cache entries: {db.get_advisory_cache_count()}")
    print("=" * 60)
    
    if cached + generated == 25:
        print("\n✓ All 25 demo students cached!")
        print("→ /api/demo/reset will now be INSTANT (zero AI calls)")
    
    return cached + generated


if __name__ == "__main__":
    seed_cache()
