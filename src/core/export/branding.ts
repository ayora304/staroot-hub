export const REPORT_BRAND = {
  name: 'STAROOT REAL ESTATE',
  product: 'Staroot Hub · Site Progress',
  accent: '#052659',
  ink: '#011025',
  muted: '#5482B4',
}

export function safeFileName(title: string) {
  return title.normalize('NFKD').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'site-report'
}
