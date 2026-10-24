import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { HubModule } from '../registry'
import { PendingBadge } from './PendingBadge'

export function ModuleCard({ module, pending = 0 }: { module: HubModule; pending?: number }) {
  const shortLabel = module.label.split(' · ')[0]
  return (
    <Link to={module.route} className="hub-module-card" aria-label={`${module.label}: ${module.blurb}`}>
      <img className="hub-module-card__image" src="/assets/facade-building.jpg" alt="" />
      <span aria-hidden="true" className="hub-module-card__scrim" />
      <span className="hub-module-card__eyebrow">Staroot Hub</span>
      {pending > 0 && (
        <span className="hub-module-card__pending">
          <PendingBadge count={pending} /> waiting
        </span>
      )}
      <span className="hub-module-card__copy">
        <span className="hub-module-card__title">{shortLabel}</span>
        <span className="hub-module-card__description">{module.blurb}</span>
      </span>
      <span className="hub-module-card__action">
        <span>Open {shortLabel}</span>
        <ChevronRight aria-hidden="true" />
      </span>
    </Link>
  )
}
