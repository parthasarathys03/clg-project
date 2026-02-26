"""
Analysis Service
================
Orchestration layer over the clustering module.

Caches the t-SNE + KMeans result in module-level memory so that the
expensive computation runs only ONCE per server lifetime.  Subsequent
calls to get_student_clusters() return the cached result instantly.

Public API:
    get_student_clusters(force_recompute=False) -> dict
    invalidate_cache()                          -> None
"""

from typing import Optional
from ml_analysis.clustering import run_clustering

_cache: Optional[dict] = None


def get_student_clusters(force_recompute: bool = False) -> dict:
    """
    Return clustering results, computing on the first call.

    Args:
        force_recompute: If True, discard cached data and recompute.

    Returns:
        Dict conforming to /api/student-clusters response schema.

    Raises:
        FileNotFoundError — propagated from clustering.run_clustering()
                            when student_data.csv is absent.
    """
    global _cache
    if _cache is None or force_recompute:
        _cache = run_clustering()
    return _cache


def invalidate_cache() -> None:
    """
    Discard cached clustering results.
    Call this after the dataset is regenerated so the next API request
    triggers a fresh t-SNE + KMeans computation.
    """
    global _cache
    _cache = None
