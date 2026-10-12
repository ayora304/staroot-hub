import { Document, Footer, ImageRun, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { REPORT_BRAND, safeFileName } from './branding'
import type { ExportableReport, ExportReportSnapshot } from './types'
import { getReportPhoto } from './reportPhoto'

export async function exportReportDocx(report: ExportableReport): Promise<void> {
  const snapshot = JSON.parse(report.snapshot) as ExportReportSnapshot
  const children: Paragraph[] = [
    new Paragraph({ children: [new TextRun({ text: REPORT_BRAND.name, bold: true, color: REPORT_BRAND.accent.slice(1), size: 22 })] }),
    new Paragraph({ text: REPORT_BRAND.product, style: HeadingLevel.HEADING_3 }),
    new Paragraph({ text: report.title, heading: HeadingLevel.TITLE, spacing: { before: 240, after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: `Report date: ${new Date(report.report_date).toLocaleDateString()}   |   Prepared by: ${report.author_name}`, color: REPORT_BRAND.ink.slice(1) })], spacing: { after: 240 } }),
    new Paragraph({ children: [new TextRun({ text: snapshot.disclaimer, italics: true, color: REPORT_BRAND.ink.slice(1) })], spacing: { after: 360 } }),
  ]
  for (const project of snapshot.projects) {
    children.push(new Paragraph({ text: project.project_name, heading: HeadingLevel.HEADING_1, thematicBreak: true, spacing: { before: 280, after: 140 } }))
    for (const section of project.sections) {
      children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2, spacing: { before: 180, after: 80 } }))
      for (const bullet of section.bullets) children.push(new Paragraph({ text: bullet, bullet: { level: 0 }, spacing: { after: 80 } }))
      for (const fileId of section.photo_ids) {
        const blob = await getReportPhoto(report, fileId)
        if (!blob) {
          children.push(new Paragraph({ children: [new TextRun({ text: 'Photo unavailable in this session.', italics: true, color: REPORT_BRAND.ink.slice(1) })] }))
          continue
        }
        const data = new Uint8Array(await blob.arrayBuffer())
        const bitmap = await createImageBitmap(blob)
        const ratio = Math.min(1, 560 / bitmap.width, 360 / bitmap.height)
        const width = Math.max(1, Math.round(bitmap.width * ratio))
        const height = Math.max(1, Math.round(bitmap.height * ratio))
        bitmap.close()
        children.push(new Paragraph({ children: [new ImageRun({ data, type: 'jpg', transformation: { width, height } })], alignment: AlignmentType.CENTER, spacing: { before: 80, after: 180 } }))
      }
    }
  }
  const doc = new Document({
    creator: REPORT_BRAND.name,
    title: report.title,
    description: REPORT_BRAND.product,
    sections: [{
      properties: { page: { margin: { top: 960, right: 960, bottom: 960, left: 960 } } },
      footers: { default: new Footer({ children: [new Paragraph({ text: REPORT_BRAND.product, alignment: AlignmentType.RIGHT })] }) },
      children,
    }],
  })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = `${safeFileName(report.title)}.docx`; link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
