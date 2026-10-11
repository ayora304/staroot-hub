export type IconName =
  | 'approvals' | 'crm' | 'site' | 'inventory' | 'admin'
  | 'leasing' | 'maintenance' | 'finance' | 'analytics'
  | 'bell' | 'sun' | 'moon' | 'download' | 'logout' | 'lock' | 'wifiOff'

const PATHS: Record<IconName, string[]> = {
  approvals: ['M12 3l7 3v6c0 4.500-3 7.500-7 9-4-1.500-7-4.500-7-9V6z', 'M9 12l2 2 4-4'],
  crm: ['M16 19v-1.500a3.500 3.500 0 00-3.500-3.500h-4A3.500 3.500 0 005 17.500V19', 'M10.500 11a3 3 0 100-6 3 3 0 000 6z', 'M19 19v-1.500a3.500 3.500 0 00-2.500-3.300', 'M15 5.200a3 3 0 010 5.600'],
  site: ['M4 20h16', 'M6 20V8l6-4 6 4v12', 'M10 20v-5h4v5'],
  inventory: ['M21 8l-9-5-9 5v8l9 5 9-5z', 'M3 8l9 5 9-5', 'M12 13v8'],
  admin: ['M4 7h10', 'M18 7h2', 'M4 17h2', 'M10 17h10', 'M16 5v4', 'M8 15v4'],
  leasing: ['M7 3h7l4 4v14H7z', 'M14 3v4h4', 'M10 12h5', 'M10 16h5'],
  maintenance: ['M14.500 6.500a4 4 0 005 5L20 12l-8 8a2.100 2.100 0 01-3-3l8-8z'],
  finance: ['M12 3v18', 'M16 7.500C16 6 14.200 5 12 5S8 6 8 7.500 9.800 9.700 12 10s4 1 4 2.500S14.200 15 12 15s-4-1-4-2.500'],
  analytics: ['M5 20V10', 'M12 20V4', 'M19 20v-7'],
  bell: ['M18 16v-5a6 6 0 10-12 0v5l-2 2h16z', 'M10 21h4'],
  sun: ['M12 16a4 4 0 100-8 4 4 0 000 8z', 'M12 2v2', 'M12 20v2', 'M4.900 4.900l1.400 1.400', 'M17.700 17.700l1.400 1.400', 'M2 12h2', 'M20 12h2', 'M4.900 19.100l1.400-1.400', 'M17.700 6.300l1.400-1.400'],
  moon: ['M20 14.500A8 8 0 019.500 4 8 8 0 1020 14.500z'],
  download: ['M12 4v11', 'M8 11l4 4 4-4', 'M5 20h14'],
  logout: ['M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3', 'M10 17l-5-5 5-5', 'M5 12h11'],
  lock: ['M6 11h12v9H6z', 'M8 11V8a4 4 0 118 0v3'],
  wifiOff: ['M3 3l18 18', 'M5 12.500a10 10 0 015-2.400', 'M8.500 16a5 5 0 016.500-.4', 'M12 20h.01'],
}

export function Icon({ name, className = 'size-6' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}
