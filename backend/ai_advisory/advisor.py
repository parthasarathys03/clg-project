"""
AI Advisory Module  —  v5  (Production-Grade AI Advisory)
===========================================================================
Priority: Ollama → Gemini → Rule-based fallback (only on API failure)

Returns a rich structured dict for every prediction:

  explanation     - Deep analytical reasoning (cause→effect, data-grounded)
  risk_factors    - Per-metric severity analysis with threshold gaps
  strengths       - Positive signals above thresholds
  recommendations - 4 priority-ranked, impact-driven action items
  weekly_plan     - 7-day personalised study schedule with objectives
  report_summary  - Executive summary for institutional reports
  fallback_used   - True when rule-based fallback was used
  ai_provider     - "ollama" | "gemini" | "rule-based"
"""

import os
import json
import time
import textwrap
import logging
from typing import List, Optional

# ── Logging setup ────────────────────────────────────────────────────────────
logger = logging.getLogger("ai_advisory")
logger.setLevel(logging.INFO)
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter(
        "[%(name)s] %(asctime)s %(levelname)s  %(message)s",
        datefmt="%H:%M:%S",
    ))
    logger.addHandler(_handler)

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


# Override via OLLAMA_MODEL env-var if a different local model is available
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")

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


# ─── Production-grade system instruction ─────────────────────────────────────

_SYSTEM_INSTRUCTION = textwrap.dedent("""\
You are an Academic Performance Intelligence AI deployed inside a production SaaS educational decision-support platform used by universities.

Your task is NOT to generate generic advice or motivational text.
You must produce deep, data-grounded academic reasoning similar to a professional academic advisor analyzing student performance trends.

Your responses must be analytical, precise, and actionable — suitable for institutional decision-making by teachers and students.

STRICT RULES:
- Every claim must reference exact student metrics from the provided data
- Use cause→effect reasoning: explain WHY metrics interact to produce the prediction
- Compare student values against thresholds and class averages when provided
- Identify hidden risk patterns (e.g., strong marks but poor attendance creating volatility)
- Never produce generic motivational lines like "study more" or "focus better"
- Never repeat templates — every response must be uniquely grounded in the student's data
- Never ignore provided metrics
- Output ONLY valid JSON matching the schema exactly. No markdown, no extra text, no code fences.
""").strip()


_JSON_SCHEMA = """{
  "explanation": "<4-6 analytical sentences with cause-effect reasoning citing exact metric values. Explain WHY the prediction occurred, how metrics interact, hidden risk patterns, and what distinguishes this student's profile. Must feel like a professional academic advisor's analysis, NOT a template.>",
  "strengths": ["<evidence-based positive observation citing exact values, e.g. 'Internal marks at 90/100 indicate strong conceptual grasp, placing this student in the top quartile for academic understanding'>"],
  "recommendations": [
    {
      "priority": 1,
      "category": "<Attendance|Internal Marks|Assignment Score|Study Hours|General>",
      "action": "<specific, measurable action with target values — NOT generic advice>",
      "timeframe": "<e.g. 1 week, 2 weeks>",
      "expected_impact": "<quantified expected outcome, e.g. 'Risk probability reduction by ~18-25%'>"
    }
  ],
  "weekly_plan": {
    "Monday": {"objective": "<targeted goal>", "activity": "<specific task>", "duration": "<e.g. 2 hrs>", "benefit": "<expected academic benefit>"},
    "Tuesday": {"objective": "...", "activity": "...", "duration": "...", "benefit": "..."},
    "Wednesday": {"objective": "...", "activity": "...", "duration": "...", "benefit": "..."},
    "Thursday": {"objective": "...", "activity": "...", "duration": "...", "benefit": "..."},
    "Friday": {"objective": "...", "activity": "...", "duration": "...", "benefit": "..."},
    "Saturday": {"objective": "...", "activity": "...", "duration": "...", "benefit": "..."},
    "Sunday": {"objective": "...", "activity": "...", "duration": "...", "benefit": "..."}
  },
  "report_summary": "<2-3 sentence executive summary for teacher/institutional reports. Must include classification, confidence, key risk drivers, and recommended intervention timeline.>"
}"""


