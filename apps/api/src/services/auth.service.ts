// Authentication use cases. Framework-free: no Express types and no session
// handling here — controllers start the session after a use case succeeds.
import type { DbClient } from '../db/prisma.js'
import { AUTH_LIMITS } from '@maba-printing/shared'
import { AuthenticationError, ConflictError } from '../errors/app-error.js'
import { Prisma } from '../generated/prisma/client.js'
import {
  createMember,
  findUserByEmail,
  findUserByGoogleId,
  findUserCredentialsByEmail,
  type UserAccount,
} from '../repositories/user.repository.js'
import { normalizeEmail } from '../utils/email.js'
import {
  hashPassword,
  verifyAgainstDummy,
  verifyPassword,
} from '../utils/password.js'
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js'
import {
  GoogleCredentialError,
  type GoogleIdentityVerifier,
} from './google-identity.js'

export const EMAIL_TAKEN_MESSAGE = 'Email already registered'

// The single sign-in failure: unknown email, wrong password, Google-only
// account and deactivated account are indistinguishable to the client.
export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password'

// Public registration: always a MEMBER with an Argon2id password hash.
// `input.email` is already normalized by the validator.
export async function registerMember(
  db: DbClient,
  input: RegisterInput,
): Promise<UserAccount> {
  if (await findUserByEmail(db, input.email)) {
    throw new ConflictError(EMAIL_TAKEN_MESSAGE)
  }
  const passwordHash = await hashPassword(input.password)
  try {
    return await createMember(db, {
      name: input.name,
      email: input.email,
      passwordHash,
      googleId: null,
      whatsapp: input.whatsapp ?? null,
    })
  } catch (error) {
    // Concurrent sign-up, or a legacy differently-cased row caught by
    // users_email_lower_key.
    if (isUniqueViolation(error)) throw new ConflictError(EMAIL_TAKEN_MESSAGE)
    throw error
  }
}

// Email + password sign-in. `input.email` is already normalized. The
// password is always run through Argon2id (a dummy hash when the account has
// none) before any decision, and the active check happens only after a
// successful verification, so neither status, message nor work reveals why
// a sign-in failed.
export async function authenticateWithPassword(
  db: DbClient,
  input: LoginInput,
): Promise<UserAccount> {
  const credentials = await findUserCredentialsByEmail(db, input.email)
  if (!credentials?.passwordHash) {
    await verifyAgainstDummy(input.password)
    throw new AuthenticationError(INVALID_CREDENTIALS_MESSAGE)
  }
  const valid = await verifyPassword(credentials.passwordHash, input.password)
  if (!valid || !credentials.account.isActive) {
    throw new AuthenticationError(INVALID_CREDENTIALS_MESSAGE)
  }
  return credentials.account
}

export const GOOGLE_FAILED_MESSAGE = 'Google sign-in failed'
export const GOOGLE_EMAIL_CONFLICT_MESSAGE =
  'Email already registered with another sign-in method'

// Google Sign-In with a credential verified server-side. Resolution is
// deliberately conservative:
//   1. an account already linked to this Google subject signs in (if active);
//   2. otherwise the Google email must be verified by Google;
//   3. no account with that email → a new MEMBER (no password);
//   4. an account with that email but without this Google identity → 409.
//      It is never linked automatically: without email verification in
//      MABA PRINTING, ownership of a password account's address is unproven,
//      and linking would let whoever pre-registered the address keep access
//      (pre-account-takeover). ADMIN accounts are never touched here.
// Public Google Sign-In never creates or elevates an ADMIN.
export async function authenticateWithGoogle(
  db: DbClient,
  verifier: GoogleIdentityVerifier,
  credential: string,
): Promise<UserAccount> {
  let identity
  try {
    identity = await verifier.verify(credential)
  } catch (error) {
    if (error instanceof GoogleCredentialError) {
      throw new AuthenticationError(GOOGLE_FAILED_MESSAGE)
    }
    throw error
  }

  const linked = await findUserByGoogleId(db, identity.subject)
  if (linked) {
    if (!linked.isActive) throw new AuthenticationError(GOOGLE_FAILED_MESSAGE)
    return linked
  }

  const email = normalizeEmail(identity.email)
  if (!identity.emailVerified || email.length > AUTH_LIMITS.emailMaxLength) {
    throw new AuthenticationError(GOOGLE_FAILED_MESSAGE)
  }
  if (await findUserByEmail(db, email)) {
    throw new ConflictError(GOOGLE_EMAIL_CONFLICT_MESSAGE)
  }

  try {
    return await createMember(db, {
      name: googleDisplayName(identity.name, email),
      email,
      passwordHash: null,
      googleId: identity.subject,
      whatsapp: null,
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError(GOOGLE_EMAIL_CONFLICT_MESSAGE)
    }
    throw error
  }
}

// Google's display name, else the email's local part; bounded like `name`.
function googleDisplayName(name: string | null, email: string): string {
  const candidate = name ?? email.split('@')[0] ?? email
  return candidate.slice(0, AUTH_LIMITS.nameMaxLength)
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}
