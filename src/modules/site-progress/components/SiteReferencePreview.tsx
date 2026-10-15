import { HorizontalScroller } from '../../../core/ui/HorizontalScroller'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Image, Plus } from 'lucide-react'
import { previewProjects, type ProgressItem } from '../demo-data'

const average = (items: ProgressItem[], key: 'progress' | 'previous' = 'progress') => items.length ? Math.round(items.reduce((sum, item) => sum + item[key], 0) / items.length) : 0
function ordinal(value: number) {
  const ending = value % 100 >= 11 && value % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[value % 10] ?? 'th'
  return `${value}${ending}`
}

export function SiteReferencePreview() {
  const [projects, setProjects] = useState(() => structuredClone(previewProjects))
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = params.get('project') ?? projects[0].id
  const sectionId = params.get('section')
  const editing = params.get('item')
  const [saved, setSaved] = useState(false)
  const project = projects.find((entry) => entry.id === projectId) ?? projects[0]
  function setSectionId(section: string) {
    setParams((current) => { current.set('section', section); current.delete('item'); return current })
  }
  function setEditing(item: string) {
    setParams((current) => { current.set('item', item); return current })
  }
  function goBack() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
    else setParams((current) => { if (current.has('item')) current.delete('item'); else current.delete('section'); return current }, { replace: true })
  }
  const items = project.sections.flatMap((section) => section.items)
  const section = project.sections.find((entry) => entry.id === sectionId)
  const selectedItem = items.find((item) => item.id === editing)
  const floorItems = items.filter((item) => item.floor != null)
  const progress = average(items)
  const delta = progress - average(items, 'previous')
  const complete = items.filter((item) => item.progress === 100).length
  const circumference = 2 * Math.PI * 50

  function patchItem(id: string, changes: Partial<ProgressItem>) {
    setProjects((current) => current.map((entry) => entry.id !== projectId ? entry : {
      ...entry, sections: entry.sections.map((group) => ({ ...group, items: group.items.map((item) => item.id === id ? { ...item, ...changes } : item) })),
    }))
    setSaved(false)
  }

  function addSection() {
    const title = window.prompt('Section name')?.trim()
    if (!title) return
    setProjects((current) => current.map((entry) => entry.id === projectId ? { ...entry, sections: [...entry.sections, { id: `preview-${crypto.randomUUID()}`, title, items: [] }] } : entry))
  }

  return <div className="sp-reference space-y-6">
    <HorizontalScroller role="tablist" label="Project sites" className="sp-project-tabs">{projects.map((entry) => <button key={entry.id} type="button" role="tab" aria-selected={entry.id === project.id} onClick={() => { setParams({ project: entry.id }); setSaved(false) }}>{entry.name}</button>)}</HorizontalScroller>
    {selectedItem ? <section className="space-y-4">
      <button type="button" className="sp-text-action" onClick={goBack}><ArrowLeft size={18} />Back to progress</button>
      <div><h2>Update progress</h2><p className="sp-description">Demo edits stay in this preview and reset when the page reloads.</p></div>
      <form className="sp-reference-card space-y-4" onSubmit={(event) => { event.preventDefault(); setSaved(true) }}>
        <label className="sp-field">Item<select value={selectedItem.id} onChange={(event) => { setEditing(event.target.value); setSaved(false) }}>{project.sections.map((group) => <optgroup key={group.id} label={group.title}>{group.items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup>)}</select></label>
        {selectedItem.floor != null ? <label className="sp-field">Current floor: {selectedItem.floor}<input aria-label="Current floor" type="range" min="0" max={project.floors} value={selectedItem.floor} onChange={(event) => { const floor = Number(event.target.value); patchItem(selectedItem.id, { floor, progress: Math.round(floor / project.floors * 100) }) }} /></label> : <label className="sp-field">Progress: {selectedItem.progress}%<input aria-label="Item progress" type="range" min="0" max="100" value={selectedItem.progress} onChange={(event) => patchItem(selectedItem.id, { progress: Number(event.target.value) })} /></label>}
        <p className="sp-description">Last month: {selectedItem.previous}%</p>
        <label className="sp-field">Note<textarea rows={4} value={selectedItem.note} onChange={(event) => patchItem(selectedItem.id, { note: event.target.value })} /></label>
        <button className="sp-primary-action" type="submit">Save demo progress</button>
        {saved && <p role="status" className="sp-description">Updated in this preview. No live records were changed.</p>}
      </form>
    </section> : section ? <section className="space-y-4">
      <button type="button" className="sp-text-action" onClick={goBack}><ArrowLeft size={18} />Back to dashboard</button>
      <h2>{section.title}</h2>
      {section.items.map((item) => <button type="button" key={item.id} className="sp-reference-card sp-item-detail" onClick={() => setEditing(item.id)}>
        <span className="flex items-start justify-between gap-3"><b>{item.title}</b><b>{item.progress}%</b></span>
        <span className="sp-progress-track"><span style={{ width: `${item.progress}%` }} /><i style={{ left: `${item.previous}%` }} /></span>
        <span className="sp-description">{item.note}</span>
        <span className="sp-item-delta">{item.progress - item.previous > 0 ? `+${item.progress - item.previous} pts` : 'No change'} since last month{item.floor != null ? ` · ${ordinal(item.floor)} floor` : ''}</span>
      </button>)}
      <button type="button" className="sp-text-action" onClick={() => {
        const title = window.prompt('Item name')?.trim()
        if (!title) return
        setProjects((current) => current.map((entry) => entry.id === projectId ? { ...entry, sections: entry.sections.map((group) => group.id === section.id ? { ...group, items: [...group.items, { id: crypto.randomUUID(), title, progress: 0, previous: 0, note: '' }] } : group) } : entry))
      }}><Plus size={18} />Add demo item</button>
      <p className="sp-description">The tick on each bar marks last month. Select an item to update it.</p>
    </section> : <>
      <section className="site-progress-app__hero sp-summary">
        <svg className="sp-ring" viewBox="0 0 120 120" role="img" aria-label={`${progress}% complete`}>
          <circle cx="60" cy="60" r="50" stroke="var(--sp-line)" strokeWidth="12" fill="none" />
          <circle cx="60" cy="60" r="50" stroke="var(--sp-accent)" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={`${circumference * progress / 100} ${circumference}`} transform="rotate(-90 60 60)" />
          <text x="60" y="69" textAnchor="middle" fill="currentColor" fontSize="26" fontWeight="700">{progress}%</text>
        </svg>
        <div className="min-w-0"><p className="sp-description">{project.stage}</p><h2>{project.name}</h2><p className="sp-item-delta">{delta >= 0 ? '+' : ''}{delta} pts since July</p><p className="sp-description">Updated 31 Aug 2026 · demo</p></div>
      </section>
      <div className="sp-summary-stats">{[[complete, 'items complete'], [items.length - complete, 'in progress'], [project.sections.length, 'sections']].map(([value, label]) => <div className="site-progress-app__stat" key={label}><b>{value}</b><span>{label}</span></div>)}</div>
      <section className="space-y-3"><h2>Floor progress</h2><div className="sp-reference-card">
        {floorItems.length ? <>
          <div className="sp-floor-chart" style={{ gridTemplateColumns: `24px repeat(${floorItems.length}, minmax(0, 1fr))` }}>
            <div className="sp-floor-axis">{[0, 5, 10, 15, 20, 25].filter((floor) => floor <= project.floors).map((floor) => <span key={floor} style={{ bottom: `${floor / project.floors * 100}%` }}>{floor === 0 ? 'G' : floor}</span>)}</div>
            {floorItems.map((item, index) => <div key={item.id} className="sp-floor-lane" role="img" aria-label={`${item.title}: ${ordinal(item.floor!)} floor, last month ${item.previousFloor}`}>
              <span className="sp-floor-fill" style={{ height: `${item.floor! / project.floors * 100}%`, opacity: [1, .65, .4][index % 3] }} />
              <span className="sp-floor-marker" style={{ bottom: `${(item.previousFloor ?? 0) / project.floors * 100}%` }} />
            </div>)}
          </div>
          <div className="sp-floor-labels" style={{ gridTemplateColumns: `24px repeat(${floorItems.length}, minmax(0, 1fr))` }}><span />{floorItems.map((item) => <div key={item.id}><b>{item.title.replace(' works', '').replace('Internal plastering', 'Plastering')}</b><span>{ordinal(item.floor!)} floor</span></div>)}</div>
          <p className="sp-description mt-3">Floors use the construction count (1st floor = first level above road). Line marks last month.</p>
        </> : <p className="sp-description">No floor-based work is tracked for this project yet.</p>}
      </div></section>
      <section className="space-y-3"><div className="flex items-center justify-between"><h2>Sections</h2><button type="button" className="sp-text-action" onClick={addSection}><Plus size={16} />Add</button></div>
        {project.sections.length ? project.sections.map((group) => <button className="sp-section-row" type="button" key={group.id} onClick={() => setSectionId(group.id)}>
          <span className="min-w-0 flex-1"><b>{group.title}</b><span className="sp-progress-track"><span style={{ width: `${average(group.items)}%` }} /></span><span className="sp-description">{group.items.length} items</span></span><strong>{average(group.items)}%</strong><ChevronRight size={16} aria-hidden="true" />
        </button>) : <div className="sp-reference-card"><h3>No sections yet</h3><p className="sp-description mt-2">Add the first section to begin tracking progress for {project.name}.</p></div>}
      </section>
      <section className="space-y-3"><h2>Look ahead</h2><div className="sp-reference-card">{project.lookAhead || 'No upcoming work planned yet.'}</div></section>
      <section className="space-y-3"><h2>Photo timeline</h2><HorizontalScroller label="Photo timeline" className="sp-photo-timeline">{['Jun', 'Jul', 'Aug', 'Sep'].map((month, index) => <div key={month} className={`sp-photo-placeholder sp-photo-placeholder--${index}`}><Image size={26} aria-hidden="true" /><span>Demo placeholder</span><b>{month} 2026</b></div>)}</HorizontalScroller><p className="sp-description">Illustrative placeholders — no site photos uploaded.</p></section>
      <button type="button" className="sp-primary-action" disabled={!items.length} onClick={() => { if (items[0]) setEditing(items[0].id); setSaved(false) }}>Update progress</button>
    </>}
  </div>
}