def _build_user_prompt(
    student_name, attendance, internal_marks, assignment_score,
    study_hours, risk_level, confidence, key_factors,
    section=None, department=None, current_year=None,
    class_averages=None, risk_factors_detail=None,
) -> str:
    factors_txt = "\n".join(f"    - {f}" for f in key_factors)

    # Build class comparison section
    class_section = ""
    if class_averages:
        class_section = textwrap.dedent(f"""
        CLASS AVERAGES (for comparison):
          Avg Attendance        : {class_averages.get('avg_attendance', 'N/A')}%
          Avg Internal Marks    : {class_averages.get('avg_internal_marks', 'N/A')}/100
          Avg Assignment Score  : {class_averages.get('avg_assignment_score', 'N/A')}/100
          Avg Study Hours/Day   : {class_averages.get('avg_study_hours', 'N/A')} hrs
        """)

    # Build risk severity context
    risk_context = ""
    if risk_factors_detail:
        lines = []
        for rf in risk_factors_detail:
            lines.append(f"    - {rf['name']}: {rf['value']} (threshold: {rf['threshold']}, severity: {rf['severity'].upper()}, gap: {rf['gap']:+.1f})")
        risk_context = "\n        RISK SEVERITY BREAKDOWN:\n" + "\n".join(lines)

    # Identify strengths and weaknesses for AI context
    metrics = {
        "attendance_percentage": attendance,
        "internal_marks": internal_marks,
        "assignment_score": assignment_score,
        "study_hours_per_day": study_hours,
    }
    weak = [METRIC_LABELS[k] for k, v in metrics.items() if v < THRESHOLDS[k]]
    strong = [METRIC_LABELS[k] for k, v in metrics.items() if v >= THRESHOLDS[k]]

    return textwrap.dedent(f"""
        Analyse this student's academic performance data and return a JSON object matching the schema exactly.
        Your analysis must be deeply analytical with cause-effect reasoning — NOT generic template text.

        STUDENT PROFILE:
          Name              : {student_name}
          Department        : {department or 'Not specified'}
          Year              : {current_year or 'Not specified'}
          Section           : {section or 'Not specified'}

        ACADEMIC METRICS:
          Attendance        : {attendance}%  (institutional threshold: >=75%)
          Internal Marks    : {internal_marks}/100  (threshold: >=60)
          Assignment Score  : {assignment_score}/100  (threshold: >=60)
          Study Hours/Day   : {study_hours} hrs  (threshold: >=3 hrs)
        {class_section}
        ML PREDICTION:
          Classification    : {risk_level}
          Confidence        : {confidence*100:.1f}%
          Key ML Factors:
{factors_txt}
        {risk_context}
        PERFORMANCE CONTEXT:
          Metrics BELOW threshold: {', '.join(weak) if weak else 'None'}
          Metrics ABOVE threshold: {', '.join(strong) if strong else 'None'}

        REQUIRED JSON SCHEMA:
        {_JSON_SCHEMA}

        CRITICAL INSTRUCTIONS:
        1. explanation: Write 4-6 analytical sentences. Cite exact numbers. Explain metric interactions and hidden patterns.
           Example tone: "Although internal marks remain strong at 90/100, sustained low assignment completion at 30/100 reduces continuous assessment stability. Combined with borderline attendance at 68%, this creates a compounding risk pattern where performance may decline despite demonstrated conceptual understanding."
        2. strengths: 1-3 evidence-based positives citing exact values. If student has no metrics above threshold, note any relative strengths.
        3. recommendations: Exactly 4 items ranked by impact. Each must have specific target values, measurable actions, and quantified expected outcomes. NO generic advice.
        4. weekly_plan: Each day must have objective, activity, duration, and benefit. Must target the weakest metrics first. Activities must vary daily.
        5. report_summary: 2-3 sentences suitable for an institutional performance report.
    """).strip()


