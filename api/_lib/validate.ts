import { z } from 'zod'
import { DEPARTMENTS, MODULE_IDS, ROLES } from '../../src/core/rbac/roles'

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
}).strict()

export const profileSchema = z.object({
  user_id: z.string(),
  email: z.string(),
  display_name: z.string(),
  role: z.enum(ROLES),
  department: z.enum(DEPARTMENTS),
  is_admin: z.boolean(),
  active: z.boolean(),
})

export const permissionRowSchema = z.object({
  role: z.enum(ROLES),
  module: z.enum(MODULE_IDS),
  can_read: z.boolean(),
  can_write: z.boolean(),
  can_approve: z.boolean(),
  scope: z.enum(['own', 'department', 'all']),
})
