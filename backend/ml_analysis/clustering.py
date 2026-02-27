"""
Student Behaviour Analysis — Clustering Module
===============================================
Applies t-SNE dimensionality reduction + KMeans clustering to discover
hidden student learning behaviour patterns, fulfilling the unsupervised
learning requirement of the referenced IEEE EDM paper.

Algorithm flow:
  1. Load student_data.csv  (4 academic features)
  2. StandardScale the features
  3. Cluster Validation — compute inertia + silhouette score for k=2..8
     and auto-select the optimal k using highest silhouette score
  4. t-SNE  — reduce to 2D  (n_components=2, perplexity=30, random_state=42)
  5. KMeans — group into optimal_k clusters  (random_state=42)
  6. Interpret each cluster by composite score derived from per-cluster means
     (no hardcoding — ranking is fully data-driven)
  7. Generate rule-based teacher-friendly insight for each cluster
  8. Return structured result dict

Performance note:
  Large datasets are subsampled to ANALYSIS_SAMPLE rows before running
  t-SNE so the first-call latency stays within an acceptable range.
  All statistics (avg_attendance, etc.) are computed on the subsample.
"""

import os
import numpy as np
import pandas as pd
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "..", "data", "student_data.csv")

# ── Config ────────────────────────────────────────────────────────────────────
FEATURE_COLS    = [
    "attendance_percentage",
    "internal_marks",
    "assignment_score",
    "study_hours_per_day",
]
ANALYSIS_SAMPLE = 2000      # max rows fed into t-SNE (keeps first-run fast)
K_RANGE         = list(range(2, 9))   # k = 2 … 8  (elbow + silhouette sweep)
DEFAULT_K       = 3                   # fallback k if validation is inconclusive
RANDOM_STATE    = 42


# ── Label helpers ──────────────────────────────────────────────────────────────

def _get_cluster_labels(n: int) -> list:
    """
    Return interpretation labels ordered best → worst for n clusters.
    Covers k=2 through k=8; generic labels used for k>4 middle tiers.
    """
    if n == 2:
        return ["High Performing Group", "At-Risk Behaviour Group"]
    if n == 3:
        return [
            "High Performing Group",
            "Average Learners Group",
            "At-Risk Behaviour Group",
        ]
    if n == 4:
        return [
            "High Performing Group",
            "Above Average Learners Group",
            "Below Average Learners Group",
            "At-Risk Behaviour Group",
        ]
    # k ≥ 5 — generic middle-tier labels
    labels = ["High Performing Group"]
    for i in range(n - 2):
        labels.append(f"Learner Group {i + 1}")
    labels.append("At-Risk Behaviour Group")
    return labels


# ── Validation ────────────────────────────────────────────────────────────────

def _compute_validation_metrics(X_scaled: np.ndarray) -> dict:
    """
    Elbow Method + Silhouette Score sweep for k = 2 … 8.

    For each k:
      - Fit KMeans and record inertia  (elbow curve)
      - Compute silhouette_score       (cluster quality)

    Optimal k = k with the highest silhouette score.

    Returns:
        {
            "k_values":           [2, 3, ..., 8],
            "inertias":           [...],         # elbow curve values
            "silhouette_scores":  [...],         # quality per k
            "optimal_k":          int,
            "optimal_silhouette": float,
            "selection_method":   str,
        }
    """
    inertias   = []
    sil_scores = []

    for k in K_RANGE:
        km     = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
        labels = km.fit_predict(X_scaled)
        inertias.append(round(float(km.inertia_), 2))
        sil_scores.append(round(float(silhouette_score(X_scaled, labels)), 4))

    best_idx   = int(np.argmax(sil_scores))
    optimal_k  = K_RANGE[best_idx]

    return {
        "k_values":           K_RANGE,
        "inertias":           inertias,
        "silhouette_scores":  sil_scores,
        "optimal_k":          optimal_k,
        "optimal_silhouette": sil_scores[best_idx],
        "selection_method":   (
            f"Optimal number of clusters selected based on silhouette score. "
            f"k={optimal_k} provides the best cluster separation "
            f"(silhouette = {sil_scores[best_idx]:.3f})."
        ),
    }


# ── Interpretation ────────────────────────────────────────────────────────────

def _interpret_clusters(df: pd.DataFrame, n_clusters: int) -> dict:
    """
    Rank clusters by composite score and assign human-readable labels.

    Process:
      1. Compute per-cluster mean for every feature column.
      2. Min-max normalise the means across clusters (so each feature
         contributes equally regardless of its raw scale).
      3. Average the normalised values to produce a single composite score.
      4. Rank clusters: highest composite → best label, lowest → At-Risk.

    Returns {cluster_id (int): interpretation_label (str)}
    """
    means     = df.groupby("cluster")[FEATURE_COLS].mean()
    normed    = (means - means.min()) / (means.max() - means.min() + 1e-9)
    composite = normed.mean(axis=1).sort_values(ascending=False)
    labels    = _get_cluster_labels(n_clusters)
    return {
        int(cid): labels[rank]
        for rank, cid in enumerate(composite.index.tolist())
    }


# ── Insight generation ────────────────────────────────────────────────────────

