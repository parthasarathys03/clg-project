"""
AI Advisory Module  —  v4  (Ollama primary → Gemini fallback → Rule-based)
===========================================================================
Returns a rich structured dict for every prediction:

  explanation    - WHY the prediction occurred (3-4 sentences)
  risk_factors   - Per-metric severity analysis with threshold gaps
  strengths      - What the student is doing well (positive signals)
  recommendations - 4 priority-ranked, time-bound action items
  weekly_plan    - 7-day personalised study schedule
  report_summary - One-paragraph executive summary for reports
  fallback_used  - True when rule-based fallback was used
  ai_provider    - "ollama" | "gemini" | "rule-based"
"""

import os
import json
import textwrap
from typing import List

try:
    import ollama as _ollama_lib
    _ollama_available = True
except ImportError:
    _ollama_available = False

try:
    import google.generativeai as genai
    _gemini_available = True
except ImportError:
    _gemini_available = False


OLLAMA_MODEL = "gpt-oss:120b-cloud"

THRESHOLDS = {
    "attendance_percentage": 75,
    "internal_marks":        60,
    "assignment_score":      60,
    "study_hours_per_day":   3,
}

METRIC_LABELS = {
    "attendance_percentage": "Attendance",
    "internal_marks":        "Internal Marks",
    "assignment_score":      "Assignment Score",
    "study_hours_per_day":   "Study Hours",
}


# ─── Severity helper ─────────────────────────────────────────────────────────

def _severity(value: float, key: str) -> str:
    threshold = THRESHOLDS.get(key, 60)
    ratio     = value / threshold if threshold else 1
    if ratio < 0.75:
        return "critical"
    if ratio < 1.0:
        return "warning"
    return "good"


def _build_risk_factors(attendance, internal_marks, assignment_score, study_hours) -> list:
    data = {
        "attendance_percentage": attendance,
        "internal_marks":        internal_marks,
        "assignment_score":      assignment_score,
        "study_hours_per_day":   study_hours,
    }
    factors = []
    for key, value in data.items():
        threshold = THRESHOLDS[key]
        sev = _severity(value, key)
        gap = round(value - threshold, 1)
        unit = "%" if key == "attendance_percentage" else ("/100" if key != "study_hours_per_day" else " hrs/day")
        if sev == "critical":
            msg = f"Critical: {abs(gap)}{unit} below minimum threshold"
        elif sev == "warning":
            msg = f"Borderline: {abs(gap)}{unit} below recommended level"
        else:
            msg = f"On track: {gap:+.1f}{unit} above threshold"
        factors.append({
            "name":      METRIC_LABELS[key],
            "key":       key,
            "value":     round(value, 1),
            "threshold": threshold,
            "severity":  sev,
            "gap":       gap,
            "message":   msg,
        })
    return factors


# ─── Shared prompt builder ────────────────────────────────────────────────────

_JSON_SCHEMA = """{
  "explanation": "<3-4 sentences citing exact values>",
  "strengths": ["<positive observation>"],
  "recommendations": [
    {
      "priority": 1,
      "category": "<Attendance|Internal Marks|Assignment Score|Study Hours|General>",
      "action": "<specific actionable sentence>",
      "timeframe": "<e.g. 2 weeks>",
      "expected_impact": "<one sentence on likely outcome>"
    }
  ],
  "weekly_plan": {
    "Monday": "<task>", "Tuesday": "<task>", "Wednesday": "<task>",
    "Thursday": "<task>", "Friday": "<task>", "Saturday": "<task>", "Sunday": "<task>"
  },
  "report_summary": "<1 paragraph executive summary>"
}"""

_SYSTEM_INSTRUCTION = (
    "You are an expert academic advisor AI for a university student monitoring platform. "
    "Your analysis must be strictly grounded in the data provided. "
    "Be empathetic, precise, and professional. "
    "Return ONLY valid JSON matching the schema. No markdown, no extra text."
)


