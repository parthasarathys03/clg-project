"""
AI Advisory Module
===================
Uses OpenAI (gpt-3.5-turbo) to generate:
  1. Grounded explanation  – WHY the prediction occurred
  2. Actionable advisory   – HOW the student can improve

Falls back to rule-based logic when the API key is absent or the call fails.
"""

import os
import textwrap
from typing import Tuple, List

# ── OpenAI ───────────────────────────────────────────────────────────────────
try:
    from openai import OpenAI
    _openai_available = True
except ImportError:
    _openai_available = False


def _get_client():
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key or api_key == "your-openai-api-key-here":
        return None
    if not _openai_available:
        return None
    return OpenAI(api_key=api_key)


# ── LLM call ─────────────────────────────────────────────────────────────────

def _call_llm(
    student_name: str,
    attendance: float,
    internal_marks: float,
    assignment_score: float,
    study_hours: float,
    risk_level: str,
    confidence: float,
    key_factors: List[str],
) -> Tuple[str, List[str]]:
    """Returns (explanation_str, recommendations_list)."""

    client = _get_client()
    if client is None:
        return _rule_based(
            student_name, attendance, internal_marks,
            assignment_score, study_hours, risk_level
        )

    factors_text = "\n".join(f"  • {f}" for f in key_factors)

    system_prompt = textwrap.dedent("""
        You are an academic advisor AI for a university student monitoring system.
        Your responses must be grounded strictly in the data provided.
        Do NOT invent statistics or make claims not supported by the input.
        Use professional, empathetic language appropriate for an educational setting.
    """).strip()

    user_prompt = textwrap.dedent(f"""
        A student's academic performance has been assessed by a machine-learning model.

        STUDENT DATA:
          Name               : {student_name}
          Attendance          : {attendance}%
          Internal Marks      : {internal_marks}/100
          Assignment Score    : {assignment_score}/100
          Study Hours/Day     : {study_hours} hours

        ML PREDICTION:
          Risk Level         : {risk_level}
          Confidence         : {confidence * 100:.1f}%
          Key Contributing Factors:
{factors_text}

        TASK 1 – EXPLANATION (2–3 sentences):
        Explain specifically WHY this student received the "{risk_level}" prediction,
        referencing the above data. Do not add information not present in the data.

        TASK 2 – RECOMMENDATIONS (exactly 4 bullet points):
        Provide 4 concrete, actionable study-improvement recommendations tailored
        to this student's weak areas. Each bullet must start with "• ".

        FORMAT YOUR RESPONSE EXACTLY AS:
        EXPLANATION:
        <your explanation here>

        RECOMMENDATIONS:
        • <rec 1>
        • <rec 2>
        • <rec 3>
        • <rec 4>
    """).strip()

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=600,
        )
        raw = response.choices[0].message.content.strip()
        explanation, recommendations = _parse_llm_response(raw)
        return explanation, recommendations
    except Exception as exc:
        print(f"[Advisor] OpenAI call failed: {exc}. Using fallback.")
        return _rule_based(
            student_name, attendance, internal_marks,
            assignment_score, study_hours, risk_level
        )


def _parse_llm_response(raw: str) -> Tuple[str, List[str]]:
    """Extract explanation and bullet-point recommendations from LLM output."""
    explanation = ""
    recommendations = []

    lines = raw.split("\n")
    section = None
    for line in lines:
        stripped = line.strip()
        if stripped.upper().startswith("EXPLANATION:"):
            section = "explanation"
            rest = stripped[len("EXPLANATION:"):].strip()
            if rest:
                explanation += rest + " "
        elif stripped.upper().startswith("RECOMMENDATIONS:"):
            section = "recommendations"
        elif section == "explanation" and stripped and not stripped.startswith("•"):
            explanation += stripped + " "
        elif section == "recommendations" and stripped.startswith("•"):
            recommendations.append(stripped[1:].strip())

    if not explanation:
        explanation = raw[:300]
    if not recommendations:
        recommendations = ["Consult your academic advisor for personalized guidance."]

    return explanation.strip(), recommendations


