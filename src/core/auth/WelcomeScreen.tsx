import { useEffect } from 'react'
import { Link, useBlocker } from 'react-router-dom'

export function WelcomeScreen() {
  const blocker = useBlocker(({ historyAction }) => historyAction === 'POP')

  useEffect(() => {
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker.state, blocker.reset])

  return (
    <main className="auth-screen-wrap auth-screen-wrap-welcome">
      <section className="auth-phone auth-phone-welcome" aria-label="Staroot Hub welcome">
        <div className="auth-art welcome-art" aria-hidden="true" />
        <div className="welcome-copy">
          <ul className="welcome-values" aria-label="Our values">
            <li>Innovation</li>
            <li>Experience</li>
            <li>Trust</li>
          </ul>
        </div>
        <nav className="welcome-switch" aria-label="Continue to sign in">
          <Link to="/login">Get Started</Link>
        </nav>
      </section>
    </main>
  )
}
