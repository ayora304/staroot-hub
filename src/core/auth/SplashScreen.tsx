import { AuthArtwork, AuthBrand } from './AuthArtwork'

export function SplashScreen() {
  return (
    <main className="auth-screen-wrap">
      <section className="auth-phone auth-phone-splash" aria-label="Staroot Hub splash screen preview">
        <AuthArtwork />
        <div className="splash-center">
          <AuthBrand />
          <p>Your work, connected.</p>
          <span className="splash-indicator" aria-hidden="true"><i /></span>
        </div>
      </section>
    </main>
  )
}
