import { useEffect, useState, type FormEvent } from 'react'
import { Link, useBlocker, useNavigate } from 'react-router-dom'
import { ApiError, isNetworkError } from '../api/client'
import { useSession } from './useSession'

export function SignInScreen() {
  const blocker = useBlocker(({ historyAction }) => historyAction === 'POP')
  const navigate = useNavigate()
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker.state, blocker.reset])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate('/', { replace: true })
    } catch (cause) {
      if (isNetworkError(cause)) {
        setError('Unable to connect. Check your internet connection and try again.')
      } else if (cause instanceof ApiError && cause.status === 401) {
        setError('Email or password is incorrect. Please try again.')
      } else if (cause instanceof ApiError && cause.status === 403) {
        setError('Your account does not have access. Contact your organization administrator.')
      } else {
        setError('Sign in failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen-wrap auth-screen-wrap-login">
      <section className="auth-phone auth-phone-form" aria-labelledby="signin-title">
        <div className="auth-art welcome-art" aria-hidden="true" />
        <Link className="auth-back" to="/welcome" aria-label="Back to welcome">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m14.5 5-7 7 7 7" />
          </svg>
        </Link>
        <img className="auth-login-mark" src="/assets/staroot-mark-white.svg" alt="Staroot" />
        <div className="auth-white-panel auth-white-panel-login glass3d">
          <form className="auth-login-content" onSubmit={handleSubmit}>
            <h1 id="signin-title">Login to Proceed</h1>
            <p className="auth-switch-copy">Account access is managed by your organization.</p>
            <div className="auth-fields">
              <label className="auth-field glass3d">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                  <path d="m4.5 7 7.5 6 7.5-6" />
                </svg>
                <input type="email" autoComplete="username" aria-label="Email" placeholder="Company email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <div className="auth-field glass3d">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="4.5" y="10" width="15" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" />
                </svg>
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" aria-label="Password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button
                  className="auth-password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    {showPassword ? (
                      <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>
                    ) : (
                      <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 6.2A10.9 10.9 0 0 1 12 6c6.1 0 9.5 6 9.5 6a15 15 0 0 1-3 3.5M6.2 6.2C3.8 7.8 2.5 12 2.5 12s3.4 6 9.5 6c1 0 1.9-.2 2.8-.5" /></>
                    )}
                  </svg>
                </button>
              </div>
            </div>
            <div className="auth-options">
              <label className="auth-remember"><input type="checkbox" defaultChecked /> Keep me signed in</label>
              <button className="auth-text-button" type="button">Forgot password?</button>
            </div>
            {error && <p className="auth-login-error" role="alert">{error}</p>}
            <button className="auth-login-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </div>
      </section>
    </main>
  )
}
