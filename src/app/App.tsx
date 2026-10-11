import { RouterProvider } from 'react-router-dom'
import { UpdateBanner } from '../core/pwa/UpdateBanner'
import { Providers } from './providers'
import { router } from './router'

export default function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <UpdateBanner />
    </Providers>
  )
}
