import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "student_performance.db")


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _get_conn()
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS predictions (
            id          TEXT PRIMARY KEY,
            student_id  TEXT NOT NULL,
            student_name TEXT NOT NULL,
            risk_level  TEXT NOT NULL,
            confidence  REAL NOT NULL,
            inputs      TEXT NOT NULL,
            explanation TEXT,
            recommendations TEXT,
            key_factors TEXT,
            timestamp   TEXT NOT NULL,
            batch_id    TEXT,
            ai_data     TEXT,
            section     TEXT,
            department  TEXT,
            current_year INTEGER
        );

        CREATE TABLE IF NOT EXISTS batch_jobs (
            id          TEXT PRIMARY KEY,
            filename    TEXT NOT NULL,
            total_rows  INTEGER NOT NULL,
            processed   INTEGER NOT NULL DEFAULT 0,
            status      TEXT NOT NULL DEFAULT 'pending',
            created_at  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS training_history (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            accuracy            REAL NOT NULL,
            cv_score            REAL,
            dataset_rows        INTEGER,
            feature_importances TEXT,
            trained_at          TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS advisory_cache (
            cache_key   TEXT PRIMARY KEY,
            student_id  TEXT NOT NULL,
            metrics_hash TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            ai_provider TEXT NOT NULL,
            model_name  TEXT NOT NULL,
            created_at  TEXT NOT NULL
        );
    """)
    conn.commit()
    # Migrations: add columns to existing databases
    for ddl in [
        "ALTER TABLE predictions ADD COLUMN ai_data TEXT",
        "ALTER TABLE predictions ADD COLUMN section TEXT",
        "ALTER TABLE predictions ADD COLUMN department TEXT",
        "ALTER TABLE predictions ADD COLUMN current_year INTEGER",
    ]:
        try:
            conn.execute(ddl)
            conn.commit()
        except Exception:
            pass  # column already exists
    # Backfill section/department/current_year for existing SKP demo students
    conn.execute("""
        UPDATE predictions SET
            section = CASE
                WHEN student_id LIKE 'SKP-IT-A%' THEN 'IT-A'
                WHEN student_id LIKE 'SKP-IT-B%' THEN 'IT-B'
                WHEN student_id LIKE 'SKP-IT-C%' THEN 'IT-C'
                ELSE section
            END,
            department   = 'Information Technology',
            current_year = 4
        WHERE section IS NULL
          AND (student_id LIKE 'SKP-IT-A%'
            OR student_id LIKE 'SKP-IT-B%'
            OR student_id LIKE 'SKP-IT-C%')
    """)
    conn.commit()
    conn.close()


# ─── helpers ─────────────────────────────────────────────────────────────────

def _row_to_record(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["inputs"]           = json.loads(d["inputs"]) if d["inputs"] else {}
    d["recommendations"]  = json.loads(d["recommendations"]) if d["recommendations"] else []
    d["key_factors"]      = json.loads(d["key_factors"]) if d["key_factors"] else []
    # Expand ai_data (v2 structured fields)
    ai = json.loads(d.get("ai_data") or "{}") if d.get("ai_data") else {}
    d["risk_factors"]   = ai.get("risk_factors", [])
    d["strengths"]      = ai.get("strengths", [])
    d["weekly_plan"]    = ai.get("weekly_plan", {})
    d["report_summary"] = ai.get("report_summary", "")
    # Keep recommendations from ai_data if richer (list of dicts instead of list of strings)
    ai_recs = ai.get("recommendations", [])
    if ai_recs and isinstance(ai_recs[0], dict):
        d["recommendations"] = ai_recs
    return d


# ─── predictions ─────────────────────────────────────────────────────────────

def insert_prediction(record: dict, batch_id: str = None):
    conn = _get_conn()
    # Pack the rich AI fields into a single ai_data JSON blob
    ai_data = json.dumps({
        "risk_factors":    record.get("risk_factors", []),
        "strengths":       record.get("strengths", []),
        "recommendations": record.get("recommendations", []),
        "weekly_plan":     record.get("weekly_plan", {}),
        "report_summary":  record.get("report_summary", ""),
    })
    # Keep recommendations as flat strings for backward-compat columns
    recs_flat = [
        r["action"] if isinstance(r, dict) else r
        for r in record.get("recommendations", [])
    ]
    conn.execute("""
        INSERT INTO predictions
          (id, student_id, student_name, risk_level, confidence,
           inputs, explanation, recommendations, key_factors, timestamp, batch_id, ai_data,
           section, department, current_year)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        record["id"],
        record["student_id"],
        record["student_name"],
        record["risk_level"],
        record["confidence"],
        json.dumps(record.get("inputs", {})),
        record.get("explanation", ""),
        json.dumps(recs_flat),
        json.dumps(record.get("key_factors", [])),
        record["timestamp"],
        batch_id,
        ai_data,
        record.get("section"),
        record.get("department"),
        record.get("current_year"),
    ))
    conn.commit()
    conn.close()


