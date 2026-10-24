import { Link } from 'react-router-dom'

export function SplashScreen() {
  return (
    <main className="auth-screen-wrap auth-screen-wrap-welcome">
      <section className="auth-phone auth-phone-welcome auth-phone-splash" aria-label="Staroot Hub splash screen">
        <div className="auth-art welcome-art" aria-hidden="true" />
        <div className="splash-content">
          <div className="splash-brand">
            <img className="splash-mark" src="/assets/staroot-mark-white.svg" alt="" />
          </div>
        </div>
        <nav className="welcome-switch" aria-label="Continue to sign in">
          <Link to="/login">Get Started</Link>
        </nav>
      </section>
    </main>
  )
}