def _ensure_4_recs(data: dict) -> dict:
    recs = data.get("recommendations", [])
    pad  = [{"priority": i + 1 + len(recs), "category": "General",
             "action": "Consult your academic advisor for further personalised guidance.",
             "timeframe": "Ongoing", "expected_impact": "Continuous structured improvement."}
            for i in range(max(0, 4 - len(recs)))]
    data["recommendations"] = (recs + pad)[:4]
    return data


def _normalize_weekly_plan(plan: dict) -> dict:
    """Ensure weekly_plan values are strings for frontend compatibility.
    AI may return either strings or {objective, activity, duration, benefit} objects."""
    if not plan:
        return plan
    normalized = {}
    for day, value in plan.items():
        if isinstance(value, dict):
            # Convert structured plan to display string
            parts = []
            if value.get("objective"):
                parts.append(value["objective"])
            if value.get("activity"):
                parts.append(value["activity"])
            if value.get("duration"):
                parts.append(f"({value['duration']})")
            normalized[day] = " — ".join(parts) if parts else str(value)
        else:
            normalized[day] = str(value)
    return normalized


# ─── Provider 1: Ollama (local, no rate limits) ───────────────────────────────

def _call_ollama(
    student_name, attendance, internal_marks, assignment_score,
    study_hours, risk_level, confidence, key_factors, **kwargs
) -> dict | None:
    if not _ollama_available:
        return None

    prompt = _build_user_prompt(
        student_name, attendance, internal_marks, assignment_score,
        study_hours, risk_level, confidence, key_factors, **kwargs
    )

    try:
        logger.info("AI_REQUEST_STARTED provider=ollama model=%s student=%s", OLLAMA_MODEL, student_name)
        t0 = time.time()
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
        elapsed = round(time.time() - t0, 2)
        logger.info("AI_RESPONSE_RECEIVED provider=ollama model=%s elapsed=%ss student=%s", OLLAMA_MODEL, elapsed, student_name)
        data["weekly_plan"] = _normalize_weekly_plan(data.get("weekly_plan", {}))
        result = _ensure_4_recs(data)
        result["_model_name"] = OLLAMA_MODEL
        return result
    except Exception as exc:
        logger.warning("AI_PROVIDER_FAILED provider=ollama reason='%s' student=%s", str(exc)[:200], student_name)
        return None


# ─── Provider 2: Gemini ──────────────────────────────────────────────────────

# Gemini model cascade — if one model's quota is exhausted, try the next
# Ordered: best quality first → smaller models as quota fallbacks
_GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemma-3-27b-it",
    "gemma-3-12b-it",
]


def _get_gemini_models():
    """Return a list of configured Gemini model instances to try in order."""
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key == "your-gemini-api-key-here":
        return []
    if not _gemini_available:
        return []
    genai.configure(api_key=key)
    models = []
    for model_name in _GEMINI_MODELS:
        models.append(genai.GenerativeModel(
            model_name=model_name,
            system_instruction=_SYSTEM_INSTRUCTION,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.4,
                max_output_tokens=4096,
            ),
        ))
    return models


def _parse_gemini_json(raw_text: str) -> dict:
    """Extract and parse JSON from Gemini response, handling code fences and extra text."""
    text = raw_text.strip()
    # Strip markdown code fences
    if text.startswith("```"):
        if text.startswith("```json"):
            text = text[7:]
        else:
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Extract outermost { ... } JSON object
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start:end + 1])
        raise


# Retry config per model
_RETRIES_PER_MODEL = 2
_RETRY_DELAY = 3  # seconds