def _generate_cluster_insight(cluster: dict) -> str:
    """
    Generate a rule-based 2–3 sentence teacher-friendly insight for a cluster.
    Derived entirely from the cluster's interpretation label + feature averages.
    No labels are hardcoded — the text adapts to whatever label is assigned.
    """
    interp = cluster["interpretation"]
    att    = cluster["avg_attendance"]
    marks  = cluster["avg_marks"]
    asgn   = cluster["avg_assignments"]
    hrs    = cluster["avg_study_hours"]

    if "High Performing" in interp:
        return (
            f"Students in this group maintain strong academic metrics — "
            f"{att:.1f}% average attendance and {marks:.1f}% internal marks. "
            f"They study approximately {hrs:.1f} hours per day and complete "
            f"{asgn:.1f}% of assignments. "
            "This cohort is on track and may benefit from advanced enrichment "
            "or peer-leadership opportunities."
        )

    if "At-Risk" in interp:
        return (
            f"Students in this group show low engagement patterns — "
            f"{att:.1f}% attendance and {marks:.1f}% internal marks on average. "
            f"With only {hrs:.1f} hours of daily study and {asgn:.1f}% assignment completion, "
            "they risk academic underperformance. "
            "Immediate faculty attention, counselling, and structured peer-mentoring "
            "are strongly recommended."
        )

    if "Above Average" in interp:
        return (
            f"Students here perform above the class median — {att:.1f}% attendance "
            f"and {marks:.1f}% internal marks. "
            f"Studying {hrs:.1f} hours daily, they show good habits but have room "
            "to reach the high-performing tier. "
            "Focused exam preparation and consistent assignment submission will "
            "help close the remaining gap."
        )

    if "Below Average" in interp:
        return (
            f"Students here fall slightly below the class average — {att:.1f}% attendance "
            f"and {marks:.1f}% internal marks. "
            f"They study {hrs:.1f} hours daily, which may be insufficient given "
            f"their assignment completion rate of {asgn:.1f}%. "
            "Structured study schedules, assignment review sessions, and regular "
            "faculty check-ins are advised."
        )

    # Generic middle tier (Average Learners, or numbered Learner Groups)
    return (
        f"Students in this group show moderate academic engagement — "
        f"{att:.1f}% attendance and {marks:.1f}% internal marks on average. "
        f"They study {hrs:.1f} hours per day and score {asgn:.1f}% on assignments. "
        "Targeted academic support and motivation strategies can help transition "
        "this group to a higher performance tier."
    )


# ── Main entry point ──────────────────────────────────────────────────────────

def run_clustering() -> dict:
    """
    Execute the full t-SNE + KMeans analysis pipeline with cluster validation.

    Returns a dict conforming to the /api/student-clusters response schema:
    {
        "total_students": int,
        "optimal_k":      int,
        "validation": {
            "k_values":           [2, 3, ..., 8],
            "inertias":           [...],
            "silhouette_scores":  [...],
            "optimal_k":          int,
            "optimal_silhouette": float,
            "selection_method":   str,
        },
        "clusters": [
            {
                "cluster_id":      int,
                "student_count":   int,
                "avg_attendance":  float,
                "avg_marks":       float,
                "avg_assignments": float,
                "avg_study_hours": float,
                "interpretation":  str,
                "insight":         str,   ← teacher-friendly explanation
            }
        ],
        "points": [{"x": float, "y": float, "cluster": int}, ...]
    }

    Raises:
        FileNotFoundError — if student_data.csv is absent.
        ValueError        — if required feature columns are missing.
    """
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            "Dataset not found. Please train the model first to "
            "auto-generate student_data.csv."
        )

    df = pd.read_csv(DATASET_PATH)

    missing = [c for c in FEATURE_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required feature columns: {missing}")

    # ── Subsample for speed ───────────────────────────────────────────────────
    if len(df) > ANALYSIS_SAMPLE:
        df = df.sample(ANALYSIS_SAMPLE, random_state=RANDOM_STATE).reset_index(drop=True)

    X = df[FEATURE_COLS].values

    # ── 1. Standardise ────────────────────────────────────────────────────────
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ── 2. Cluster validation: elbow + silhouette for k=2..8 ─────────────────
    validation = _compute_validation_metrics(X_scaled)
    optimal_k  = validation["optimal_k"]

    # ── 3. t-SNE dimensionality reduction ─────────────────────────────────────
    tsne = TSNE(
        n_components=2,
        perplexity=30,
        random_state=RANDOM_STATE,
    )
    X_2d = tsne.fit_transform(X_scaled)

    # ── 4. KMeans clustering with auto-selected optimal k ─────────────────────
    kmeans         = KMeans(n_clusters=optimal_k, random_state=RANDOM_STATE, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)

    df = df.copy()
    df["cluster"] = cluster_labels
    df["tsne_x"]  = X_2d[:, 0]
    df["tsne_y"]  = X_2d[:, 1]

    # ── 5. Derive interpretations ─────────────────────────────────────────────
    interpretation_map = _interpret_clusters(df, optimal_k)

    # ── 6. Cluster summary cards + insights ───────────────────────────────────
    clusters = []
    for cid in sorted(df["cluster"].unique()):
        grp  = df[df["cluster"] == cid]
        card = {
            "cluster_id":      int(cid),
            "student_count":   int(len(grp)),
            "avg_attendance":  round(float(grp["attendance_percentage"].mean()), 2),
            "avg_marks":       round(float(grp["internal_marks"].mean()), 2),
            "avg_assignments": round(float(grp["assignment_score"].mean()), 2),
            "avg_study_hours": round(float(grp["study_hours_per_day"].mean()), 2),
            "interpretation":  interpretation_map[cid],
        }
        card["insight"] = _generate_cluster_insight(card)
        clusters.append(card)

    # ── 7. Scatter plot points ────────────────────────────────────────────────
    points = [
        {
            "x":       round(float(row.tsne_x), 4),
            "y":       round(float(row.tsne_y), 4),
            "cluster": int(row.cluster),
        }
        for row in df[["tsne_x", "tsne_y", "cluster"]].itertuples(index=False)
    ]

    return {
        "total_students": int(len(df)),
        "optimal_k":      optimal_k,
        "validation":     validation,
        "clusters":       clusters,
        "points":         points,
    }
