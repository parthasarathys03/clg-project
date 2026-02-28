// Global cache check for cluster ready state
let globalClusterReady = false

export function setClusterReady(ready) {
  globalClusterReady = ready
}

export function isClusterReady() {
  return globalClusterReady
}