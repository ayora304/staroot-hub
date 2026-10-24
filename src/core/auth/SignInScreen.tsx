import { useEffect, useState, type FormEvent } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
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
  const [isSuccess, setIsSuccess] = useState(false)
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
      setIsSuccess(true)
      window.setTimeout(() => navigate('/', { replace: true }), 8000)
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
    <main className="auth-screen-wrap auth-screen-wrap-login auth-screen-wrap-combined">
      <section className="auth-phone auth-phone-form auth-phone-combined" aria-labelledby="signin-title">
        <div className="auth-art welcome-art" aria-hidden="true" />
        <div className="splash-brand combined-auth-brand" aria-label="Staroot">
          <img className="splash-mark" src="/assets/staroot-mark-white.svg" alt="" />
        </div>
        <div className="auth-white-panel auth-white-panel-login glass3d">
          {isSuccess ? (
            <div className="auth-login-success" role="status" aria-live="polite">
              <span className="auth-login-success-icon" aria-hidden="true">
                <svg viewBox="0 0 512 512" role="presentation">
                  <path
                    className="auth-login-success-badge"
                    d="M253.5 43.2C251.2 43.6 244.7 44.1 240.2 45.2C235.8 46.4 231.4 47.7 227 50C222.6 52.3 218.2 55.5 213.8 59.2C209.3 63 204.9 68 200.5 72.2C196.1 76.5 191.7 82.4 187.2 84.8C182.8 87.1 178.4 85.9 174 86.2C169.6 86.6 165.2 86.6 160.8 86.8C156.3 86.9 151.9 86.7 147.5 87C143.1 87.3 138.7 87.7 134.2 88.8C129.8 89.8 125.4 91.2 121 93.5C116.6 95.8 111.8 98.8 107.8 102.5C103.7 106.2 99.4 111.3 96.5 115.8C93.6 120.2 91.8 124.6 90.2 129C88.7 133.4 87.8 137.8 87.2 142.2C86.7 146.7 87 151.1 87 155.5C87 159.9 87.1 164.3 87 168.8C86.9 173.2 88.2 177.6 86.5 182C84.8 186.4 80.5 190.8 76.8 195.2C73 199.7 68.2 204.1 64.2 208.5C60.3 212.9 56 217.3 53 221.8C50 226.2 47.9 230.6 46.2 235C44.6 239.4 43.5 243.8 43 248.2C42.5 252.7 42.5 257.1 43 261.5C43.5 265.9 44.3 270.3 45.8 274.8C47.2 279.2 49 283.6 51.8 288C54.5 292.4 58.5 296.8 62.5 301.2C66.5 305.7 71.7 310.1 75.5 314.5C79.3 318.9 83.5 323.3 85.2 327.8C87 332.2 86 336.6 86.2 341C86.5 345.4 86.8 349.8 87 354.2C87.2 358.7 86.8 363.1 87.2 367.5C87.7 371.9 88.2 376.3 89.5 380.8C90.8 385.2 92.5 389.6 95.2 394C98 398.4 101.8 403.4 105.8 407.2C109.7 411.1 114.6 414.5 119 417C123.4 419.5 127.8 421.2 132.2 422.5C136.7 423.8 141.1 424.4 145.5 424.8C149.9 425.1 154.3 424.7 158.8 424.8C163.2 424.8 167.6 424.7 172 425C176.4 425.3 180.8 424.3 185.2 426.5C189.7 428.7 194.1 434 198.5 438C202.9 442 207.3 446.7 211.8 450.5C216.2 454.3 220.6 458.1 225 460.8C229.4 463.4 233.8 465.2 238.2 466.5C242.7 467.8 247.1 468.4 251.5 468.8C255.9 469.1 260.3 469.1 264.8 468.5C269.2 467.9 273.6 466.8 278 465C282.4 463.2 286.8 461.2 291.2 458C295.7 454.8 300.1 450.1 304.5 446C308.9 441.9 313.3 436.6 317.8 433.2C322.2 429.9 326.6 427.3 331 426C335.4 424.7 339.8 425.5 344.2 425.2C348.7 425 353.1 424.9 357.5 424.8C361.9 424.6 366.3 424.9 370.8 424.2C375.2 423.6 379.6 422.6 384 421C388.4 419.4 392.9 417.5 397.2 414.5C401.6 411.5 406.7 406.9 410.2 402.8C413.8 398.6 416.6 393.9 418.8 389.5C420.9 385.1 422.2 380.7 423.2 376.2C424.2 371.8 424.5 367.4 424.8 363C425 358.6 424.7 354.2 424.8 349.8C424.8 345.3 424.2 340.9 425 336.5C425.8 332.1 426.6 327.7 429.2 323.2C431.9 318.8 436.9 314.4 441 310C445.1 305.6 450.2 301.2 453.8 296.8C457.3 292.3 460.2 287.9 462.5 283.5C464.8 279.1 466.2 274.7 467.2 270.2C468.3 265.8 468.9 261.4 469 257C469.1 252.6 468.6 248.2 467.8 243.8C466.9 239.3 465.8 234.9 463.8 230.5C461.7 226.1 459 221.7 455.5 217.2C452 212.8 447.2 208.4 443 204C438.8 199.6 433.1 195.2 430.2 190.8C427.4 186.3 426.6 181.9 425.8 177.5C424.9 173.1 425.2 168.7 425 164.2C424.8 159.8 425 155.4 424.8 151C424.5 146.6 424.6 142.2 423.8 137.8C422.9 133.3 421.7 128.9 419.8 124.5C417.8 120.1 415.4 115.5 412 111.2C408.6 107 403.8 102.3 399.5 99C395.2 95.7 390.7 93.4 386.2 91.5C381.8 89.6 377.4 88.5 373 87.8C368.6 87 364.2 87.1 359.8 87C355.3 86.9 350.9 87.1 346.5 87C342.1 86.9 337.7 87.7 333.2 86.5C328.8 85.3 324.4 82.9 320 79.8C315.6 76.6 311.2 71.8 306.8 67.8C302.3 63.7 297.9 58.8 293.5 55.5C289.1 52.2 284.7 49.9 280.2 48C275.8 46.1 271.4 45 267 44.2C262.6 43.5 256 43.4 253.8 43.2C251.5 43.1 255.8 42.9 253.5 43.2Z"
                  />
                  <path className="auth-login-success-check" d="M186 268L224 306L328 202" />
                </svg>
              </span>
              <h1 id="signin-title">You’re signed in</h1>
              <p>Opening your workspace…</p>
            </div>
          ) : (
            <form className="auth-login-content" onSubmit={handleSubmit}>
              <h1 id="signin-title">Sign in to Staroot</h1>
              <p className="auth-switch-copy">Your organization’s workspace, all in one place.</p>
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
          )}
        </div>
      </section>
    </main>
  )
}