def _build_user_prompt(
    student_name, attendance, internal_marks, assignment_score,
    study_hours, risk_level, confidence, key_factors
) -> str:
    factors_txt = "\n".join(f"  - {f}" for f in key_factors)
    return textwrap.dedent(f"""
        Analyse this student and return a JSON object matching the schema exactly.

        STUDENT DATA:
          Name              : {student_name}
          Attendance        : {attendance}%  (threshold >=75%)
          Internal Marks    : {internal_marks}/100  (threshold >=60)
          Assignment Score  : {assignment_score}/100  (threshold >=60)
          Study Hours/Day   : {study_hours} hrs  (threshold >=3 hrs)

        ML ASSESSMENT:
          Risk Level        : {risk_level}
          Confidence        : {confidence*100:.1f}%
          Key ML Factors:
{factors_txt}

        REQUIRED JSON SCHEMA:
        {_JSON_SCHEMA}

        RULES:
        - explanation: 3-4 sentences, cite actual numbers from the data
        - strengths: 1-3 genuine positives (areas at or above threshold)
        - recommendations: exactly 4 items ordered by urgency, each with specific timeframe and measurable impact
        - weekly_plan: concrete day-by-day schedule targeting the weakest areas
        - report_summary: 2-3 sentences an evaluator/teacher would read in a performance report
    """).strip()


def _ensure_4_recs(data: dict) -> dict:
    recs = data.get("recommendations", [])
    pad  = [{"priority": i + 1 + len(recs), "category": "General",
             "action": "Consult your academic advisor for further personalised guidance.",
             "timeframe": "Ongoing", "expected_impact": "Continuous structured improvement."}
            for i in range(max(0, 4 - len(recs)))]
    data["recommendations"] = (recs + pad)[:4]
    return data


# ─── Provider 1: Ollama (local, no rate limits) ───────────────────────────────

def _call_ollama(
    student_name, attendance, internal_marks, assignment_score,
    study_hours, risk_level, confidence, key_factors
) -> dict | None:
    if not _ollama_available:
        return None

    prompt = _build_user_prompt(
        student_name, attendance, internal_marks, assignment_score,
        study_hours, risk_level, confidence, key_factors
    )

    try:
        response = _ollama_lib.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_INSTRUCTION},
                {"role": "user",   "content": prompt},
            ],
            format="json",
            options={"temperature": 0.4},
        )
        raw  = response.message.content
        data = json.loads(raw)
        return _ensure_4_recs(data)
    except Exception as exc:
        print(f"[Advisor] Ollama call failed: {exc}. Trying Gemini.")
        return None


# ─── Provider 2: Gemini 2.5 Flash ────────────────────────────────────────────

def _get_gemini_model():
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key == "your-gemini-api-key-here":
        return None
    if not _gemini_available:
        return None
    genai.configure(api_key=key)
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=_SYSTEM_INSTRUCTION,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.4,
            max_output_tokens=2500,
        ),
    )


def _call_gemini(
    student_name, attendance, internal_marks, assignment_score,
    study_hours, risk_level, confidence, key_factors
) -> dict | None:
    model = _get_gemini_model()
    if model is None:
        return None

    prompt = _build_user_prompt(
        student_name, attendance, internal_marks, assignment_score,
        study_hours, risk_level, confidence, key_factors
    )

    try:
        response = model.generate_content(prompt)
        data = json.loads(response.text)
        return _ensure_4_recs(data)
    except Exception as exc:
        err = str(exc)
        if "429" in err or "RATE_LIMIT" in err or "quota" in err.lower():
            print(f"[Advisor] Gemini RATE LIMIT — trying rule-based. ({err[:100]})")
        elif "API_KEY" in err or "expired" in err.lower():
            print(f"[Advisor] Gemini KEY error — check GEMINI_API_KEY in .env. ({err[:100]})")
        else:
            print(f"[Advisor] Gemini error — trying rule-based. ({err[:150]})")
        return None


# ─── Provider 3: Rule-based (always available) ───────────────────────────────

