import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from './useSession'

export function AccessCodeGate({ mode }: { mode: 'setup' | 'locked' }) {
  const { session, setAccessCode, unlockWithAccessCode, signOut } = useSession()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isSetup = mode === 'setup'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code)) {
      setError('Enter a 6-digit code.')
      return
    }
    if (isSetup && code !== confirmation) {
      setError('Those codes do not match.')
      return
    }
    setBusy(true)
    try {
      if (isSetup) {
        await setAccessCode(code)
      } else {
        const result = await unlockWithAccessCode(code)
        if (!result.ok) {
          setError(result.retryAfterMs > 0
            ? `Too many attempts. Try again in ${Math.ceil(result.retryAfterMs / 1000)} seconds.`
            : 'That code did not match. Try again.')
          setCode('')
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the access code. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function usePassword() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10 text-text">
      <section className="w-full max-w-sm rounded-3xl border border-border bg-surface/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8" aria-labelledby="access-code-title">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Staroot Hub</p>
        <h1 id="access-code-title" className="text-2xl font-semibold text-text">
          {isSetup ? 'Set your access code' : `Welcome back, ${session?.profile.display_name ?? ''}`}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {isSetup
            ? 'Create a 6-digit code to unlock this device after you sign in.'
            : 'Enter your 6-digit code to unlock Staroot Hub.'}
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm font-medium text-text">
            <span>{isSetup ? 'New access code' : 'Access code'}</span>
            <input
              aria-label={isSetup ? 'New access code' : 'Access code'}
              autoComplete="off"
              autoFocus
              className="min-h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-center text-xl tracking-[0.4em] text-text outline-none focus-visible:ring-2 focus-visible:ring-accent"
              inputMode="numeric"
              maxLength={6}
              name="access-code"
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              pattern="[0-9]{6}"
              required
              type="password"
              value={code}
            />
          </label>
          {isSetup && (
            <label className="block space-y-2 text-sm font-medium text-text">
              <span>Confirm access code</span>
              <input
                aria-label="Confirm access code"
                autoComplete="off"
                className="min-h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-center text-xl tracking-[0.4em] text-text outline-none focus-visible:ring-2 focus-visible:ring-accent"
                inputMode="numeric"
                maxLength={6}
                name="confirm-access-code"
                onChange={(event) => setConfirmation(event.target.value.replace(/\D/g, '').slice(0, 6))}
                pattern="[0-9]{6}"
                required
                type="password"
                value={confirmation}
              />
            </label>
          )}
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <button className="min-h-12 w-full rounded-xl bg-accent px-4 font-semibold text-accent-contrast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60" disabled={busy} type="submit">
            {busy ? 'Please wait…' : isSetup ? 'Save access code' : 'Unlock'}
          </button>
        </form>
        {!isSetup && <button className="mt-4 min-h-11 w-full rounded-xl text-sm font-medium text-muted underline underline-offset-4" onClick={() => void usePassword()} type="button">Use password instead</button>}
      </section>
    </main>
  )
}
