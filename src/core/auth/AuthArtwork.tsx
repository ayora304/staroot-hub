export function AuthArtwork() {
  return (
    <div className="auth-art" aria-hidden="true">
      <svg viewBox="0 0 430 760" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="auth-blue" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#4569C5" />
            <stop offset="1" stopColor="#91A6E4" />
          </linearGradient>
          <linearGradient id="auth-wave" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#2E57B2" />
            <stop offset="1" stopColor="#172D67" />
          </linearGradient>
          <radialGradient id="auth-sphere" cx="32%" cy="24%" r="78%">
            <stop stopColor="#F5F8FF" />
            <stop offset="0.52" stopColor="#A9C5FF" />
            <stop offset="1" stopColor="#5279D1" />
          </radialGradient>
          <radialGradient id="auth-dark-sphere" cx="30%" cy="25%" r="78%">
            <stop stopColor="#426FD1" />
            <stop offset="1" stopColor="#101D46" />
          </radialGradient>
        </defs>
        <rect width="430" height="760" fill="url(#auth-blue)" />
        <path d="M210-50C365 58 358 137 258 210S108 321 212 411s239 120 234 263V-50z" fill="#DCE6FF" opacity=".86" />
        <path d="M-30 251C67 179 188 227 235 304s4 129-81 197-68 158 11 259H-30z" fill="#3E65BF" opacity=".84" />
        <path d="M-20 522c93-70 153-36 222 17s147 41 252-39v300H-20z" fill="url(#auth-wave)" />
        <path d="M244 216c70-47 112-35 174 21v157c-76-58-116-28-179 4-76 39-126 7-174-29 89-20 112-102 179-153z" fill="#6E8BDD" opacity=".7" />
        <circle cx="345" cy="216" r="87" fill="#5C87D9" opacity=".82" />
        <circle cx="337" cy="282" r="53" fill="url(#auth-sphere)" />
        <circle cx="47" cy="50" r="78" fill="url(#auth-dark-sphere)" />
        <circle cx="93" cy="558" r="34" fill="url(#auth-sphere)" />
        <circle cx="188" cy="635" r="80" fill="url(#auth-dark-sphere)" />
      </svg>
    </div>
  )
}

export function AuthBrand() {
  return (
    <div className="auth-brand">
      <img src="/icons/icon-192.png" alt="" />
      <span>Staroot</span>
    </div>
  )
}

export function SocialRow() {
  return (
    <div className="auth-social-row" aria-label="Social sign-in options, visual preview only">
      <span className="auth-social auth-social-facebook" role="img" aria-label="Facebook">f</span>
      <span className="auth-social auth-social-twitter" role="img" aria-label="Twitter">
        <svg viewBox="0 0 24 24"><path d="M22 5.9a8 8 0 0 1-2.36.65A4.12 4.12 0 0 0 21.45 4a8.2 8.2 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74 11.65 11.65 0 0 1-8.45-4.28 4.1 4.1 0 0 0 1.27 5.48 4.1 4.1 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.29 4.02 4.1 4.1 0 0 1-1.85.07 4.1 4.1 0 0 0 3.83 2.85A8.23 8.23 0 0 1 2 18.12a11.61 11.61 0 0 0 6.29 1.84c7.55 0 11.68-6.25 11.68-11.68l-.01-.53A8.34 8.34 0 0 0 22 5.9z" /></svg>
      </span>
      <span className="auth-social auth-social-google" role="img" aria-label="Google">G</span>
      <span className="auth-social auth-social-apple" role="img" aria-label="Apple">
        <svg viewBox="0 0 24 24"><path d="M16.7 12.8c0-2 1.6-3 1.7-3.1a3.8 3.8 0 0 0-3-1.6c-1.3-.1-2.5.8-3.2.8-.6 0-1.6-.8-2.7-.7a4 4 0 0 0-3.4 2.1c-1.5 2.6-.4 6.4 1 8.5.7 1 1.5 2.1 2.6 2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.7.7 2.8.7 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.2s-2.2-.9-2.2-3.8zM14.6 6.7a3.7 3.7 0 0 0 .9-2.7 3.8 3.8 0 0 0-2.5 1.3 3.4 3.4 0 0 0-.9 2.6 3.2 3.2 0 0 0 2.5-1.2z" /></svg>
      </span>
    </div>
  )
}

export function AuthDivider({ label }: { label: string }) {
  return <div className="auth-divider"><span />{label}<span /></div>
}
