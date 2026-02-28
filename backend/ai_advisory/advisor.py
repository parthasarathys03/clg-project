"""
AI Advisory Module  —  v6  (Multi-Key Rotation + AI-Only)
===========================================================================
Priority: Gemini Key1 → Key2 → Key3 → Key4 → Ollama (no rule-based)

Returns a rich structured dict for every prediction:

  explanation     - Deep analytical reasoning (cause→effect, data-grounded)
  risk_factors    - Per-metric severity analysis with threshold gaps
  strengths       - Positive signals above thresholds
  recommendations - 4 priority-ranked, impact-driven action items
  weekly_plan     - 7-day personalised study schedule with objectives
  report_summary  - Executive summary for institutional reports
  fallback_used   - True when Ollama fallback was used
  ai_provider     - "gemini" | "ollama"
  model_name      - Specific model that generated the response
"""

import os
import json
import time
import hashlib
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


# ─── Advisory cache (in-memory + metrics hash) ──────────────────────────────

_advisory_cache = {}   # key = metrics_hash → full AI response dict


def _metrics_hash(student_id, attendance, internal_marks, assignment_score, study_hours) -> str:
    """Deterministic hash of student identity + metric values for cache lookup."""
    raw = f"{student_id}|{attendance}|{internal_marks}|{assignment_score}|{study_hours}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def get_cached_advisory(cache_key: str) -> dict | None:
    return _advisory_cache.get(cache_key)


def cache_advisory(cache_key: str, response: dict):
    _advisory_cache[cache_key] = response


def get_cache_size() -> int:
    return len(_advisory_cache)


def clear_cache():
    _advisory_cache.clear()


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

    class_section = ""
    if class_averages:
        class_section = textwrap.dedent(f"""
        CLASS AVERAGES (for comparison):
          Avg Attendance        : {class_averages.get('avg_attendance', 'N/A')}%
          Avg Internal Marks    : {class_averages.get('avg_internal_marks', 'N/A')}/100
          Avg Assignment Score  : {class_averages.get('avg_assignment_score', 'N/A')}/100
          Avg Study Hours/Day   : {class_averages.get('avg_study_hours', 'N/A')} hrs
        """)

    risk_context = ""
    if risk_factors_detail:
        lines = []
        for rf in risk_factors_detail:
            lines.append(f"    - {rf['name']}: {rf['value']} (threshold: {rf['threshold']}, severity: {rf['severity'].upper()}, gap: {rf['gap']:+.1f})")
        risk_context = "\n        RISK SEVERITY BREAKDOWN:\n" + "\n".join(lines)

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
    """Ensure weekly_plan values are strings for frontend compatibility."""
    if not plan:
        return plan
    normalized = {}
    for day, value in plan.items():
        if isinstance(value, dict):
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


# ─── Provider 1: Gemini (multi-key rotation + model cascade) ────────────────

_GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemma-3-27b-it",
    "gemma-3-12b-it",
]


def _get_gemini_keys() -> list:
    """Collect all Gemini API keys from env: GEMINI_API_KEY_1, _2, _3, _4 and legacy GEMINI_API_KEY."""
    keys = []
    # Check numbered keys first
    for i in range(1, 10):
        k = os.getenv(f"GEMINI_API_KEY_{i}", "").strip()
        if k and k != "your-gemini-api-key-here":
            keys.append(k)
    # Also check legacy single key
    legacy = os.getenv("GEMINI_API_KEY", "").strip()
    if legacy and legacy != "your-gemini-api-key-here" and legacy not in keys:
        keys.append(legacy)
    return keys


def _parse_gemini_json(raw_text: str) -> dict:
    """Extract and parse JSON from Gemini response, handling code fences and extra text."""
    text = raw_text.strip()
    if text.startswith("```"):
        if text.startswith("```json"):
            text = text[7:]
        else:
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start:end + 1])
        raise


# Retry config per model
_RETRIES_PER_MODEL = 2
_RETRY_DELAY = 3  # seconds
_AI_TIMEOUT = 30  # seconds max per request


