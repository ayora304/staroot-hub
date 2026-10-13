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