def get_predictions(page: int = 1, limit: int = 15,
                    risk_level: str = None, search: str = None,
                    section: str = None) -> dict:
    conn = _get_conn()
    where, params = [], []
    if risk_level:
        where.append("risk_level = ?")
        params.append(risk_level)
    if search:
        where.append("(LOWER(student_name) LIKE ? OR LOWER(student_id) LIKE ?)")
        q = f"%{search.lower()}%"
        params.extend([q, q])
    if section:
        where.append("section = ?")
        params.append(section)
    clause = ("WHERE " + " AND ".join(where)) if where else ""
    total = conn.execute(f"SELECT COUNT(*) FROM predictions {clause}", params).fetchone()[0]
    rows  = conn.execute(
        f"SELECT * FROM predictions {clause} ORDER BY timestamp DESC LIMIT ? OFFSET ?",
        params + [limit, (page - 1) * limit]
    ).fetchall()
    conn.close()
    return {"items": [_row_to_record(r) for r in rows], "total": total}


def get_prediction_by_id(pred_id: str) -> dict | None:
    conn = _get_conn()
    row = conn.execute("SELECT * FROM predictions WHERE id = ?", (pred_id,)).fetchone()
    conn.close()
    return _row_to_record(row) if row else None


def delete_prediction(pred_id: str) -> bool:
    conn = _get_conn()
    cur = conn.execute("DELETE FROM predictions WHERE id = ?", (pred_id,))
    conn.commit()
    conn.close()
    return cur.rowcount > 0


def get_all_predictions_for_student(student_id: str) -> list:
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM predictions WHERE student_id = ? ORDER BY timestamp ASC",
        (student_id,)
    ).fetchall()
    conn.close()
    return [_row_to_record(r) for r in rows]


