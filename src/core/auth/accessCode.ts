import Dexie, { type Table } from 'dexie'

const AUTH_WINDOW_MS = 48 * 60 * 60 * 1000
const PBKDF2_ITERATIONS = 210_000

type Credential = {
  userId: string
  salt: string
  verifier: string
  failures: number
  lockedUntil: number
}

type DeviceRecord = { key: string; value: unknown }
type AuthTimestamp = { userId: string; at: number }
type GateMode = 'setup' | 'locked' | 'unlocked' | 'expired'

class DeviceAuthDB extends Dexie {
  records!: Table<DeviceRecord, string>
  constructor() {
    super('staroot-device-auth')
    this.version(1).stores({ records: 'key' })
  }
}

const deviceAuthDB = new DeviceAuthDB()

function cryptoApi(): Crypto {
  if (!globalThis.crypto?.subtle) throw new Error('Secure code access requires a secure browser connection.')
  return globalThis.crypto
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function fromHex(value: string): Uint8Array {
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16))
}

async function deriveVerifier(code: string, salt: Uint8Array): Promise<string> {
  const crypto = cryptoApi()
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS }, key, 256)
  return toHex(new Uint8Array(bits))
}

function equalHex(a: string, b: string): boolean {
  const left = fromHex(a)
  const right = fromHex(b)
  if (left.length !== right.length || left.length === 0) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

async function getCredential(userId: string): Promise<Credential | null> {
  const value = (await deviceAuthDB.records.get('access-code'))?.value as Credential | undefined
  if (!value) return null
  if (value.userId !== userId) {
    await deviceAuthDB.records.delete('access-code')
    return null
  }
  return value
}

export async function accessModeForExistingSession(userId: string): Promise<GateMode> {
  const credential = await getCredential(userId)
  const authRecord = (await deviceAuthDB.records.get('password-auth'))?.value as AuthTimestamp | undefined
  let authenticatedAt = authRecord?.at
  if (!authRecord || authRecord.userId !== userId || !Number.isFinite(authenticatedAt)) {
    authenticatedAt = Date.now()
    await deviceAuthDB.records.put({ key: 'password-auth', value: { userId, at: authenticatedAt } satisfies AuthTimestamp })
  }
  if (Date.now() - authenticatedAt! >= AUTH_WINDOW_MS) return 'expired'
  return credential ? 'locked' : 'setup'
}

export async function accessModeAfterPasswordSignIn(userId: string): Promise<GateMode> {
  const credential = await getCredential(userId)
  await deviceAuthDB.records.put({ key: 'password-auth', value: { userId, at: Date.now() } satisfies AuthTimestamp })
  return credential ? 'unlocked' : 'setup'
}

export async function saveAccessCode(userId: string, code: string): Promise<void> {
  if (!/^\d{6}$/.test(code)) throw new Error('Choose a 6-digit access code.')
  const crypto = cryptoApi()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const verifier = await deriveVerifier(code, salt)
  await deviceAuthDB.records.put({
    key: 'access-code',
    value: { userId, salt: toHex(salt), verifier, failures: 0, lockedUntil: 0 } satisfies Credential,
  })
}

export async function verifyAccessCode(userId: string, code: string): Promise<{ ok: boolean; retryAfterMs: number }> {
  const credential = await getCredential(userId)
  if (!credential || !/^\d{6}$/.test(code)) return { ok: false, retryAfterMs: 0 }
  const now = Date.now()
  if (credential.lockedUntil > now) return { ok: false, retryAfterMs: credential.lockedUntil - now }
  const verifier = await deriveVerifier(code, fromHex(credential.salt))
  if (equalHex(verifier, credential.verifier)) {
    await deviceAuthDB.records.put({ key: 'access-code', value: { ...credential, failures: 0, lockedUntil: 0 } satisfies Credential })
    return { ok: true, retryAfterMs: 0 }
  }
  const failures = credential.failures + 1
  const retryAfterMs = failures >= 5 && failures % 5 === 0
    ? 30_000 * 2 ** Math.min(4, Math.floor((failures - 1) / 5))
    : 0
  await deviceAuthDB.records.put({ key: 'access-code', value: { ...credential, failures, lockedUntil: now + retryAfterMs } satisfies Credential })
  return { ok: false, retryAfterMs }
}
