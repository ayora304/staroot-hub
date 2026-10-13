import { Link } from 'react-router-dom'
import { AuthArtwork, AuthBrand, AuthDivider, SocialRow } from './AuthArtwork'

export function SignUpScreen() {
  return (
    <main className="auth-screen-wrap">
      <section className="auth-phone auth-phone-form" aria-labelledby="signup-title">
        <AuthArtwork />
        <Link className="auth-back" to="/welcome"><span aria-hidden="true">‹</span> Back</Link>
        <AuthBrand />
        <div className="auth-white-panel auth-white-panel-signup">
          <h1 id="signup-title">Get Started</h1>
          <div className="auth-fields">
            <label className="auth-field"><span>Full Name</span><input autoComplete="name" placeholder="Enter Full Name" /></label>
            <label className="auth-field"><span>Email</span><input type="email" autoComplete="email" placeholder="Enter Email" /></label>
            <label className="auth-field"><span>Password</span><input type="password" autoComplete="new-password" placeholder="Enter Password" /></label>
          </div>
          <label className="auth-consent"><input type="checkbox" /> <span>I agree to the processing of <strong>Personal data</strong></span></label>
          <button className="auth-primary-button" type="button">Sign up</button>
          <AuthDivider label="Sign up with" />
          <SocialRow />
          <p className="auth-switch-copy">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  )
}