def _call_gemini(
    student_name, attendance, internal_marks, assignment_score,
    study_hours, risk_level, confidence, key_factors, **kwargs
) -> dict | None:
    keys = _get_gemini_keys()
    if not keys or not _gemini_available:
        logger.warning("GEMINI_UNAVAILABLE reason='No API keys or library not installed' student=%s", student_name)
        return None

    prompt = _build_user_prompt(
        student_name, attendance, internal_marks, assignment_score,
        study_hours, risk_level, confidence, key_factors, **kwargs
    )

    last_error = None

    # Rotate through API keys
    for key_idx, api_key in enumerate(keys, 1):
        genai.configure(api_key=api_key)
        key_exhausted = False

        # Try each model with this key
        for model_name in _GEMINI_MODELS:
            if key_exhausted:
                break
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=_SYSTEM_INSTRUCTION,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.4,
                    max_output_tokens=4096,
                ),
            )
            display_name = model_name

            for attempt in range(1, _RETRIES_PER_MODEL + 1):
                try:
                    logger.info("AI_REQUEST_STARTED provider=gemini key=%d/%d model=%s attempt=%d/%d student=%s",
                                key_idx, len(keys), display_name, attempt, _RETRIES_PER_MODEL, student_name)
                    t0 = time.time()
                    response = model.generate_content(prompt)
                    raw_text = response.text
                    data = _parse_gemini_json(raw_text)
                    elapsed = round(time.time() - t0, 2)
                    logger.info("AI_RESPONSE_RECEIVED provider=gemini key=%d model=%s elapsed=%ss student=%s",
                                key_idx, display_name, elapsed, student_name)
                    data["weekly_plan"] = _normalize_weekly_plan(data.get("weekly_plan", {}))
                    result = _ensure_4_recs(data)
                    result["_model_name"] = display_name
                    result["_key_index"] = key_idx
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
                        logger.warning("AI_PROVIDER_FAILED provider=gemini key=%d model=%s reason=quota_exceeded student=%s",
                                       key_idx, display_name, student_name)
                        # Check if it's a key-level quota (all models share quota)
                        if "per-day" in err.lower() or "per-minute" in err.lower():
                            key_exhausted = True
                        break  # skip retries, move to next model
                    else:
                        logger.warning("GEMINI_RETRY model=%s attempt=%d reason='%s' student=%s",
                                       display_name, attempt, err[:200], student_name)

                if attempt < _RETRIES_PER_MODEL:
                    time.sleep(_RETRY_DELAY)

        if not key_exhausted:
            # This key's models were tried but none worked (non-quota errors)
            # Still try next key
            pass
        logger.info("AI_KEY_ROTATION key=%d/%d exhausted, trying next key student=%s", key_idx, len(keys), student_name)

    logger.error("GEMINI_ALL_KEYS_EXHAUSTED keys_tried=%d student=%s last_error='%s'",
                 len(keys), student_name, str(last_error)[:200])
    return None


# ─── Provider 2: Ollama (local, no rate limits) ─────────────────────────────

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
    student_id: Optional[str] = None,
    use_cache: bool = True,
) -> dict:
    """
    AI-Only advisory: Gemini (multi-key) → Ollama → RuntimeError.
    No rule-based fallback. 100% AI-generated content.

    Supports caching: if student_id + same metrics were already processed,
    returns cached response instantly without calling AI.
    """
    risk_factors = _build_risk_factors(attendance, internal_marks, assignment_score, study_hours)

    # Check cache first
    cache_key = None
    if use_cache and student_id:
        cache_key = _metrics_hash(student_id, attendance, internal_marks, assignment_score, study_hours)
        cached = get_cached_advisory(cache_key)
        if cached:
            logger.info("AI_CACHE_HIT student=%s cache_key=%s", student_name, cache_key)
            return {**cached, "risk_factors": risk_factors}

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

    # 1. Try Gemini (primary — multi-key rotation + model cascade)
    ai_data = _call_gemini(*args, **extra_kwargs)
    if ai_data is not None:
        provider = "gemini"
        model_name = ai_data.pop("_model_name", "gemini-2.5-flash")
        ai_data.pop("_key_index", None)
    else:
        # 2. Failover to Ollama (secondary — local LLM)
        logger.info("AI_FAILOVER_STARTED provider=ollama reason='All Gemini keys exhausted' student=%s", student_name)
        ai_data = _call_ollama(*args, **extra_kwargs)
        if ai_data is not None:
            provider = "ollama"
            model_name = ai_data.pop("_model_name", OLLAMA_MODEL)
            fallback_used = True
        else:
            # 3. Total failure — no silent fake text, no rule-based
            logger.error("AI_TOTAL_FAILURE all_providers_unavailable student=%s", student_name)
            raise RuntimeError(
                "AI advisory generation failed — all providers unavailable. "
                "Check GEMINI_API_KEY_1..4 in backend/.env or ensure Ollama is running. "
                "Get a free key at https://aistudio.google.com/apikey"
            )

    result = {
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

    # Cache the result for future lookups
    if cache_key:
        cache_advisory(cache_key, result)
        logger.info("AI_CACHE_STORED student=%s cache_key=%s provider=%s", student_name, cache_key, provider)

    return result
