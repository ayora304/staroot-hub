import { Account, Client, Databases, Query } from 'node-appwrite'
import type { PermissionRow, Profile } from '../../src/core/rbac/roles'
import { HttpError } from './http'
import { permissionRowSchema, profileSchema } from './validate'

function need(name: string): string {
  const v = process.env[name]
  if (!v) throw new HttpError(500, 'Server is not configured', 'misconfigured')
  return v
}

const base = () => new Client().setEndpoint(need('APPWRITE_ENDPOINT')).setProject(need('APPWRITE_PROJECT_ID'))
export const adminClient = () => base().setKey(need('APPWRITE_API_KEY'))
export const sessionClient = (secret: string) => base().setSession(secret)
export const DB_ID = () => process.env.APPWRITE_DATABASE_ID ?? 'staroot_hub'

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const res = await new Databases(adminClient()).listDocuments(DB_ID(), 'users_profiles', [
    Query.equal('user_id', [userId]),
    Query.limit(1),
  ])
  const doc = res.documents[0]
  return doc ? profileSchema.parse(doc) : null
}

let cache: { rows: PermissionRow[]; at: number } | null = null

/** Role map from the database, cached for 60s so admin edits apply quickly. */
export async function listPermissions(): Promise<PermissionRow[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.rows
  const res = await new Databases(adminClient()).listDocuments(DB_ID(), 'role_permissions', [Query.limit(200)])
  const rows = res.documents.map((d) => permissionRowSchema.parse(d))
  cache = { rows, at: Date.now() }
  return rows
}

export { Account }
