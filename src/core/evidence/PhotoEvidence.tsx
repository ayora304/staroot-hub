import { useEffect, useState } from 'react'
import { outboxStore } from '../offline'
import { StatusPill } from '../ui/StatusPill'
import type { PhotoRecord } from './types'

export function PhotoEvidence({ photos, ownerId, owner, layout = 'grid' }: { photos: PhotoRecord[]; ownerId: string; owner: 'site_logs' | 'reports' | 'movements'; layout?: 'grid' | 'strip' }) {
  if (!photos.length) return null
  return <ul className={layout === 'strip' ? 'flex gap-2 overflow-x-auto' : 'grid gap-3 sm:grid-cols-2'}>{photos.map((photo) => <EvidenceTile key={photo.file_id} photo={photo} ownerId={ownerId} owner={owner} layout={layout} />)}</ul>
}

function EvidenceTile({ photo, ownerId, owner, layout }: { photo: PhotoRecord; ownerId: string; owner: 'site_logs' | 'reports' | 'movements'; layout: 'grid' | 'strip' }) {
  const [url, setUrl] = useState('')
  const local = photo.owner_id !== ownerId
  useEffect(() => {
    let objectUrl = ''
    let alive = true
    if (local) {
      void outboxStore.getBlob(photo.file_id).then((blob) => {
        if (blob && alive) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) }
      })
    } else setUrl(owner === 'movements'
      ? `/api/inventory/photo?file_id=${encodeURIComponent(photo.file_id)}&owner_id=${encodeURIComponent(ownerId)}`
      : `/api/site/photo?file_id=${encodeURIComponent(photo.file_id)}&owner_id=${encodeURIComponent(ownerId)}&owner_collection=${owner}`)
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [local, owner, ownerId, photo.file_id])
  const tone = local || photo.verification !== 'verified' ? 'warning' : 'success'
  const label = local ? 'Verification pending' : photo.verification === 'verified' ? 'Verified' : `Unverified${photo.reasons.length ? ` · ${photo.reasons.join(', ')}` : ''}`
  return <li className={layout === 'strip' ? 'w-24 shrink-0 space-y-1' : 'space-y-1'}>{url ? <img src={url} alt="Site photo evidence" loading="lazy" className={layout === 'strip' ? 'size-24 rounded-2xl border border-border object-cover' : 'max-h-80 w-full rounded-xl border border-border object-contain'} /> : <div className={`grid place-items-center rounded-xl bg-surface-2 text-xs text-muted ${layout === 'strip' ? 'size-24' : 'aspect-video text-sm'}`}>Photo is stored in the sync queue</div>}<StatusPill tone={tone}>{label}</StatusPill></li>
}
