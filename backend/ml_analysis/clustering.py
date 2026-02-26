"""
Student Behaviour Analysis — Clustering Module
===============================================
Applies t-SNE dimensionality reduction + KMeans clustering to discover
hidden student learning behaviour patterns, fulfilling the unsupervised
learning requirement of the referenced IEEE EDM paper.

Algorithm flow:
  1. Load student_data.csv  (4 academic features)
  2. StandardScale the features
  3. t-SNE  — reduce to 2D  (n_components=2, perplexity=30, random_state=42)
  4. KMeans — group into 3 clusters  (n_clusters=3, random_state=42)
  5. Interpret each cluster by composite score derived from per-cluster means
     (no hardcoding — ranking is fully data-driven)
  6. Return structured result dict

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
N_CLUSTERS      = 3
RANDOM_STATE    = 42

# Interpretation labels ordered from best → worst composite performance
_CLUSTER_LABELS = [
    "High Performing Group",
    "Average Learners Group",
    "At-Risk Behaviour Group",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _interpret_clusters(df: pd.DataFrame) -> dict:
    """
    Rank clusters by composite score and assign human-readable labels.

    Process:
      1. Compute per-cluster mean for every feature column.
      2. Min-max normalise the means across clusters (so each feature
         contributes equally regardless of its raw scale).
      3. Average the normalised values to produce a single composite score.
      4. Rank clusters: highest composite → _CLUSTER_LABELS[0] (High Performing),
         lowest → _CLUSTER_LABELS[2] (At-Risk Behaviour Group).

    Returns {cluster_id (int): interpretation_label (str)}
    """
    means   = df.groupby("cluster")[FEATURE_COLS].mean()
    normed  = (means - means.min()) / (means.max() - means.min() + 1e-9)
    composite = normed.mean(axis=1).sort_values(ascending=False)
    return {int(cid): _CLUSTER_LABELS[rank]
            for rank, cid in enumerate(composite.index.tolist())}


# ── Main entry point ──────────────────────────────────────────────────────────

def run_clustering() -> dict:
    """
    Execute the full t-SNE + KMeans analysis pipeline.

    Returns a dict conforming to the /api/student-clusters response schema:
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
                "interpretation":  str,
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

    # ── 2. t-SNE dimensionality reduction ─────────────────────────────────────
    tsne = TSNE(
        n_components=2,
        perplexity=30,
        random_state=RANDOM_STATE,
    )
    X_2d = tsne.fit_transform(X_scaled)

    # ── 3. KMeans clustering (on scaled feature space, not t-SNE space) ───────
    kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=RANDOM_STATE, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)

    df = df.copy()
    df["cluster"] = cluster_labels
    df["tsne_x"]  = X_2d[:, 0]
    df["tsne_y"]  = X_2d[:, 1]

    # ── 4. Derive interpretations ─────────────────────────────────────────────
    interpretation_map = _interpret_clusters(df)

    # ── 5. Cluster summary cards ──────────────────────────────────────────────
    clusters = []
    for cid in sorted(df["cluster"].unique()):
        grp = df[df["cluster"] == cid]
        clusters.append({
            "cluster_id":      int(cid),
            "student_count":   int(len(grp)),
            "avg_attendance":  round(float(grp["attendance_percentage"].mean()), 2),
            "avg_marks":       round(float(grp["internal_marks"].mean()), 2),
            "avg_assignments": round(float(grp["assignment_score"].mean()), 2),
            "avg_study_hours": round(float(grp["study_hours_per_day"].mean()), 2),
            "interpretation":  interpretation_map[cid],
        })

    # ── 6. Scatter plot points ────────────────────────────────────────────────
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
        "clusters":        clusters,
        "points":          points,
    }
