// Persistence access for user accounts — only what authentication and the
// member profile need (no generic CRUD). Explicit selects throughout; the
// password hash leaves this module only through findUserCredentialsByEmail,
// and the Google subject ID never leaves it (only "has Google" does).
import type { DbClient } from '../db/prisma.js'
import type { Prisma, UserRole } from '../generated/prisma/client.js'

export interface UserAccount {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  whatsapp: string | null
  hasPassword: boolean
  hasGoogle: boolean
}

export interface UserCredentials {
  account: UserAccount
  // null for Google-only accounts.
  passwordHash: string | null
}

const accountSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  whatsapp: true,
  passwordHash: true,
  googleId: true,
} satisfies Prisma.UserSelect

type AccountRow = Prisma.UserGetPayload<{ select: typeof accountSelect }>

function toAccount(row: AccountRow): UserAccount {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    whatsapp: row.whatsapp,
    hasPassword: row.passwordHash !== null,
    hasGoogle: row.googleId !== null,
  }
}

export async function findUserById(
  db: DbClient,
  id: string,
): Promise<UserAccount | null> {
  const row = await db.user.findUnique({ where: { id }, select: accountSelect })
  return row ? toAccount(row) : null
}

// `email` must already be normalized (normalizeEmail).
export async function findUserByEmail(
  db: DbClient,
  email: string,
): Promise<UserAccount | null> {
  const row = await db.user.findUnique({
    where: { email },
    select: accountSelect,
  })
  return row ? toAccount(row) : null
}

// For the password check only. `email` must already be normalized.
export async function findUserCredentialsByEmail(
  db: DbClient,
  email: string,
): Promise<UserCredentials | null> {
  const row = await db.user.findUnique({
    where: { email },
    select: accountSelect,
  })
  return row
    ? { account: toAccount(row), passwordHash: row.passwordHash }
    : null
}

export async function findUserByGoogleId(
  db: DbClient,
  googleId: string,
): Promise<UserAccount | null> {
  const row = await db.user.findUnique({
    where: { googleId },
    select: accountSelect,
  })
  return row ? toAccount(row) : null
}

export interface NewMember {
  name: string
  // Normalized.
  email: string
  // Argon2id hash; null for a Google-only account.
  passwordHash: string | null
  googleId: string | null
  whatsapp: string | null
}

// Public sign-up paths create MEMBER accounts only; the role is fixed here,
// never taken from input.
export async function createMember(
  db: DbClient,
  member: NewMember,
): Promise<UserAccount> {
  const row = await db.user.create({
    data: { ...member, role: 'MEMBER' },
    select: accountSelect,
  })
  return toAccount(row)
}

export interface ProfileChanges {
  name?: string
  whatsapp?: string | null
}

// Updates only the member-editable fields of the given account.
export async function updateMemberProfile(
  db: DbClient,
  id: string,
  changes: ProfileChanges,
): Promise<UserAccount> {
  const row = await db.user.update({
    where: { id },
    data: changes,
    select: accountSelect,
  })
  return toAccount(row)
}
