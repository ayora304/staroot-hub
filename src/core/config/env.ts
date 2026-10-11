export const env = {
  apiBase: import.meta.env.VITE_API_BASE ?? '/api',
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '',
} as const
