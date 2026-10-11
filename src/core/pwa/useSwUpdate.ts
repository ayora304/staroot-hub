import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/** Registers the service worker and exposes an "update available" flag. */
export function useSwUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const updateRef = useRef<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    updateRef.current = registerSW({ onNeedRefresh: () => setNeedRefresh(true) })
  }, [])

  return { needRefresh, applyUpdate: () => void updateRef.current?.(true) }
}
