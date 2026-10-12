export interface ExportReportSection { title: string; bullets: string[]; photo_ids: string[] }
export interface ExportReportProject { project_id: string; project_name: string; sections: ExportReportSection[] }
export interface ExportReportSnapshot { disclaimer: string; projects: ExportReportProject[] }
export interface ExportableReport {
  $id: string
  title: string
  report_date: string
  author_name: string
  snapshot: string
  local_status?: string
}
