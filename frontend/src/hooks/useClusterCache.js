import { useState, useEffect, useRef, useCallback } from 'react'
import { getStudentClusters } from '../api'
import { setClusterReady } from '../utils/clusterUtils'

// Global cache for cluster data (persists across navigation)
let globalClusterCache = null
let globalCacheTimestamp = null
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export function useClusterCache() {
  const [data, setData] = useState(globalClusterCache)
  const [loading, setLoading] = useState(!globalClusterCache)
  const [error, setError] = useState(null)
  const [isPrecomputing, setIsPrecomputing] = useState(false)
  const mountedRef = useRef(true)

  const isCacheValid = useCallback(() => {
    if (!globalClusterCache || !globalCacheTimestamp) return false
    return Date.now() - globalCacheTimestamp < CACHE_DURATION_MS
  }, [])

  const fetchClusters = useCallback(async (force = false) => {
    if (!force && isCacheValid()) {
      setData(globalClusterCache)
      setLoading(false)
      return globalClusterCache
    }

    setLoading(true)
    setError(null)
    
    try {
      const res = await getStudentClusters(force)
      if (mountedRef.current) {
        globalClusterCache = res.data
        globalCacheTimestamp = Date.now()
        setData(res.data)
        setLoading(false)
        setClusterReady(true)
      }
      return res.data
    } catch (e) {
      if (mountedRef.current) {
        setError(e?.response?.data?.detail ?? 'Failed to load clustering data.')
        setLoading(false)
      }
      throw e
    }
  }, [isCacheValid])

  // Pre-compute in background without blocking
  const precompute = useCallback(async () => {
    if (isCacheValid() || isPrecomputing) return
    
    setIsPrecomputing(true)
    try {
      await fetchClusters()
    } catch (e) {
      // Silent fail - will retry when user navigates
    } finally {
      setIsPrecomputing(false)
    }
  }, [fetchClusters, isCacheValid, isPrecomputing])

  // Refresh data
  const refresh = useCallback(async () => {
    return fetchClusters(true)
  }, [fetchClusters])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    data,
    loading,
    error,
    isPrecomputing,
    fetchClusters,
    precompute,
    refresh,
    isReady: !!data && !loading
  }
}

// Hook to trigger background pre-computation
export function useClusterPrecompute() {
  const { precompute, isPrecomputing } = useClusterCache()

  useEffect(() => {
    // Start pre-computation after a short delay (let critical UI load first)
    const timer = setTimeout(() => {
      precompute()
    }, 2000)

    return () => clearTimeout(timer)
  }, [precompute])

  return { isPrecomputing }
}
