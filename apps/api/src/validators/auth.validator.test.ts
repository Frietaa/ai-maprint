import { describe, expect, it } from 'vitest'
import { normalizeEmail } from '../utils/email.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  whatsappSchema,
} from './auth.validator.js'

describe('normalizeEmail', () => {
  it('trims and lowercases without touching inner characters', () => {
    expect(normalizeEmail('  Ana.B+Tag@Example.TEST \n')).toBe(
      'ana.b+tag@example.test',
    )
  })
})

describe('registerSchema', () => {
  const valid = { name: 'Ana', email: 'ana@example.test', password: '12345678' }

  it('normalizes the email and keeps the password verbatim', () => {
    const parsed = registerSchema.parse({
      ...valid,
      email: ' ANA@Example.test ',
      password: ' pass word ',
    })
    expect(parsed.email).toBe('ana@example.test')
    expect(parsed.password).toBe(' pass word ')
  })

  it('applies the 8–128 character password policy', () => {
    expect(
      registerSchema.safeParse({ ...valid, password: '1234567' }).success,
    ).toBe(false)
    expect(
      registerSchema.safeParse({ ...valid, password: 'x'.repeat(128) }).success,
    ).toBe(true)
    expect(
      registerSchema.safeParse({ ...valid, password: 'x'.repeat(129) }).success,
    ).toBe(false)
  })

  it('rejects unknown fields such as role', () => {
    expect(registerSchema.safeParse({ ...valid, role: 'ADMIN' }).success).toBe(
      false,
    )
  })
})

describe('loginSchema', () => {
  it('does not apply the registration minimum (no policy hint per attempt)', () => {
    expect(
      loginSchema.safeParse({ email: 'a@example.test', password: 'x' }).success,
    ).toBe(true)
  })
})

describe('whatsappSchema', () => {
  it.each(['081234567890', '+62 812-3456-7890', ' 0812 3456 789 '])(
    'accepts %s',
    (value) => {
      expect(whatsappSchema.parse(value)).toBe(value.trim())
    },
  )

  it.each(['', null])('treats %j as no number', (value) => {
    expect(whatsappSchema.parse(value)).toBeNull()
  })

  it.each([
    '1234567',
    '+6281234567890123',
    '0812abc',
    '++62812345678',
    '-0812345678',
  ])('rejects %s', (value) => {
    expect(whatsappSchema.safeParse(value).success).toBe(false)
  })
})

describe('updateProfileSchema', () => {
  it('requires at least one field', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false)
    expect(updateProfileSchema.safeParse({ whatsapp: null }).success).toBe(true)
  })
})

describe('password hashing', () => {
  it('produces salted Argon2id hashes that verify', async () => {
    const first = await hashPassword('same password')
    const second = await hashPassword('same password')

    expect(first).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/)
    expect(first).not.toBe(second)
    expect(await verifyPassword(first, 'same password')).toBe(true)
    expect(await verifyPassword(first, 'other password')).toBe(false)
    expect(await verifyPassword('not-a-hash', 'same password')).toBe(false)
  })
})
