// Creates the database, collections, attributes, indexes and seed rows from appwrite/.
// Idempotent: existing items are skipped. Usage: npm run setup:appwrite
import { readdirSync, readFileSync } from 'node:fs';
import { Client, Databases, ID, DatabasesIndexType } from 'node-appwrite';

interface AttrDef { key: string; type: string; required: boolean }
interface IndexDef { key: string; type: string; attributes: string[] }
interface CollectionDef { id: string; name: string; attributes: AttrDef[]; indexes: IndexDef[] }

const need = (n: string): string => {
  const v = process.env[n];
  if (!v) throw new Error(`Missing env ${n}`);
  return v;
};

const client = new Client()
  .setEndpoint(need('APPWRITE_ENDPOINT'))
  .setProject(need('APPWRITE_PROJECT_ID'))
  .setKey(need('APPWRITE_API_KEY'));
const db = new Databases(client);
const DB = need('APPWRITE_DATABASE_ID');
const DOC_SECURITY = new Set(['notifications', 'users_profiles']);

const codeOf = (e: unknown): number | undefined => (e as { code?: number } | null)?.code;

async function tryCreate(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    console.log('created', label);
  } catch (e) {
    if (codeOf(e) === 409) return console.log('exists ', label);
    throw e;
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function createAttribute(col: string, a: AttrDef): Promise<unknown> {
  const array = a.type.endsWith('[]');
  const t = a.type.replace('[]', '');
  const req = a.required;
  const en = /^enum\[(.*)\]$/.exec(t);
  if (en) return db.createEnumAttribute(DB, col, a.key, en[1].split(','), req, undefined, array);
  switch (t) {
    case 'string': return db.createStringAttribute(DB, col, a.key, 255, req, undefined, array);
    // 2000 chars keeps several text fields within the collection row-size limit.
    case 'text': return db.createStringAttribute(DB, col, a.key, a.key === 'snapshot' ? 1_000_000 : 2000, req, undefined, array);
    case 'int': return db.createIntegerAttribute(DB, col, a.key, req, undefined, undefined, undefined, array);
    case 'float': return db.createFloatAttribute(DB, col, a.key, req, undefined, undefined, undefined, array);
    case 'bool': return db.createBooleanAttribute(DB, col, a.key, req, undefined, array);
    case 'datetime': return db.createDatetimeAttribute(DB, col, a.key, req, undefined, array);
    default: throw new Error(`Unknown type ${a.type} on ${col}.${a.key}`);
  }
}

async function waitForAttributes(col: string): Promise<void> {
  for (let i = 0; i < 90; i++) {
    const { attributes } = await db.listAttributes(DB, col);
    if ((attributes as unknown as Array<{ status: string }>).every((a) => a.status === 'available')) return;
    await sleep(1000);
  }
  throw new Error(`Attributes for ${col} not ready in time`);
}

async function seed(collection: string, file: string, key: string): Promise<void> {
  const existing = await db.listDocuments(DB, collection);
  if (existing.total > 0) return console.log('seeded ', collection);
  const rows = JSON.parse(readFileSync(file, 'utf8'))[key] as Array<Record<string, unknown>>;
  for (const row of rows) await db.createDocument(DB, collection, ID.unique(), row);
  console.log('seeding', collection, rows.length);
}

async function main(): Promise<void> {
  // Check first: on plans with a database limit, create() fails with 403 instead of 409.
  try {
    await db.get(DB);
    console.log('exists  database', DB);
  } catch (e) {
    if (codeOf(e) !== 404) throw e;
    await tryCreate(`database ${DB}`, () => db.create(DB, DB));
  }

  for (const f of readdirSync('appwrite/collections').filter((n) => n.endsWith('.json'))) {
    const col = JSON.parse(readFileSync(`appwrite/collections/${f}`, 'utf8')) as CollectionDef;
    await tryCreate(`collection ${col.id}`, () => db.createCollection(DB, col.id, col.name, [], DOC_SECURITY.has(col.id)));
    for (const a of col.attributes) await tryCreate(`  ${col.id}.${a.key}`, () => createAttribute(col.id, a));
    await waitForAttributes(col.id);
    for (const ix of col.indexes) {
      const type = ix.type === 'unique' ? DatabasesIndexType.Unique : DatabasesIndexType.Key;
      await tryCreate(`  index ${col.id}.${ix.key}`, () => db.createIndex(DB, col.id, ix.key, type, ix.attributes));
    }
  }

  await seed('role_permissions', 'appwrite/seed/role_map.json', 'permissions');
  await seed('approval_rules', 'appwrite/seed/approval_rules.json', 'rules');
  await seed('projects', 'appwrite/seed/projects.json', 'projects');
  console.log('Done. Create your first user in Appwrite Auth (verified), then add its users_profiles row.');
}

main().catch((e) => { console.error(e); process.exit(1); });
