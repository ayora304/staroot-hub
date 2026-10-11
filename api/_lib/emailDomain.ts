/** Exact-match domain allow-list. Subdomains and look-alike domains are rejected. */
export function isAllowedEmail(email: string, domains: string[]): boolean {
  const e = email.trim().toLowerCase()
  const at = e.lastIndexOf('@')
  if (at < 1 || e.indexOf('@') !== at) return false
  const domain = e.slice(at + 1)
  const allowed = domains.map((d) => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean)
  return allowed.includes(domain)
}

export function allowedDomainsFromEnv(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAIN ?? '').split(',').map((d) => d.trim()).filter(Boolean)
}
