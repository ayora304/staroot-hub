import { REPORT_BRAND, safeFileName } from './branding'
import type { ExportableReport, ExportReportSnapshot } from './types'
import { getReportPhoto } from './reportPhoto'

async function imageData(report: ExportableReport, fileId: string): Promise<{ data: string; width: number; height: number } | null> {
  try {
    const blob = await getReportPhoto(report, fileId)
    if (!blob) return null
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width; canvas.height = bitmap.height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
    bitmap.close()
    const data = canvas.toDataURL('image/jpeg', 0.8)
    const dimensions = { width: canvas.width, height: canvas.height }
    return { data, ...dimensions }
  } catch { return null }
}

export async function exportReportPdf(report: ExportableReport): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const snapshot = JSON.parse(report.snapshot) as ExportReportSnapshot
  const margin = 18
  const width = 210 - margin * 2
  let y = 20
  const addHeader = () => {
    pdf.setFillColor(REPORT_BRAND.accent)
    pdf.rect(margin, 14, 12, 2, 'F')
    pdf.setTextColor(REPORT_BRAND.ink)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(REPORT_BRAND.name, margin, 24)
    pdf.setTextColor(REPORT_BRAND.muted)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(REPORT_BRAND.product, 210 - margin, 24, { align: 'right' })
    pdf.setDrawColor(REPORT_BRAND.accent)
    pdf.line(margin, 29, 210 - margin, 29)
  }
  const page = () => { pdf.addPage(); y = 20; addHeader() }
  const ensure = (height: number) => { if (y + height > 276) page() }
  addHeader()
  y = 42
  pdf.setTextColor(REPORT_BRAND.ink)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  const titleLines = pdf.splitTextToSize(report.title, width)
  pdf.text(titleLines, margin, y)
  y += titleLines.length * 10 + 2
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(REPORT_BRAND.muted)
  pdf.text(`Report date: ${new Date(report.report_date).toLocaleDateString()}   ·   Prepared by: ${report.author_name}`, margin, y)
  y += 12
  pdf.setFontSize(9)
  pdf.setTextColor(REPORT_BRAND.ink)
  const disclaimerLines = pdf.splitTextToSize(snapshot.disclaimer, width)
  const disclaimerHeight = disclaimerLines.length * 5 + 8
  ensure(disclaimerHeight)
  pdf.setFillColor(247, 244, 237)
  pdf.roundedRect(margin, y - 4, width, disclaimerHeight, 2, 2, 'F')
  pdf.text(disclaimerLines, margin + 4, y + 1)
  y += disclaimerHeight + 5

  for (const project of snapshot.projects) {
    ensure(16)
    pdf.setTextColor(REPORT_BRAND.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(15)
    pdf.text(project.project_name, margin, y)
    y += 9
    for (const section of project.sections) {
      ensure(12)
      pdf.setTextColor(REPORT_BRAND.ink)
      pdf.setFontSize(12)
      pdf.text(section.title, margin, y)
      y += 6
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      for (const bullet of section.bullets) {
        const lines = pdf.splitTextToSize(`• ${bullet}`, width - 3)
        ensure(lines.length * 5 + 2)
        pdf.text(lines, margin + 2, y)
        y += lines.length * 5 + 2
      }
      for (const fileId of section.photo_ids) {
        const image = await imageData(report, fileId)
        if (!image) {
          ensure(8); pdf.setTextColor(REPORT_BRAND.muted); pdf.text('Photo unavailable in this session.', margin + 2, y); y += 7
          continue
        }
        const targetWidth = Math.min(width, 160)
        const targetHeight = targetWidth * image.height / image.width
        const scale = Math.min(1, 110 / targetHeight)
        const renderedWidth = targetWidth * scale
        const renderedHeight = targetHeight * scale
        ensure(renderedHeight + 6)
        pdf.addImage(image.data, 'JPEG', margin + 2, y, renderedWidth, renderedHeight, undefined, 'FAST')
        y += renderedHeight + 5
      }
      y += 4
    }
    y += 3
  }
  pdf.setProperties({ title: report.title, author: report.author_name, subject: REPORT_BRAND.product, creator: REPORT_BRAND.name })
  pdf.save(`${safeFileName(report.title)}.pdf`)
}