# ── Rule-based fallback ───────────────────────────────────────────────────────

def _rule_based(
    student_name: str,
    attendance: float,
    internal_marks: float,
    assignment_score: float,
    study_hours: float,
    risk_level: str,
) -> Tuple[str, List[str]]:
    """Deterministic explanation + recommendations based on thresholds."""

    issues = []
    if attendance < 75:
        issues.append(f"low attendance ({attendance}%)")
    if internal_marks < 60:
        issues.append(f"low internal marks ({internal_marks}/100)")
    if assignment_score < 60:
        issues.append(f"weak assignment scores ({assignment_score}/100)")
    if study_hours < 3:
        issues.append(f"insufficient study time ({study_hours} hrs/day)")

    if risk_level == "Good":
        explanation = (
            f"{student_name} demonstrates strong academic performance with "
            f"attendance at {attendance}%, internal marks at {internal_marks}/100, "
            f"and assignment scores at {assignment_score}/100. "
            f"Consistent study habits of {study_hours} hours/day contribute positively."
        )
    elif risk_level == "At Risk":
        issue_str = ", ".join(issues) if issues else "multiple underperforming areas"
        explanation = (
            f"{student_name} has been flagged as 'At Risk' primarily due to {issue_str}. "
            f"With attendance at {attendance}%, internal marks at {internal_marks}/100, "
            f"and only {study_hours} study hours per day, immediate academic intervention is recommended."
        )
    else:
        issue_str = ", ".join(issues) if issues else "some areas needing improvement"
        explanation = (
            f"{student_name} shows average performance with concerns around {issue_str}. "
            f"Attendance stands at {attendance}%, internal marks at {internal_marks}/100, "
            f"and {study_hours} study hours daily. Targeted effort can move this student to 'Good' category."
        )

    # ── Recommendations ───────────────────────────────────────────────────────
    recs = []

    if attendance < 75:
        recs.append(
            f"Improve attendance to at least 75% — aim to attend all remaining classes "
            f"to raise your current {attendance}% rate."
        )
    else:
        recs.append("Maintain your current attendance above 75% — consistency is key to performance.")

    if internal_marks < 60:
        recs.append(
            f"Focus on scoring above 60 in internal assessments — review past papers "
            f"and practice problem sets to close the gap from {internal_marks}."
        )
    else:
        recs.append("Continue strong performance in internal assessments; aim for 80+ in upcoming exams.")

    if assignment_score < 60:
        recs.append(
            f"Prioritize assignment completion and quality — your current score of {assignment_score} "
            "indicates assignments are being rushed or skipped."
        )
    else:
        recs.append("Keep submitting high-quality assignments on time to sustain your score.")

    if study_hours < 3:
        recs.append(
            f"Increase daily study time to at least 3 hours — you are currently at {study_hours} hrs/day. "
            "Use a structured timetable and minimize distractions."
        )
    else:
        recs.append(
            "Supplement your study sessions with active recall techniques such as "
            "flashcards and spaced repetition to deepen subject understanding."
        )

    return explanation, recs[:4]


# ── Public API ────────────────────────────────────────────────────────────────

def get_explanation_and_advisory(
    student_name: str,
    attendance: float,
    internal_marks: float,
    assignment_score: float,
    study_hours: float,
    risk_level: str,
    confidence: float,
    key_factors: List[str],
) -> dict:
    """
    Main entry point.
    Returns:
      {
        "explanation": str,
        "recommendations": [str, ...],
        "fallback_used": bool
      }
    """
    client = _get_client()
    fallback = client is None

    explanation, recommendations = _call_llm(
        student_name, attendance, internal_marks,
        assignment_score, study_hours, risk_level, confidence, key_factors
    )

    return {
        "explanation":     explanation,
        "recommendations": recommendations,
        "fallback_used":   fallback,
    }
