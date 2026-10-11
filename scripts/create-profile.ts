import { Client, Databases, ID } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

async function main() {
  const db = new Databases(client)
  const doc = await db.createDocument(process.env.APPWRITE_DATABASE_ID!, 'users_profiles', ID.unique(), {
    user_id: '6acb87ec000e4b947179',
    email: 'elvis@staroot.com',
    display_name: 'elvis',
    role: 'executive',
    department: 'operations',
    is_admin: true,
    active: true,
  })
  console.log('created', doc.$id)
}

main().catch((e) => { console.error(e.message); process.exit(1) })