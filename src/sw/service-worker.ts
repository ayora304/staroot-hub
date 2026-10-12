/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<string | { url: string; revision: string | null }> }

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// SPA: serve the precached shell for any navigation except API calls.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//] }))

// Lazy module chunks are cached after first use. Large PDF/DOCX renderers are omitted from the install precache.
registerRoute(
  ({ request, url }) => request.destination === 'script' && url.pathname.startsWith('/assets/'),
  new CacheFirst({
    cacheName: 'staroot-module-chunks-v1',
    plugins: [new CacheableResponsePlugin({ statuses: [200] }), new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
)

// API traffic is never cached here. Offline writes are handled by the Phase 2 outbox.
registerRoute(({ url }) => url.pathname.startsWith('/api/'), new NetworkOnly())

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting()
})
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Push (payload carries only a title and a route; no sensitive detail).
self.addEventListener('push', (event) => {
  let data = { title: 'Staroot Hub', body: '', link: '/' }
  try {
    data = { ...data, ...(event.data?.json() ?? {}) }
  } catch {
    /* non-JSON payload */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { link: data.link },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link: string = event.notification.data?.link ?? '/'
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = all[0]
      if (open) {
        await open.focus()
        await open.navigate(link)
      } else {
        await self.clients.openWindow(link)
      }
    })(),
  )
})
