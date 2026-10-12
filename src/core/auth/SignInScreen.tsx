import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ApiError, isNetworkError } from '../api/client'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icons'
import { useSession } from './useSession'

export function SignInScreen() {
  const { status, signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'authed') return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      if (isNetworkError(err)) setError('You are offline. Connect to the internet to sign in.')
      else if (err instanceof ApiError) setError(err.message)
      else setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const field =
    'w-full min-h-12 rounded-xl border border-border bg-surface px-4 text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent'

  return (
    <main className="min-h-screen-safe flex items-center justify-center px-safe py-6 pt-safe pb-safe">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5"
        aria-label="Sign in"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-contrast">
            <Icon name="lock" className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-text">Staroot Hub</h1>
            <p className="text-sm text-muted">Sign in with your company email</p>
          </div>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted">Email</span>
          <input className={field} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted">Password</span>
          <input className={field} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" loading={busy} className="w-full">
          Sign in
        </Button>
        <p className="text-center text-xs text-muted">Accounts are created by an administrator.</p>
      </form>
    </main>
  )
}