def get_dashboard_stats() -> dict:
    conn = _get_conn()
    total = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
    dist_rows = conn.execute(
        "SELECT risk_level, COUNT(*) as cnt FROM predictions GROUP BY risk_level"
    ).fetchall()
    dist = {r["risk_level"]: r["cnt"] for r in dist_rows}

    avg_row = conn.execute("""
        SELECT
            ROUND(AVG(json_extract(inputs,'$.attendance_percentage')),1)  AS att,
            ROUND(AVG(json_extract(inputs,'$.internal_marks')),1)          AS marks,
            ROUND(AVG(json_extract(inputs,'$.assignment_score')),1)        AS assign,
            ROUND(AVG(json_extract(inputs,'$.study_hours_per_day')),1)     AS hours
        FROM predictions
    """).fetchone()

    # Section-wise risk breakdown
    sec_rows = conn.execute("""
        SELECT section, risk_level, COUNT(*) as cnt
        FROM predictions WHERE section IS NOT NULL
        GROUP BY section, risk_level
    """).fetchall()
    section_stats = {}
    for r in sec_rows:
        s = r["section"]
        if s not in section_stats:
            section_stats[s] = {"Good": 0, "Average": 0, "At Risk": 0, "total": 0}
        section_stats[s][r["risk_level"]] = r["cnt"]
        section_stats[s]["total"] += r["cnt"]

    # Year distribution
    yr_rows = conn.execute("""
        SELECT current_year, COUNT(DISTINCT student_id) as cnt
        FROM predictions WHERE current_year IS NOT NULL
        GROUP BY current_year ORDER BY current_year
    """).fetchall()
    year_stats = {str(r["current_year"]): r["cnt"] for r in yr_rows}

    conn.close()
    return {
        "total_students": total,
        "risk_distribution": {
            "Good":    dist.get("Good", 0),
            "Average": dist.get("Average", 0),
            "At Risk": dist.get("At Risk", 0),
        },
        "average_attendance":      avg_row["att"]    or 0,
        "average_internal_marks":  avg_row["marks"]  or 0,
        "average_assignment_score":avg_row["assign"] or 0,
        "average_study_hours":     avg_row["hours"]  or 0,
        "section_stats":           section_stats,
        "year_stats":              year_stats,
    }


def get_alerts(min_consecutive: int = 2) -> list:
    """Return students with >= min_consecutive most-recent At Risk predictions."""
    conn = _get_conn()
    student_ids = [r["student_id"] for r in conn.execute(
        "SELECT DISTINCT student_id FROM predictions"
    ).fetchall()]
    alerts = []
    for sid in student_ids:
        rows = conn.execute(
            "SELECT * FROM predictions WHERE student_id = ? ORDER BY timestamp DESC",
            (sid,)
        ).fetchall()
        consecutive = 0
        for row in rows:
            if row["risk_level"] == "At Risk":
                consecutive += 1
            else:
                break
        if consecutive >= min_consecutive:
            rec = _row_to_record(rows[0])
            alerts.append({
                "student_id":   rec["student_id"],
                "student_name": rec["student_name"],
                "risk_level":   rec["risk_level"],
                "confidence":   rec["confidence"],
                "consecutive_at_risk": consecutive,
                "last_seen":    rec["timestamp"],
            })
    conn.close()
    return alerts


def get_rankings() -> list:
    """Return all unique students ranked by composite score (latest prediction each)."""
    conn = _get_conn()
    rows = conn.execute("""
        SELECT p.*
        FROM predictions p
        INNER JOIN (
            SELECT student_id, MAX(timestamp) AS latest
            FROM predictions GROUP BY student_id
        ) sub ON p.student_id = sub.student_id AND p.timestamp = sub.latest
    """).fetchall()
    conn.close()
    ranked = []
    for row in rows:
        r = _row_to_record(row)
        inp = r.get("inputs", {})
        att    = inp.get("attendance_percentage", 0)
        marks  = inp.get("internal_marks", 0)
        assign = inp.get("assignment_score", 0)
        hours  = inp.get("study_hours_per_day", 0)
        score  = round(att * 0.30 + marks * 0.35 + assign * 0.20 + hours * 10 * 0.15, 1)
        ranked.append({
            "student_id":   r["student_id"],
            "student_name": r["student_name"],
            "risk_level":   r["risk_level"],
            "confidence":   r["confidence"],
            "composite_score": score,
            "inputs":       inp,
            "timestamp":    r["timestamp"],
        })
    ranked.sort(key=lambda x: x["composite_score"], reverse=True)
    for i, s in enumerate(ranked):
        s["rank"] = i + 1
    return ranked


# ─── demo management ────────────────────────────────────────────────────────

def get_prediction_count() -> int:
    """Return total number of predictions in the database."""
    conn = _get_conn()
    count = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
    conn.close()
    return count


def clear_predictions():
    """Delete all rows from the predictions table."""
    conn = _get_conn()
    conn.execute("DELETE FROM predictions")
    conn.commit()
    conn.close()


