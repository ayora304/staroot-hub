import { HorizontalScroller } from '../../../core/ui/HorizontalScroller'
import { useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, ClipboardList, Plus, Share2 } from 'lucide-react'
import { Button } from '../../../core/ui/Button'

type PermitStatus = 'active' | 'applied' | 'review' | 'queried' | 'approved' | 'rejected'
type PermitType = 'NCA' | 'NEMA' | 'County' | 'Business' | 'Work' | 'Vehicle'
interface Permit {
  id: string
  type: PermitType
  name: string
  body: string
  number: string
  issued: string
  expiry: string
  cost: number
  site: string
  status: PermitStatus
  since: string
}

const STORAGE_KEY = 'staroot-approval-permits-v1'
const today = new Date()
const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const offsetDate = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return dateString(date) }
const seed: Permit[] = [
  { id: 'p1', type: 'NCA', name: 'NCA contractor registration', body: 'National Construction Authority', number: 'NCA/C4/2024/1182', issued: '2025-11-02', expiry: offsetDate(19), cost: 45000, site: 'All sites', status: 'active', since: '' },
  { id: 'p2', type: 'NEMA', name: 'EIA licence', body: 'NEMA', number: 'NEMA/EIA/PSL/22091', issued: '2025-01-09', expiry: offsetDate(87), cost: 120000, site: 'Gemini Phase 2', status: 'active', since: '' },
  { id: 'p3', type: 'County', name: 'Building approval', body: 'Nairobi City County', number: 'NCC/BP/2025/0457', issued: '2025-11-28', expiry: offsetDate(34), cost: 310000, site: 'Gemini Phase 1', status: 'active', since: '' },
  { id: 'p4', type: 'Business', name: 'Single business permit', body: 'Nairobi City County', number: 'SBP-77102', issued: '2026-02-14', expiry: offsetDate(122), cost: 38000, site: 'All sites', status: 'active', since: '' },
  { id: 'p5', type: 'Work', name: 'Work permit, Class D', body: 'Immigration Dept.', number: 'WP/D/2025/5530', issued: '2025-10-30', expiry: offsetDate(12), cost: 75000, site: 'Venus Oak', status: 'active', since: '' },
  { id: 'p6', type: 'Vehicle', name: 'Vehicle licence KDG 214X', body: 'NTSA', number: 'KDG 214X', issued: '2025-12-20', expiry: offsetDate(67), cost: 12400, site: 'Project 4', status: 'active', since: '' },
  { id: 'p7', type: 'NEMA', name: 'Annual environmental audit', body: 'NEMA', number: 'Pending', issued: '', expiry: '', cost: 60000, site: 'Gemini Phase 2', status: 'review', since: offsetDate(-16) },
  { id: 'p8', type: 'County', name: 'Occupation certificate', body: 'Nairobi City County', number: 'Pending', issued: '', expiry: '', cost: 90000, site: 'Venus Oak', status: 'queried', since: offsetDate(-34) },
  { id: 'p9', type: 'County', name: 'Fire safety certificate', body: 'Nairobi City County', number: 'Pending', issued: '', expiry: '', cost: 25000, site: 'Gemini Phase 1', status: 'applied', since: offsetDate(-5) },
  { id: 'p10', type: 'County', name: 'Signage permit', body: 'Nairobi City County', number: 'Pending', issued: '', expiry: '', cost: 18000, site: 'Project 4', status: 'rejected', since: offsetDate(-42) },
]
const statuses: Record<PermitStatus, string> = { active: 'Active', applied: 'Applied', review: 'Under review', queried: 'Queried', approved: 'Approved', rejected: 'Rejected' }
const daysUntil = (value: string) => Math.ceil((new Date(`${value}T00:00:00`).getTime() - new Date(`${dateString(today)}T00:00:00`).getTime()) / 86400000)
const formatDate = (value: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const money = (value: number) => `KES ${value.toLocaleString('en-KE')}`
const loadPermits = (): Permit[] => {
  try { const value = localStorage.getItem(STORAGE_KEY); return value ? JSON.parse(value) as Permit[] : seed }
  catch { return seed }
}
const field = 'min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-text focus-visible:outline-2 focus-visible:outline-accent'

export function PermitManager() {
  const [permits, setPermits] = useState<Permit[]>(loadPermits)
  const [view, setView] = useState<'dashboard' | 'permits' | 'applications' | 'calendar' | 'detail' | 'form' | 'share'>('dashboard')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [newPermitStatus, setNewPermitStatus] = useState<PermitStatus>('active')
  const [filter, setFilter] = useState('All')
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [message, setMessage] = useState('')
  const active = useMemo(() => permits.filter((permit) => permit.status === 'active').sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry)), [permits])
  const selected = permits.find((permit) => permit.id === selectedId)
  const editing = permits.find((permit) => permit.id === editId)

  function save(next: Permit[]) { setPermits(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) }
  function openPermit(id: string) { setSelectedId(id); setView('detail') }
  function editPermit(permit?: Permit, initialStatus: PermitStatus = 'active') { setEditId(permit?.id ?? null); setNewPermitStatus(permit?.status ?? initialStatus); setView('form') }
  function advance(permit: Permit) {
    const next: PermitStatus = permit.status === 'applied' ? 'review' : permit.status === 'review' ? 'queried' : 'approved'
    save(permits.map((item) => item.id === permit.id ? { ...item, status: next } : item))
    if (next === 'approved') setMessage('Application approved. Record the issued permit details to activate it.')
  }
  async function shareSelection() {
    const summary = active.map((permit) => `${permit.name} — ${permit.site} — expires ${formatDate(permit.expiry)}`).join('\n')
    try { await navigator.clipboard.writeText(summary); setMessage('Permit summary copied to clipboard.') }
    catch { setMessage(summary || 'No active permits to share.') }
  }

  const Header = ({ title, back }: { title: string; back: () => void }) => <header className="flex items-center gap-3">
    <button type="button" aria-label="Back" onClick={back} className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-text"><ArrowLeft size={20} /></button>
    <h2 className="m-0 flex-1 text-xl font-semibold text-text">{title}</h2>
    <button type="button" aria-label="Menu" onClick={() => setView('dashboard')} className="grid size-11 place-items-center rounded-xl border border-border bg-surface text-text"><ClipboardList size={20} /></button>
  </header>

  function PermitRow({ permit }: { permit: Permit }) {
    const days = permit.expiry ? daysUntil(permit.expiry) : null
    const tone = days === null ? 'text-warning' : days <= 30 ? 'text-danger' : days <= 60 ? 'text-warning' : 'text-success'
    return <button type="button" onClick={() => openPermit(permit.id)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left text-text">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-xs font-bold text-muted">{permit.type}</span>
      <span className="min-w-0 flex-1"><b className="block truncate">{permit.name}</b><span className="block truncate text-xs text-muted">{permit.site} · {permit.status === 'active' ? `Expires ${formatDate(permit.expiry)}` : `Since ${formatDate(permit.since)}`}</span></span>
      <span className={`shrink-0 text-xs font-semibold ${permit.status === 'active' ? tone : 'text-warning'}`}>{permit.status === 'active' ? days! < 0 ? 'Expired' : `${days} days` : statuses[permit.status]}</span>
    </button>
  }

  function PermitForm() {
    function submit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const form = new FormData(event.currentTarget)
      const previous = editing
      const nextPermit: Permit = {
        id: previous?.id ?? crypto.randomUUID(), type: String(form.get('type')) as PermitType,
        name: String(form.get('name')).trim(), body: String(form.get('body')).trim(), number: String(form.get('number')).trim() || 'Pending',
        issued: String(form.get('issued')), expiry: String(form.get('expiry')), cost: Number(form.get('cost')) || 0,
        site: String(form.get('site')), status: String(form.get('status')) as PermitStatus, since: previous?.since ?? dateString(new Date()),
      }
      if (nextPermit.status === 'active' && !nextPermit.expiry) { setMessage('Add an expiry date for an active permit.'); return }
      save(previous ? permits.map((permit) => permit.id === previous.id ? nextPermit : permit) : [...permits, nextPermit])
      setMessage('Permit saved.')
      setView('permits')
    }
    return <form className="space-y-3" onSubmit={submit}>
      <label className="block space-y-1 text-sm text-muted">Permit name<input required name="name" defaultValue={editing?.name} className={field} /></label>
      <div className="grid grid-cols-2 gap-3"><label className="block space-y-1 text-sm text-muted">Type<select name="type" defaultValue={editing?.type ?? 'NCA'} className={field}>{['NCA','NEMA','County','Business','Work','Vehicle'].map((type) => <option key={type}>{type}</option>)}</select></label><label className="block space-y-1 text-sm text-muted">Status<select name="status" defaultValue={newPermitStatus} className={field}>{Object.entries(statuses).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
      <label className="block space-y-1 text-sm text-muted">Issuing body<input name="body" defaultValue={editing?.body} className={field} /></label>
      <label className="block space-y-1 text-sm text-muted">Permit number<input name="number" defaultValue={editing?.number === 'Pending' ? '' : editing?.number} className={field} /></label>
      <div className="grid grid-cols-2 gap-3"><label className="block space-y-1 text-sm text-muted">Issue date<input name="issued" type="date" defaultValue={editing?.issued} className={field} /></label><label className="block space-y-1 text-sm text-muted">Expiry date<input name="expiry" type="date" defaultValue={editing?.expiry} className={field} /></label></div>
      <div className="grid grid-cols-2 gap-3"><label className="block space-y-1 text-sm text-muted">Cost (KES)<input name="cost" type="number" min="0" defaultValue={editing?.cost} className={field} /></label><label className="block space-y-1 text-sm text-muted">Linked site<select name="site" defaultValue={editing?.site ?? 'Gemini Phase 1'} className={field}>{['All sites','Gemini Phase 1','Venus Oak','Gemini Phase 2','Project 4'].map((site) => <option key={site}>{site}</option>)}</select></label></div>
      <Button type="submit" className="w-full">Save permit</Button>
    </form>
  }

  if (view === 'form') return <div className="mx-auto max-w-2xl space-y-5 p-4 pt-safe pb-safe"><Header title={editing ? 'Edit permit' : 'Add permit'} back={() => setView(editing ? 'detail' : 'permits')} /><PermitForm /></div>
  if (view === 'detail' && selected) return <div className="mx-auto max-w-2xl space-y-5 p-4 pt-safe pb-safe"><Header title="Permit details" back={() => setView('permits')} />
    <section className="rounded-3xl bg-surface-2 p-5 text-text"><span className="text-sm text-muted">{selected.body}</span><h1 className="mt-1 text-2xl font-semibold">{selected.name}</h1>{selected.status === 'active' ? <p className="mt-4 text-4xl font-bold text-accent">{daysUntil(selected.expiry)}<span className="text-base font-normal text-muted"> days left</span></p> : <p className="mt-3 font-semibold text-warning">{statuses[selected.status]}</p>}</section>
    <dl className="divide-y divide-border rounded-2xl border border-border bg-surface px-4 text-sm">{[['Permit no.', selected.number],['Issuing body',selected.body],['Type',selected.type],['Linked site',selected.site],['Issued',formatDate(selected.issued)],['Expiry',formatDate(selected.expiry)],['Cost',money(selected.cost)]].map(([label,value]) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-muted">{label}</dt><dd className="text-right font-medium text-text">{value}</dd></div>)}</dl>
    <div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => editPermit(selected)}>Edit</Button><Button onClick={() => { setView('share'); setSelectedId(selected.id) }}>Share</Button></div>{selected.status === 'active' && <Button variant="secondary" className="w-full" onClick={() => { save([...permits, { ...selected, id: crypto.randomUUID(), status: 'applied', since: dateString(new Date()), expiry: '', issued: '', number: 'Pending', name: `${selected.name} (renewal)` }]); setView('applications'); setMessage('Renewal application started.') }}>Start renewal</Button>}
  </div>

  if (view === 'share') return <div className="mx-auto max-w-2xl space-y-4 p-4 pt-safe pb-safe"><Header title="Share permits" back={() => setView(selectedId ? 'detail' : 'dashboard')} /><p className="text-sm text-muted">Copy a read-only summary of active permits.</p>{active.map((permit) => <PermitRow key={permit.id} permit={permit} />)}<Button className="w-full" onClick={() => void shareSelection()}><Share2 className="mr-2 inline" size={17} />Copy permit summary</Button>{message && <p role="status" className="break-words rounded-xl bg-surface p-3 text-sm text-muted">{message}</p>}</div>

  const nav = <HorizontalScroller label="Permit options" className="flex gap-2 pb-1">{(['dashboard','permits','applications','calendar'] as const).map((key) => <button key={key} type="button" onClick={() => setView(key)} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm ${view === key ? 'border-accent bg-accent text-accent-contrast' : 'border-border bg-surface text-muted'}`}>{({dashboard:'Dashboard', permits:'All permits', applications:'Applications', calendar:'Expiry calendar'})[key]}</button>)}</HorizontalScroller>
  const soon = active.filter((permit) => daysUntil(permit.expiry) <= 90)
  const expiryCalendar = (() => { const first = new Date(month.getFullYear(), month.getMonth(), 1); const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); const offset = (first.getDay() + 6) % 7; return <><div className="mb-3 flex items-center justify-between"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid size-10 place-items-center rounded-xl border border-border"><ArrowLeft size={18}/></button><b className="text-text">{month.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</b><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid size-10 place-items-center rounded-xl border border-border"><ArrowRight size={18}/></button></div><div className="grid grid-cols-7 gap-1 text-center">{['M','T','W','T','F','S','S'].map((day,index)=><span key={`${day}-${index}`} className="py-1 text-xs text-muted">{day}</span>)}{Array.from({length:offset},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:days},(_,i)=>{const day=i+1;const due=active.some((permit)=>{const date=new Date(`${permit.expiry}T00:00:00`);return date.getFullYear()===month.getFullYear()&&date.getMonth()===month.getMonth()&&date.getDate()===day});return <span key={day} className={`grid aspect-square place-items-center rounded-xl text-sm ${due?'bg-accent font-bold text-accent-contrast':'bg-surface text-text'}`}>{day}</span>})}</div></> })()

  return <div className="mx-auto max-w-2xl space-y-5 p-4 pt-safe pb-safe">
    <header className="flex items-start justify-between gap-3"><div><a href="/" className="text-sm text-muted">← Hub</a><h1 className="text-2xl font-semibold text-text">Approvals</h1><p className="text-sm text-muted">Requests and permits</p></div>{view === 'dashboard' || view === 'permits' ? <Button onClick={() => editPermit()}><Plus className="mr-1 inline" size={17}/>Add permit</Button> : null}</header>
    {nav}
    {message && <p role="status" className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-text">{message}</p>}
    {view === 'dashboard' && <>
      {active[0] ? <section className="rounded-3xl bg-surface-2 p-5 text-text"><p className="text-sm text-muted">Next to expire</p><p className="mt-2 text-5xl font-bold">{daysUntil(active[0].expiry)} <span className="text-base font-normal">days</span></p><b>{active[0].name}</b><p className="text-sm text-muted">{active[0].site} · {formatDate(active[0].expiry)}</p><Button className="mt-3" onClick={() => openPermit(active[0].id)}>Open permit</Button></section> : <p className="text-muted">No active permits yet.</p>}
      <div className="grid grid-cols-3 gap-2">{[30,60,90].map((threshold) => <button key={threshold} type="button" onClick={() => {setFilter(String(threshold));setView('permits')}} className="rounded-2xl bg-surface-2 p-3 text-left text-sm text-text"><b className="block text-2xl">{active.filter((permit)=>daysUntil(permit.expiry)<=threshold).length}</b>within {threshold} days</button>)}</div>
      <section><h2 className="mb-3 text-lg font-semibold text-text">Applications in progress</h2><div className="space-y-2">{permits.filter((permit)=>['applied','review','queried'].includes(permit.status)).map((permit)=><PermitRow key={permit.id} permit={permit}/>)}</div><Button variant="secondary" className="mt-3 w-full" onClick={()=>setView('applications')}>See all applications</Button></section>
      <section><h2 className="mb-3 text-lg font-semibold text-text">Expiring soon</h2><div className="space-y-2">{soon.slice(0,3).map((permit)=><PermitRow key={permit.id} permit={permit}/>)}</div></section>
    </>}
    {view === 'permits' && <><HorizontalScroller label="Permit options" className="flex gap-2 pb-1">{['All','NCA','NEMA','County','Business','Work','Vehicle','30','60','90'].map((item)=><button key={item} type="button" onClick={()=>setFilter(item)} className={`min-h-10 shrink-0 rounded-full border px-3 text-sm ${filter===item?'border-accent bg-accent text-accent-contrast':'border-border text-muted'}`}>{/^\d+$/.test(item)?`≤ ${item} days`:item}</button>)}</HorizontalScroller><div className="space-y-2">{active.filter((permit)=>filter==='All'||(/^\d+$/.test(filter)?daysUntil(permit.expiry)<=Number(filter):permit.type===filter)).map((permit)=><PermitRow key={permit.id} permit={permit}/>)}</div>{active.length===0&&<p className="py-8 text-center text-muted">No active permits.</p>}</>}
    {view === 'applications' && <><p className="text-sm text-muted">Track each application from submission to decision.</p><div className="space-y-3">{permits.filter((permit)=>permit.status!=='active').map((permit)=><section key={permit.id} className="space-y-3 rounded-2xl border border-border bg-surface p-4"><PermitRow permit={permit}/><div className="flex gap-1">{['Applied','Review','Queried','Approved'].map((stage,index)=><span key={stage} className={`h-2 flex-1 rounded-full ${index<=(permit.status==='applied'?0:permit.status==='review'?1:permit.status==='queried'?2:3)?'bg-accent':'bg-surface-2'}`}/>)}</div><div className="flex justify-between text-[10px] text-muted"><span>Applied</span><span>Review</span><span>Queried</span><span>Approved</span></div>{permit.status==='approved' ? <Button variant="secondary" className="w-full" onClick={()=>editPermit(permit)}>Record permit</Button> : permit.status==='rejected' ? <Button variant="secondary" className="w-full" onClick={()=>editPermit({...permit,status:'applied'})}>Reapply</Button> : <Button variant="secondary" className="w-full" onClick={()=>advance(permit)}>Update stage</Button>}</section>)}</div>{permits.every((permit)=>permit.status==='active')&&<p className="py-8 text-center text-muted">No applications in progress.</p>}<Button className="w-full" onClick={()=>editPermit(undefined, 'applied')}>New application</Button></>}
    {view === 'calendar' && <><section className="rounded-2xl border border-border bg-surface p-4"><div className="mb-3 flex items-center gap-2 text-sm text-muted"><CalendarDays size={17}/> Expiry calendar</div>{expiryCalendar}</section><h2 className="text-lg font-semibold text-text">Expiring this month</h2><div className="space-y-2">{active.filter((permit)=>{const date=new Date(`${permit.expiry}T00:00:00`);return date.getFullYear()===month.getFullYear()&&date.getMonth()===month.getMonth()}).map((permit)=><PermitRow key={permit.id} permit={permit}/>)}</div></>}
  </div>
}
