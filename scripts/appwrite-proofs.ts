import { Client, Storage, Compression } from 'node-appwrite'

const need = (name: string) => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env ${name}`)
  return value
}
const endpoint = need('APPWRITE_ENDPOINT')
const project = need('APPWRITE_PROJECT_ID')
const key = need('APPWRITE_API_KEY')
const bucketId = process.env.APPWRITE_BUCKET_PROOFS || 'attachments'
const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key)
const storage = new Storage(client)

async function main() {
  try {
    const bucket = await storage.getBucket(bucketId)
    if (bucket.$permissions.length > 0) throw new Error(`Bucket ${bucketId} grants direct user/public access. Remove those permissions before use.`)
    if (!bucket.fileSecurity || !bucket.encryption || !bucket.antivirus || bucket.maximumFileSize < 3 * 1024 * 1024 || bucket.maximumFileSize > 10 * 1024 * 1024 || !['jpg', 'jpeg'].every((ext) => bucket.allowedFileExtensions.includes(ext))) {
      throw new Error(`Existing bucket ${bucketId} does not match required private photo settings; review it in Appwrite before proceeding.`)
    }
    console.log(`Verified private photo bucket: ${bucketId}`)
    return
  } catch (error) {
    if ((error as { code?: number }).code !== 404) throw error
  }
  await storage.createBucket({
    bucketId,
    name: 'Staroot Site Photo Evidence',
    permissions: [],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 3 * 1024 * 1024,
    allowedFileExtensions: ['jpg', 'jpeg'],
    compression: Compression.None,
    encryption: true,
    antivirus: true,
    transformations: false,
  })
  console.log(`Created private photo bucket: ${bucketId}`)
}

main().catch((error: unknown) => { console.error(error); process.exit(1) })
