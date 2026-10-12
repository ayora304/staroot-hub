import { z } from 'zod'

const uuid = z.string().uuid()
export const listSiteSchema = z.object({ project_id: z.string().min(1).max(255).optional() }).strict()
export const projectIdSchema = z.object({ project_id: z.string().min(1).max(255) }).strict()
const photoSchema = z.object({
  id: uuid,
  captured_at_client: z.string().datetime(),
  gps_lat: z.number().min(-90).max(90).nullable(),
  gps_lng: z.number().min(-180).max(180).nullable(),
  gps_accuracy_m: z.number().min(0).max(100_000).nullable(),
}).strict()

export const createLogSchema = z.object({
  client_id: uuid,
  project_id: z.string().min(1).max(255),
  contractor_id: z.string().min(1).max(255),
  log_date: z.string().datetime(),
  work_done: z.string().trim().min(1).max(2000),
  materials_used: z.string().max(2000).optional().nullable(),
  blockers: z.string().max(2000).optional().nullable(),
  status: z.enum(['on_track', 'delayed', 'blocked']),
  progress_pct: z.number().int().min(0).max(100).optional().nullable(),
  photos: z.array(photoSchema).max(3).default([]),
}).strict()

const reportSection = z.object({
  id: uuid,
  title: z.string().trim().min(1).max(160),
  bullets: z.array(z.string().trim().min(1).max(500)).max(30),
  photo_ids: z.array(uuid).max(3),
}).strict()

export const createReportSchema = z.object({
  client_id: uuid,
  title: z.string().trim().min(1).max(160),
  report_date: z.string().datetime(),
  snapshot: z.object({
    disclaimer: z.string().trim().min(1).max(1000),
    projects: z.array(z.object({
      project_id: z.string().min(1).max(255),
      project_name: z.string().trim().min(1).max(160),
      sections: z.array(reportSection).min(1).max(30),
    }).strict()).min(1).max(30),
  }).strict(),
  photos: z.array(photoSchema).max(90).default([]),
}).strict()

export const updateLogSchema = z.object({
  client_id: uuid,
  log_id: z.string().min(1).max(255),
  base_updated_at: z.string().datetime(),
  work_done: z.string().trim().min(1).max(2000).optional(),
  materials_used: z.string().max(2000).optional().nullable(),
  blockers: z.string().max(2000).optional().nullable(),
  status: z.enum(['on_track', 'delayed', 'blocked']).optional(),
  progress_pct: z.number().int().min(0).max(100).optional().nullable(),
}).strict().refine((v) => Object.keys(v).some((k) => !['client_id', 'log_id', 'base_updated_at'].includes(k)), 'At least one field must be changed')
