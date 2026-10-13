import { Link } from 'react-router-dom'
import { AuthArtwork, AuthBrand, AuthDivider, SocialRow } from './AuthArtwork'

export function SignInScreen() {
  return (
    <main className="auth-screen-wrap">
      <section className="auth-phone auth-phone-form" aria-labelledby="signin-title">
        <AuthArtwork />
        <Link className="auth-back" to="/welcome"><span aria-hidden="true">‹</span> Back</Link>
        <AuthBrand />
        <div className="auth-white-panel auth-white-panel-login">
          <h1 id="signin-title">Welcome back</h1>
          <div className="auth-fields">
            <label className="auth-field"><span>Email</span><input type="email" autoComplete="username" placeholder="Company email" /></label>
            <label className="auth-field"><span>Password</span><input type="password" autoComplete="current-password" placeholder="Password" /></label>
          </div>
          <div className="auth-options">
            <label className="auth-remember"><input type="checkbox" defaultChecked /> Remember me</label>
            <button className="auth-text-button" type="button">Forgot password?</button>
          </div>
          <button className="auth-primary-button" type="button">Sign in</button>
          <AuthDivider label="Sign in with" />
          <SocialRow />
          <p className="auth-switch-copy">Don’t have an account? <Link to="/signup">Sign up</Link></p>
        </div>
      </section>
    </main>
  )
}
