import { useState } from 'react'
import { Button } from '../../../core/ui/Button'
import type { Movement } from '../types'

export function DispatchSummary({ movement }: { movement?: Movement }) {
  const [message, setMessage] = useState('')
  if (!movement) return null
  const text = `Staroot Hub dispatch\nItem: ${movement.item_name ?? movement.item_id}\nQuantity: ${movement.quantity}\nFrom: ${movement.from_location || '—'}\nTo: ${movement.to_location || '—'}\nCustodian: ${movement.custodian_id || '—'}\nRecorded: ${new Date(movement.occurred_at_client ?? movement.$createdAt).toLocaleString()}`
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'Inventory dispatch', text })
      else { await navigator.clipboard.writeText(text); setMessage('Dispatch summary copied. Paste it into WhatsApp or another message.') }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setMessage('Could not share this dispatch summary.') }
  }
  return <div className="space-y-2 rounded-xl border border-border bg-surface-2 p-3"><p className="text-sm font-medium text-text">Latest dispatch summary</p><pre className="whitespace-pre-wrap text-xs text-muted">{text}</pre><Button type="button" variant="secondary" onClick={() => void share()}>Share summary</Button>{message && <p role="status" className="text-xs text-muted">{message}</p>}</div>
}
