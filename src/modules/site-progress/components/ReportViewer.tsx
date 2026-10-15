import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '../../../core/ui/Button'
import { PhotoEvidence } from '../../../core/evidence/PhotoEvidence'
import { Card } from '../../../core/ui/Card'
import { StatusPill } from '../../../core/ui/StatusPill'
import type { ReportSnapshot, SiteReport } from '../types'

export function ReportViewer({ report, onBack }: { report: SiteReport; onBack: () => void }) {
  const [working, setWorking] = useState<'pdf' | 'docx' | null>(null)
  const [error, setError] = useState<string | null>(null)
  let snapshot: ReportSnapshot
  try { snapshot = JSON.parse(report.snapshot) as ReportSnapshot }
  catch { return <Card role="alert" className="space-y-3"><p className="text-danger">This report snapshot could not be opened.</p><Button type="button" onClick={onBack}>Back to archive</Button></Card> }

  async function exportFile(kind: 'pdf' | 'docx') {
    setWorking(kind); setError(null)
    try {
      if (kind === 'pdf') await (await import('../../../core/export/pdf')).exportReportPdf(report)
      else await (await import('../../../core/export/docx')).exportReportDocx(report)
    }
    catch (e) { setError(e instanceof Error ? e.message : `Could not create ${kind.toUpperCase()} export.`) }
    finally { setWorking(null) }
  }

  return <article className="space-y-4">
    <div className="flex items-center gap-2">{report.status === 'final' && <CheckCircle2 size={22} className="text-success" aria-label="Manager approved" />}<StatusPill tone={report.status === 'pending' ? 'warning' : 'success'}>{report.status === 'pending' ? 'Pending manager approval' : report.status === 'final' ? 'Final · approved' : report.status === 'superseded' ? 'Superseded' : 'Published · legacy'}</StatusPill></div>
    <div className="flex flex-wrap items-center justify-between gap-2"><Button type="button" variant="secondary" onClick={onBack}>Back to archive</Button><div className="flex gap-2"><Button type="button" variant="secondary" loading={working === 'pdf'} onClick={() => void exportFile('pdf')}>Export PDF</Button><Button type="button" variant="secondary" loading={working === 'docx'} onClick={() => void exportFile('docx')}>Export Word</Button></div></div>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <Card className="space-y-2 border-accent/40"><p className="text-xs font-semibold uppercase tracking-wide text-accent">Staroot Real Estate · Site Progress</p><h1 className="text-2xl font-semibold text-text">{report.title}</h1><p className="text-sm text-muted">{new Date(report.report_date).toLocaleDateString()} · Prepared by {report.author_name}</p><p className="border-l-2 border-accent pl-3 text-sm text-muted">{snapshot.disclaimer}</p>{report.local_status && <StatusPill tone="warning">Local copy · waiting to sync</StatusPill>}</Card>
    {snapshot.projects.map((project) => <section key={project.project_id} className="space-y-3"><h2 className="text-xl font-semibold text-accent">{project.project_name}</h2>{project.sections.map((section) => <Card key={section.id} className="space-y-3"><h3 className="text-lg font-medium text-text">{section.title}</h3>{section.bullets.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm text-text">{section.bullets.map((bullet, i) => <li key={`${i}-${bullet}`}>{bullet}</li>)}</ul>}<PhotoEvidence photos={(report.photos ?? []).filter((photo) => section.photo_ids.includes(photo.file_id))} ownerId={report.$id} owner="reports" /></Card>)}</section>)}
  </article>
}
