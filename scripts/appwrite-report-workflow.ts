// Extend existing reports collections without rewriting legacy report records.
import { Client, Databases } from 'node-appwrite'

const required = (key: string) => { const value = process.env[key]; if (!value) throw new Error(`Missing ${key}`); return value }
const databases = new Databases(new Client().setEndpoint(required('APPWRITE_ENDPOINT')).setProject(required('APPWRITE_PROJECT_ID')).setKey(required('APPWRITE_API_KEY')))
const databaseId = required('APPWRITE_DATABASE_ID')
// The API requires a null default for required enums; the SDK types it as string.
await databases.updateEnumAttribute({ databaseId, collectionId: 'reports', key: 'status', elements: ['pending', 'final', 'published', 'superseded'], required: true, xdefault: null as unknown as string })
for (const [key, create] of [
  ['approved_by', () => databases.createStringAttribute(databaseId, 'reports', 'approved_by', 255, false)],
  ['approved_at', () => databases.createDatetimeAttribute(databaseId, 'reports', 'approved_at', false)],
] as const) {
  try { await create() } catch (error) { if ((error as { code?: number }).code !== 409) throw error }
  console.log(`Ready: reports.${key}`)
}
for (let attempt = 0; attempt < 60; attempt++) {
  const { attributes } = await databases.listAttributes(databaseId, 'reports')
  if (attributes.every((attribute) => attribute.status === 'available')) { console.log('Report workflow schema ready.'); process.exit(0) }
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
throw new Error('Report attributes are still provisioning; check Appwrite before submitting a report.')