def _rule_based(
    student_name, attendance, internal_marks, assignment_score,
    study_hours, risk_level, confidence
) -> dict:
    data = {
        "attendance_percentage": attendance,
        "internal_marks":        internal_marks,
        "assignment_score":      assignment_score,
        "study_hours_per_day":   study_hours,
    }
    issues   = [(METRIC_LABELS[k], v, THRESHOLDS[k]) for k, v in data.items() if v < THRESHOLDS[k]]
    ok_items = [(METRIC_LABELS[k], v) for k, v in data.items() if v >= THRESHOLDS[k]]  # noqa: F841

    # Explanation
    if risk_level == "Good":
        explanation = (
            f"{student_name} demonstrates strong academic performance across all key metrics. "
            f"Attendance stands at {attendance}%, internal marks at {internal_marks}/100, "
            f"assignment scores at {assignment_score}/100, and study hours at {study_hours}/day — "
            f"all above their respective thresholds. The model classifies this student as Good "
            f"with {confidence*100:.1f}% confidence."
        )
    elif risk_level == "At Risk":
        issue_str = ", ".join(f"{n} ({v})" for n, v, _ in issues[:2]) if issues else "multiple underperforming areas"
        explanation = (
            f"{student_name} has been flagged At Risk (confidence {confidence*100:.1f}%) due to "
            f"significant concerns in {issue_str}. "
            f"With attendance at {attendance}%, internal marks at {internal_marks}/100, "
            f"and only {study_hours} study hours per day, cumulative underperformance "
            f"across metrics necessitates immediate academic intervention."
        )
    else:
        issue_str = ", ".join(f"{n} ({v})" for n, v, _ in issues[:2]) if issues else "borderline performance areas"
        explanation = (
            f"{student_name} shows Average performance with borderline concerns in {issue_str}. "
            f"Attendance is {attendance}%, internal marks {internal_marks}/100, assignment scores {assignment_score}/100, "
            f"and {study_hours} daily study hours. With focused effort on weak areas, "
            f"reclassification to Good is achievable within 3-4 weeks."
        )

    # Strengths
    strengths = []
    if attendance >= 75:
        strengths.append(f"Attendance at {attendance}% meets the 75% threshold — shows classroom commitment")
    if internal_marks >= 70:
        strengths.append(f"Internal marks at {internal_marks}/100 — strong academic understanding")
    if assignment_score >= 70:
        strengths.append(f"Assignment score of {assignment_score}/100 — consistent submission quality")
    if study_hours >= 4:
        strengths.append(f"Study discipline at {study_hours} hrs/day — above the recommended 3 hrs")
    if not strengths:
        strengths = ["Enrolled and seeking improvement — the foundation for academic recovery is present"]

    # Recommendations
    recs = []
    if attendance < 75:
        recs.append({
            "priority": 1, "category": "Attendance",
            "action": (f"Attend every remaining class to bring attendance from {attendance}% to 75%+. "
                       "Set calendar reminders 15 minutes before each session and sit near the front to stay engaged."),
            "timeframe": "2 weeks",
            "expected_impact": "Crossing 75% removes the attendance risk flag entirely and improves exam eligibility."
        })
    if internal_marks < 60:
        recs.append({
            "priority": len(recs)+1, "category": "Internal Marks",
            "action": (f"Create a topic-by-topic revision map and practice 5 past-paper questions daily "
                       f"to close the gap from {internal_marks}/100 to 60+."),
            "timeframe": "3 weeks",
            "expected_impact": "Each 5-mark improvement in internals reduces At-Risk probability by approximately 8-12%."
        })
    if assignment_score < 60:
        recs.append({
            "priority": len(recs)+1, "category": "Assignment Score",
            "action": (f"Submit all pending assignments this week and target 70%+ on upcoming ones. "
                       f"Current score of {assignment_score}/100 suggests incomplete submissions."),
            "timeframe": "1 week",
            "expected_impact": "Assignments carry 20% weighting in the composite score — a high-ROI action."
        })
    if study_hours < 3:
        recs.append({
            "priority": len(recs)+1, "category": "Study Hours",
            "action": (f"Increase structured study from {study_hours} to 3+ hours daily using the Pomodoro method "
                       "(4x 25-min blocks with 5-min breaks). Track sessions with a study log."),
            "timeframe": "1 week",
            "expected_impact": "Consistent 3+ hour study sessions directly improve retention and assessment readiness."
        })
    extras = [
        {"priority": len(recs)+1, "category": "General",
         "action": "Use spaced repetition (Anki or Quizlet) to review all subject topics twice weekly.",
         "timeframe": "Ongoing",
         "expected_impact": "Research shows spaced repetition improves long-term retention by 30-40%."},
        {"priority": len(recs)+2, "category": "General",
         "action": "Form a study group of 2-3 peers and schedule one weekly session for collaborative problem solving.",
         "timeframe": "This week",
         "expected_impact": "Peer explanation reinforces understanding and surfaces hidden knowledge gaps early."},
    ]
    for e in extras:
        if len(recs) >= 4:
            break
        recs.append(e)

    # Weekly plan
    weak_label = issues[0][0] if issues else "General Revision"
    weekly_plan = {
        "Monday":    f"Deep-dive revision on {weak_label} — 2 focused hours with past-paper practice.",
        "Tuesday":   "Attempt 10 past-paper questions; self-mark using the marking scheme (2 hrs).",
        "Wednesday": "Assignment catch-up session — complete any pending work (2 hrs).",
        "Thursday":  "Group study or self-quiz on this week's lecture content (2 hrs).",
        "Friday":    "Flash-card revision for upcoming internal assessment (1.5 hrs).",
        "Saturday":  "Full timed mock test under exam conditions; analyse all errors (3 hrs).",
        "Sunday":    "Light review of weekly notes + prepare topic list for next week (45 min).",
    }

    # Report summary
    if risk_level == "Good":
        report_summary = (
            f"{student_name} is performing at a consistently Good level — ML confidence {confidence*100:.1f}%. "
            f"Attendance ({attendance}%), internal marks ({internal_marks}/100), and assignment scores ({assignment_score}/100) "
            f"all meet institutional thresholds. Recommended focus: sustaining performance and building advanced proficiency."
        )
    else:
        issue_list = ", ".join(f"{n} ({v}/{t})" for n, v, t in issues) if issues else "multiple metrics"
        report_summary = (
            f"{student_name} classified as '{risk_level}' with {confidence*100:.1f}% confidence due to "
            f"underperformance in {issue_list}. "
            f"Immediate intervention is advised targeting the highest-priority factors. "
            f"Following the recommended action plan, reclassification to Average or above is expected within 3-4 weeks."
        )

    return {
        "explanation":     explanation,
        "strengths":       strengths,
        "recommendations": recs[:4],
        "weekly_plan":     weekly_plan,
        "report_summary":  report_summary,
    }


