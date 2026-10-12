/** Ask the browser to protect the durable queue and read cache from automatic eviction. */
export async function requestPersistentStorage(): Promise<boolean | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return null
  try { return await navigator.storage.persist() }
  catch { return false }
}
