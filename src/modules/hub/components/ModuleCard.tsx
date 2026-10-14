import { Link } from 'react-router-dom'
import { Icon } from '../../../core/ui/Icons'
import type { HubModule } from '../registry'
import { PendingBadge } from './PendingBadge'

export function ModuleCard({ module, pending = 0 }: { module: HubModule; pending?: number }) {
  return (
    <Link
      to={module.route}
      className="group relative isolate flex min-h-56 min-w-0 flex-col overflow-visible rounded-[26px] border border-white/10 bg-gradient-to-br from-[#10221f] via-[#0b1518] to-[#111315] px-4 pb-4 pt-8 shadow-[0_14px_32px_rgba(0,0,0,0.2)] transition hover:border-emerald-300/35 hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent before:absolute before:-right-px before:-top-px before:z-0 before:h-10 before:w-[78%] before:rounded-bl-[24px] before:border-b before:border-l before:border-white/10 before:bg-bg before:content-[''] sm:min-h-60 sm:px-5 sm:pb-5"
    >
      <span className="absolute -top-3 right-3 z-10 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-white/10 bg-[#171a1b] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-lg sm:right-5 sm:px-5">
        {module.label}
      </span>
      <span className="relative z-10 flex items-center justify-between gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-emerald-200/10 bg-emerald-300/10 text-emerald-200 transition group-hover:bg-emerald-300/15">
          <Icon name={module.icon} className="size-5" />
        </span>
        {pending > 0 && (
          <span className="flex items-center gap-2 rounded-full border border-emerald-200/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-emerald-100">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            <PendingBadge count={pending} />
            waiting
          </span>
        )}
      </span>
      <span className="relative z-10 mt-5 block min-w-0 flex-1">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/50">Staroot Hub</span>
        <span className="block text-sm leading-relaxed text-slate-300 sm:text-[0.95rem]">{module.blurb}</span>
      </span>
      <span className="relative z-10 mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#58e8c0] to-[#9afa66] px-4 text-sm font-bold text-[#061411] shadow-[0_0_22px_rgba(111,241,163,0.2)] transition group-hover:brightness-105">
        Open
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
          <path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  )
}
