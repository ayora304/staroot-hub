import { describe, expect, it } from 'vitest'
import { isAllowedEmail } from '../../../api/_lib/emailDomain'

const D = ['staroot.example']

describe('isAllowedEmail', () => {
  it('accepts the exact domain, case-insensitively', () => {
    expect(isAllowedEmail('Jane@Staroot.Example', D)).toBe(true)
    expect(isAllowedEmail('  jane@staroot.example ', D)).toBe(true)
  })
  it('rejects subdomains and look-alikes', () => {
    expect(isAllowedEmail('a@mail.staroot.example', D)).toBe(false)
    expect(isAllowedEmail('a@evilstaroot.example', D)).toBe(false)
    expect(isAllowedEmail('a@staroot.example.evil.com', D)).toBe(false)
  })
  it('rejects malformed addresses', () => {
    expect(isAllowedEmail('staroot.example', D)).toBe(false)
    expect(isAllowedEmail('@staroot.example', D)).toBe(false)
    expect(isAllowedEmail('a@b@staroot.example', D)).toBe(false)
  })
  it('supports several domains and rejects all when none configured', () => {
    expect(isAllowedEmail('a@b.example', ['staroot.example', '@b.example'])).toBe(true)
    expect(isAllowedEmail('a@staroot.example', [])).toBe(false)
  })
})
