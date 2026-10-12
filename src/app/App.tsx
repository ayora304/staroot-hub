import { RouterProvider } from 'react-router-dom'
import { Suspense } from 'react'
import { UpdateBanner } from '../core/pwa/UpdateBanner'
import { Providers } from './providers'
import { router } from './router'

export default function App() {
  return (
    <Providers>
      <Suspense fallback={<div role="status" className="min-h-screen-safe mx-auto max-w-3xl px-safe pt-safe pb-safe text-sm text-muted">Loading module…</div>}><RouterProvider router={router} /></Suspense>
      <UpdateBanner />
    </Providers>
  )
}