def _call_gemini(
    student_name, attendance, internal_marks, assignment_score,
    study_hours, risk_level, confidence, key_factors, **kwargs
) -> dict | None:
    models = _get_gemini_models()
    if not models:
        logger.warning("GEMINI_UNAVAILABLE reason='No API key or library not installed' student=%s", student_name)
        return None

    prompt = _build_user_prompt(
        student_name, attendance, internal_marks, assignment_score,
        study_hours, risk_level, confidence, key_factors, **kwargs
    )

    last_error = None
    for model in models:
        mname = model.model_name if hasattr(model, 'model_name') else str(model._model_name)
        # Clean model name for display (strip "models/" prefix)
        display_name = mname.replace("models/", "")
        for attempt in range(1, _RETRIES_PER_MODEL + 1):
            try:
                logger.info("AI_REQUEST_STARTED provider=gemini model=%s attempt=%d/%d student=%s",
                            display_name, attempt, _RETRIES_PER_MODEL, student_name)
                t0 = time.time()
                response = model.generate_content(prompt)
                raw_text = response.text
                data = _parse_gemini_json(raw_text)
                elapsed = round(time.time() - t0, 2)
                logger.info("AI_RESPONSE_RECEIVED provider=gemini model=%s elapsed=%ss student=%s",
                            display_name, elapsed, student_name)
                data["weekly_plan"] = _normalize_weekly_plan(data.get("weekly_plan", {}))
                result = _ensure_4_recs(data)
                # Attach model_name so the caller can track which model succeeded
                result["_model_name"] = display_name
                return result
            except json.JSONDecodeError as exc:
                last_error = exc
                logger.warning("GEMINI_RETRY model=%s attempt=%d reason='JSON parse error: %s' student=%s",
                               display_name, attempt, str(exc)[:100], student_name)
            except Exception as exc:
                last_error = exc
                err = str(exc)
                is_quota = "429" in err or "RATE_LIMIT" in err or "quota" in err.lower()
                if is_quota:
                    logger.warning("AI_PROVIDER_FAILED provider=gemini model=%s reason=quota_exceeded student=%s",
                                   display_name, student_name)
                    break  # skip retries, move to next model immediately
                else:
                    logger.warning("GEMINI_RETRY model=%s attempt=%d reason='%s' student=%s",
                                   display_name, attempt, err[:200], student_name)

            # Wait before retrying same model
            if attempt < _RETRIES_PER_MODEL:
                logger.info("GEMINI_WAITING %ds before retry student=%s", _RETRY_DELAY, student_name)
                time.sleep(_RETRY_DELAY)

    logger.error("GEMINI_ALL_MODELS_EXHAUSTED models_tried=%d student=%s last_error='%s'",
                 len(models), student_name, str(last_error)[:200])
    return None


# ─── Provider 3: Rule-based (always available) ───────────────────────────────