def clear_batch_jobs():
    """Delete all rows from the batch_jobs table."""
    conn = _get_conn()
    conn.execute("DELETE FROM batch_jobs")
    conn.commit()
    conn.close()


# ─── batch jobs ──────────────────────────────────────────────────────────────

def insert_batch_job(job_id: str, filename: str, total_rows: int):
    conn = _get_conn()
    conn.execute(
        "INSERT INTO batch_jobs (id, filename, total_rows, processed, status, created_at) VALUES (?,?,?,0,'pending',?)",
        (job_id, filename, total_rows, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def update_batch_job(job_id: str, processed: int, status: str = "done"):
    conn = _get_conn()
    conn.execute(
        "UPDATE batch_jobs SET processed = ?, status = ? WHERE id = ?",
        (processed, status, job_id)
    )
    conn.commit()
    conn.close()


# ─── training history ─────────────────────────────────────────────────────────

def insert_training_history(accuracy: float, cv_score: float,
                            dataset_rows: int, feature_importances: dict):
    conn = _get_conn()
    conn.execute("""
        INSERT INTO training_history (accuracy, cv_score, dataset_rows, feature_importances, trained_at)
        VALUES (?,?,?,?,?)
    """, (accuracy, cv_score, dataset_rows, json.dumps(feature_importances),
          datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()


def has_null_cv_scores() -> bool:
    """Return True if any training_history rows have NULL cv_score."""
    conn = _get_conn()
    count = conn.execute(
        "SELECT COUNT(*) FROM training_history WHERE cv_score IS NULL"
    ).fetchone()[0]
    conn.close()
    return count > 0


def backfill_cv_scores(cv_score: float):
    """Set cv_score for all training_history rows where it is currently NULL."""
    conn = _get_conn()
    conn.execute(
        "UPDATE training_history SET cv_score = ? WHERE cv_score IS NULL",
        (cv_score,)
    )
    conn.commit()
    conn.close()


def get_training_history() -> list:
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM training_history ORDER BY trained_at DESC LIMIT 20"
    ).fetchall()
    conn.close()
    result = []
    for row in rows:
        d = dict(row)
        d["feature_importances"] = json.loads(d["feature_importances"]) if d["feature_importances"] else {}
        result.append(d)
    return result


# ─── advisory cache ──────────────────────────────────────────────────────────

def get_cached_advisory(cache_key: str) -> dict | None:
    """Retrieve a cached AI advisory response by cache_key."""
    conn = _get_conn()
    row = conn.execute("SELECT * FROM advisory_cache WHERE cache_key = ?", (cache_key,)).fetchone()
    conn.close()
    if not row:
        return None
    return json.loads(row["ai_response"])


def store_cached_advisory(cache_key: str, student_id: str, metrics_hash: str,
                          ai_response: dict, ai_provider: str, model_name: str):
    """Store an AI advisory response in the persistent cache."""
    conn = _get_conn()
    conn.execute("""
        INSERT OR REPLACE INTO advisory_cache
          (cache_key, student_id, metrics_hash, ai_response, ai_provider, model_name, created_at)
        VALUES (?,?,?,?,?,?,?)
    """, (cache_key, student_id, metrics_hash, json.dumps(ai_response),
          ai_provider, model_name, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()


def get_all_cached_advisories() -> list:
    """Return all cached advisory entries (for demo re-seeding)."""
    conn = _get_conn()
    rows = conn.execute("SELECT * FROM advisory_cache").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def clear_advisory_cache():
    """Delete all cached advisories."""
    conn = _get_conn()
    conn.execute("DELETE FROM advisory_cache")
    conn.commit()
    conn.close()


def get_advisory_cache_count() -> int:
    """Return number of cached advisories."""
    conn = _get_conn()
    count = conn.execute("SELECT COUNT(*) FROM advisory_cache").fetchone()[0]
    conn.close()
    return count