# ─── Public API ───────────────────────────────────────────────────────────────

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
    Priority chain: Ollama → Gemini → Rule-based.
    Returns a rich structured dict with ai_provider field indicating which was used.
    """
    risk_factors = _build_risk_factors(attendance, internal_marks, assignment_score, study_hours)

    args = (student_name, attendance, internal_marks, assignment_score,
            study_hours, risk_level, confidence, key_factors)

    # 1. Try Ollama (local, unlimited)
    ai_data = _call_ollama(*args)
    if ai_data is not None:
        provider = "ollama"
    else:
        # 2. Try Gemini
        ai_data = _call_gemini(*args)
        if ai_data is not None:
            provider = "gemini"
        else:
            # 3. Rule-based fallback
            rb = _rule_based(student_name, attendance, internal_marks,
                             assignment_score, study_hours, risk_level, confidence)
            return {
                "explanation":     rb["explanation"],
                "risk_factors":    risk_factors,
                "strengths":       rb["strengths"],
                "recommendations": rb["recommendations"],
                "weekly_plan":     rb["weekly_plan"],
                "report_summary":  rb["report_summary"],
                "fallback_used":   True,
                "ai_provider":     "rule-based",
            }

    return {
        "explanation":     ai_data.get("explanation", ""),
        "risk_factors":    risk_factors,
        "strengths":       ai_data.get("strengths", []),
        "recommendations": ai_data.get("recommendations", []),
        "weekly_plan":     ai_data.get("weekly_plan", {}),
        "report_summary":  ai_data.get("report_summary", ""),
        "fallback_used":   False,
        "ai_provider":     provider,
    }
