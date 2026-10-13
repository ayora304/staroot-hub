import { useEffect } from 'react'
import { Link, useBlocker } from 'react-router-dom'

export function SignInScreen() {
  const blocker = useBlocker(({ historyAction }) => historyAction === 'POP')

  useEffect(() => {
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker.state, blocker.reset])

  return (
    <main className="auth-screen-wrap auth-screen-wrap-login">
      <section className="auth-phone auth-phone-form" aria-labelledby="signin-title">
        <div className="auth-art welcome-art" aria-hidden="true" />
        <Link className="auth-back" to="/welcome"><span aria-hidden="true">‹</span> Back</Link>
        <div className="auth-white-panel auth-white-panel-login">
          <div className="auth-login-content">
            <h1 id="signin-title">Login to Proceed</h1>
            <div className="auth-fields">
              <label className="auth-field"><span>Email</span><input type="email" autoComplete="username" placeholder="Company email" /></label>
              <label className="auth-field"><span>Password</span><input type="password" autoComplete="current-password" placeholder="Password" /></label>
            </div>
            <div className="auth-options">
              <label className="auth-remember"><input type="checkbox" defaultChecked /> Remember me</label>
              <button className="auth-text-button" type="button">Forgot password?</button>
            </div>
            <p className="auth-switch-copy">Account access is managed by your organization.</p>
          </div>
          <button className="auth-primary-button auth-login-button" type="button">Sign in</button>
          <span className="auth-google-mark" role="img" aria-label="Sign in with Google">G</span>
        </div>
      </section>
    </main>
  )
}
