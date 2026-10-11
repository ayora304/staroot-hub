// Creates the database, collections, attributes, indexes and seed rows from appwrite/.
// Idempotent: existing items (HTTP 409) are skipped. UNTESTED against a live Appwrite project;
// run against a throwaway project first. Usage: npm run setup:appwrite
import { readdirSync, readFileSync } from 'node:fs';
import { Client, Databases, ID, DatabasesIndexType } from 'node-appwrite';
const need = (n) => process.env[n] ?? (() => { throw new Error(`Missing env ${n}`); })();
const client = new Client().setEndpoint(need('APPWRITE_ENDPOINT')).setProject(need('APPWRITE_PROJECT_ID')).setKey(need('APPWRITE_API_KEY'));
const db = new Databases(client);
const DB = need('APPWRITE_DATABASE_ID');
const DOC_SECURITY = new Set(['notifications', 'users_profiles']);
async function tryCreate(label, fn) {
  try {
    await fn();
    console.log('created', label);
  }
  catch (e) {
    if (e.code === 409)
      return console.log('exists ', label);
    throw e;
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function createAttribute(col, a) {
  const array = a.type.endsWith('[]');
  const t = a.type.replace('[]', '');
  const req = a.required;
  const en = /^enum\[(.*)\]$/.exec(t);
  if (en)
    return db.createEnumAttribute(DB, col, a.key, en[1].split(','), req, undefined, array);
  switch (t) {
    case 'string': return db.createStringAttribute(DB, col, a.key, 255, req, undefined, array);
    case 'text': return db.createStringAttribute(DB, col, a.key, a.key === 'snapshot' ? 1_000_000 : 2000, req, undefined, array);
    case 'int': return db.createIntegerAttribute(DB, col, a.key, req, undefined, undefined, undefined, array);
    case 'float': return db.createFloatAttribute(DB, col, a.key, req, undefined, undefined, undefined, array);
    case 'bool': return db.createBooleanAttribute(DB, col, a.key, req, undefined, array);
    case 'datetime': return db.createDatetimeAttribute(DB, col, a.key, req, undefined, array);
    default: throw new Error(`Unknown type ${a.type} on ${col}.${a.key}`);
  }
}
async function waitForAttributes(col) {
  for (let i = 0; i < 90; i++) {
    const { attributes } = await db.listAttributes(DB, col);
    if (((attributes as unknown) as Array<{ status: string }>).every((a) => a.status === 'available'))
      return;
    await sleep(1000);
  }
  throw new Error(`Attributes for ${col} not ready in time`);
}
async function seed(collection, file, key) {
  const existing = await db.listDocuments(DB, collection);
  if (existing.total > 0)
    return console.log('seeded ', collection);
  const rows = JSON.parse(readFileSync(file, 'utf8'))[key];
  for (const row of rows)
    await db.createDocument(DB, collection, ID.unique(), row);
  console.log('seeding', collection, rows.length);
}
async function main() {
  try {
    await db.get(DB);
    console.log('exists  database', DB);
  }
  catch (e) {
    if (e.code !== 404)
      throw e;
    await tryCreate(`database ${DB}`, () => db.create(DB, DB));
  }
  for (const f of readdirSync('appwrite/collections').filter((n) => n.endsWith('.json'))) {
    const col = JSON.parse(readFileSync(`appwrite/collections/${f}`, 'utf8'));
    await tryCreate(`collection ${col.id}`, () => db.createCollection(DB, col.id, col.name, [], DOC_SECURITY.has(col.id)));
    for (const a of col.attributes)
      await tryCreate(`  ${col.id}.${a.key}`, () => createAttribute(col.id, a));
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