def _rule_based(
    student_name, attendance, internal_marks, assignment_score,
    study_hours, risk_level, confidence,
    section=None, department=None, current_year=None,
    class_averages=None, risk_factors_detail=None,
) -> dict:
    logger.info("AI_FALLBACK_TRIGGERED provider=rule-based reason='All AI providers unavailable' student=%s", student_name)

    data = {
        "attendance_percentage": attendance,
        "internal_marks":        internal_marks,
        "assignment_score":      assignment_score,
        "study_hours_per_day":   study_hours,
    }
    issues   = [(METRIC_LABELS[k], v, THRESHOLDS[k]) for k, v in data.items() if v < THRESHOLDS[k]]
    ok_items = [(METRIC_LABELS[k], v, THRESHOLDS[k]) for k, v in data.items() if v >= THRESHOLDS[k]]

    # ── Analytical Explanation (production-quality even in fallback) ──
    if risk_level == "Good":
        # Build comparison context
        comparison = ""
        if class_averages:
            above_avg = []
            if attendance > (class_averages.get("avg_attendance") or 0):
                above_avg.append(f"attendance exceeds class average by {attendance - class_averages['avg_attendance']:.1f}%")
            if internal_marks > (class_averages.get("avg_internal_marks") or 0):
                above_avg.append(f"internal marks surpass class mean by {internal_marks - class_averages['avg_internal_marks']:.1f} points")
            if above_avg:
                comparison = f" Notably, {' and '.join(above_avg)}."

        explanation = (
            f"{student_name} demonstrates consistently strong performance across all four academic metrics, "
            f"with attendance at {attendance}%, internal marks at {internal_marks}/100, "
            f"assignment completion at {assignment_score}/100, and {study_hours} daily study hours — "
            f"all exceeding institutional thresholds. "
            f"The ML model classifies this profile as Good with {confidence*100:.1f}% confidence, "
            f"indicating stable academic standing with no immediate intervention required.{comparison} "
            f"The primary recommendation is maintaining current patterns while building advanced proficiency "
            f"to sustain this trajectory through the examination period."
        )
    elif risk_level == "At Risk":
        # Identify the primary and secondary risk drivers
        sorted_issues = sorted(issues, key=lambda x: (x[1] - x[2]))  # most negative gap first
        primary = sorted_issues[0] if sorted_issues else None
        secondary = sorted_issues[1] if len(sorted_issues) > 1 else None

        primary_str = f"{primary[0]} at {primary[1]}/{primary[2]}" if primary else "multiple metrics"
        interaction = ""
        if primary and secondary:
            interaction = (
                f" The interaction between low {primary[0].lower()} ({primary[1]}) and "
                f"underperforming {secondary[0].lower()} ({secondary[1]}) creates a compounding risk pattern "
                f"where deficiency in one metric amplifies the impact of the other on overall academic stability."
            )

        strength_note = ""
        if ok_items:
            best = max(ok_items, key=lambda x: x[1] - x[2])
            strength_note = (
                f" Despite this, {best[0].lower()} remains a relative strength at {best[1]}, "
                f"suggesting foundational capability that targeted intervention can build upon."
            )

        explanation = (
            f"{student_name} has been classified as At Risk with {confidence*100:.1f}% confidence, "
            f"primarily driven by {primary_str}. "
            f"Current metrics show attendance at {attendance}%, internal marks at {internal_marks}/100, "
            f"assignment score at {assignment_score}/100, and study hours at {study_hours}/day.{interaction}"
            f"{strength_note} "
            f"Without immediate intervention targeting the highest-impact deficiencies, "
            f"cumulative underperformance across continuous assessment components creates significant risk "
            f"of academic progression failure."
        )
    else:  # Average
        sorted_issues = sorted(issues, key=lambda x: (x[1] - x[2]))
        borderline_items = [f"{n} ({v})" for n, v, _ in sorted_issues]
        strength_note = ""
        if ok_items:
            best = max(ok_items, key=lambda x: x[1] - x[2])
            strength_note = (
                f" {best[0]} at {best[1]} demonstrates competency above the {best[2]} threshold, "
                f"providing a stable foundation for improvement."
            )

        explanation = (
            f"{student_name} presents an Average performance profile with {confidence*100:.1f}% confidence, "
            f"characterized by borderline metrics in {', '.join(borderline_items) if borderline_items else 'several areas'}. "
            f"With attendance at {attendance}%, internal marks at {internal_marks}/100, "
            f"assignment score at {assignment_score}/100, and {study_hours} daily study hours, "
            f"this profile sits at a critical inflection point where focused effort on 1-2 weak areas "
            f"could shift the classification to Good.{strength_note} "
            f"The current trajectory suggests stable but vulnerable performance — "
            f"reclassification is achievable within 3-4 weeks with structured intervention."
        )

    # ── Strengths ──
    strengths = []
    if attendance >= 75:
        above = attendance - 75
        strengths.append(f"Attendance at {attendance}% exceeds the 75% threshold by {above:.1f}% — demonstrates consistent classroom engagement")
    if internal_marks >= 70:
        strengths.append(f"Internal marks at {internal_marks}/100 — strong academic understanding placing above the 60-mark institutional benchmark")
    elif internal_marks >= 60:
        strengths.append(f"Internal marks at {internal_marks}/100 — meets the threshold, indicating adequate conceptual grasp")
    if assignment_score >= 70:
        strengths.append(f"Assignment score of {assignment_score}/100 — consistent submission quality and coursework diligence")
    elif assignment_score >= 60:
        strengths.append(f"Assignment score at {assignment_score}/100 — meets minimum expectations for continuous assessment")
    if study_hours >= 4:
        strengths.append(f"Study discipline at {study_hours} hrs/day — {study_hours - 3:.1f} hrs above the recommended 3-hour threshold")
    elif study_hours >= 3:
        strengths.append(f"Study hours at {study_hours}/day — meets the recommended threshold for academic retention")
    if not strengths:
        strengths = ["Active enrollment and engagement with the advisory system — the first step toward structured academic recovery"]

    # ── Recommendations (impact-driven, specific) ──
    recs = []
    if attendance < 75:
        gap = 75 - attendance
        recs.append({
            "priority": 1, "category": "Attendance",
            "action": (f"Attend every remaining class to close the {gap:.1f}% gap from {attendance}% to 75%+. "
                       "Set calendar reminders 15 minutes before each session. Sit near the front row to maximize engagement and reduce distraction probability."),
            "timeframe": "2 weeks",
            "expected_impact": f"Crossing the 75% threshold removes the attendance risk flag entirely, improves exam eligibility, and reduces At-Risk probability by approximately 15-20%."
        })
    if assignment_score < 60:
        gap = 60 - assignment_score
        recs.append({
            "priority": len(recs)+1, "category": "Assignment Score",
            "action": (f"Submit all pending assignments immediately and target 70%+ on upcoming submissions. "
                       f"Current score of {assignment_score}/100 is {gap:.0f} points below threshold, suggesting incomplete or missing submissions."),
            "timeframe": "1 week",
            "expected_impact": f"Assignments carry significant weighting in continuous assessment. Closing this {gap:.0f}-point gap is the highest-ROI action available, potentially reducing risk classification probability by 18-25%."
        })
    if internal_marks < 60:
        gap = 60 - internal_marks
        recs.append({
            "priority": len(recs)+1, "category": "Internal Marks",
            "action": (f"Create a topic-by-topic revision map targeting the weakest areas. "
                       f"Practice 5 past-paper questions daily to close the {gap:.0f}-point gap from {internal_marks}/100 to 60+."),
            "timeframe": "3 weeks",
            "expected_impact": f"Each 5-mark improvement in internals reduces At-Risk probability by approximately 8-12%. Reaching 60+ eliminates this metric as a risk contributor."
        })
    if study_hours < 3:
        gap = 3 - study_hours
        recs.append({
            "priority": len(recs)+1, "category": "Study Hours",
            "action": (f"Increase structured study from {study_hours} to 3+ hours daily using the Pomodoro technique "
                       f"(4×25-min focused blocks with 5-min breaks). Maintain a daily study log to track consistency."),
            "timeframe": "1 week",
            "expected_impact": f"Adding {gap:.1f} hrs/day of structured study directly improves retention and assessment readiness, with measurable impact within 7-10 days."
        })
    extras = [
        {"priority": len(recs)+1, "category": "General",
         "action": "Implement spaced repetition using Anki or Quizlet to review all subject topics twice weekly, focusing on areas identified in recent internal assessments.",
         "timeframe": "Ongoing",
         "expected_impact": "Research demonstrates spaced repetition improves long-term retention by 30-40%, directly reducing performance volatility across assessments."},
        {"priority": len(recs)+2, "category": "General",
         "action": "Form a study group of 2-3 peers and schedule one structured weekly session focused on collaborative problem-solving and peer teaching.",
         "timeframe": "This week",
         "expected_impact": "Peer explanation reinforces conceptual understanding and surfaces hidden knowledge gaps. Students in study groups show 12-18% improvement in assessment consistency."},
    ]
    for e in extras:
        if len(recs) >= 4:
            break
        recs.append(e)

    # ── Weekly plan (targeted, varied) ──
    weak_label = issues[0][0] if issues else "General Revision"
    second_weak = issues[1][0] if len(issues) > 1 else "General Revision"

    weekly_plan = {
        "Monday":    f"Deep-dive revision on {weak_label} — 2 focused hours with past-paper practice targeting identified weak topics.",
        "Tuesday":   f"Attempt 10 past-paper questions on {second_weak}; self-mark using the official marking scheme to identify gaps (2 hrs).",
        "Wednesday": "Assignment catch-up session — complete any pending coursework submissions, prioritizing highest-weight items (2 hrs).",
        "Thursday":  "Group study or self-quiz covering this week's lecture content. Focus on topics flagged in recent internal assessments (2 hrs).",
        "Friday":    f"Flash-card revision for upcoming internal assessment. Create 20 new cards from {weak_label} topics (1.5 hrs).",
        "Saturday":  "Full timed mock test under exam conditions covering all subjects. Analyse all errors and create an error log (3 hrs).",
        "Sunday":    "Light review of weekly study log + prepare prioritized topic list for next week based on error analysis (45 min).",
    }

    # ── Report summary ──
    if risk_level == "Good":
        report_summary = (
            f"{student_name} is performing at a consistently Good level with {confidence*100:.1f}% ML confidence. "
            f"All four metrics — attendance ({attendance}%), internal marks ({internal_marks}/100), "
            f"assignment score ({assignment_score}/100), and study hours ({study_hours}/day) — "
            f"meet or exceed institutional thresholds. Recommended focus: sustaining trajectory and building advanced proficiency."
        )
    else:
        issue_list = ", ".join(f"{n} ({v}/{t})" for n, v, t in issues) if issues else "multiple metrics"
        report_summary = (
            f"{student_name} classified as '{risk_level}' with {confidence*100:.1f}% confidence due to "
            f"underperformance in {issue_list}. "
            f"Immediate targeted intervention is recommended, prioritizing the highest-impact deficiencies. "
            f"Following the prescribed action plan, reclassification to Average or above is projected within 3-4 weeks."
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
    section: Optional[str] = None,
    department: Optional[str] = None,
    current_year: Optional[int] = None,
    class_averages: Optional[dict] = None,
) -> dict:
    """
    Multi-LLM failover: Gemini (primary) → Ollama (secondary).
    No rule-based fallback — 100% AI-generated explanations.

    Execution order:
      1. Gemini API (cascade across multiple models with retry)
      2. Ollama local LLM (automatic failover)
      3. RuntimeError if both fail (no silent fake text)

    class_averages expected format:
      {"avg_attendance": 72.5, "avg_internal_marks": 65.0,
       "avg_assignment_score": 58.0, "avg_study_hours": 3.2}
    """
    risk_factors = _build_risk_factors(attendance, internal_marks, assignment_score, study_hours)

    extra_kwargs = dict(
        section=section,
        department=department,
        current_year=current_year,
        class_averages=class_averages,
        risk_factors_detail=risk_factors,
    )

    args = (student_name, attendance, internal_marks, assignment_score,
            study_hours, risk_level, confidence, key_factors)

    provider = None
    model_name = None
    fallback_used = False

    # 1. Try Gemini (primary — cloud AI with model cascade)
    ai_data = _call_gemini(*args, **extra_kwargs)
    if ai_data is not None:
        provider = "gemini"
        model_name = ai_data.pop("_model_name", "gemini-2.5-flash")
    else:
        # 2. Failover to Ollama (secondary — local LLM)
        logger.info("AI_FAILOVER_STARTED provider=ollama reason='Gemini unavailable' student=%s", student_name)
        ai_data = _call_ollama(*args, **extra_kwargs)
        if ai_data is not None:
            provider = "ollama"
            model_name = ai_data.pop("_model_name", OLLAMA_MODEL)
            fallback_used = True
        else:
            # 3. Total failure — no silent fake text
            logger.error("AI_TOTAL_FAILURE all_providers_unavailable student=%s", student_name)
            raise RuntimeError(
                "AI advisory generation failed — all providers unavailable. "
                "Check GEMINI_API_KEY in backend/.env or ensure Ollama is running. "
                "Get a free key at https://aistudio.google.com/apikey"
            )

    return {
        "explanation":     ai_data.get("explanation", ""),
        "risk_factors":    risk_factors,
        "strengths":       ai_data.get("strengths", []),
        "recommendations": ai_data.get("recommendations", []),
        "weekly_plan":     ai_data.get("weekly_plan", {}),
        "report_summary":  ai_data.get("report_summary", ""),
        "fallback_used":   fallback_used,
        "ai_provider":     provider,
        "model_name":      model_name,
    }
