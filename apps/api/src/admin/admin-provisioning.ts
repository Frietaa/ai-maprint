// Operator-side ADMIN provisioning (no HTTP endpoint exists for it).
// Creates a new ADMIN, or promotes an existing MEMBER only when the operator
// explicitly asks for it. Uses the same email normalization, password policy
// and Argon2id hashing as public registration.
import type { DbClient } from '../db/prisma.js'
import { normalizeEmail } from '../utils/email.js'
import { hashPassword } from '../utils/password.js'
import {
  emailSchema,
  nameSchema,
  newPasswordSchema,
} from '../validators/auth.validator.js'

export interface ProvisionAdminInput {
  email: string
  name: string
  password: string
  // Explicit operator intent to turn an existing MEMBER into an ADMIN.
  promote: boolean
}

export type ProvisionOutcome = 'created' | 'promoted' | 'already-admin'

export class ProvisioningError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProvisioningError'
  }
}

export async function provisionAdmin(
  db: DbClient,
  input: ProvisionAdminInput,
): Promise<ProvisionOutcome> {
  const email = emailSchema.safeParse(input.email)
  const name = nameSchema.safeParse(input.name)
  const password = newPasswordSchema.safeParse(input.password)
  if (!email.success)
    throw new ProvisioningError('ADMIN_EMAIL is not a valid email address')
  if (!name.success)
    throw new ProvisioningError('ADMIN_NAME must be 1-100 characters')
  if (!password.success) {
    throw new ProvisioningError('ADMIN_PASSWORD must be 8-128 characters')
  }
  const normalized = normalizeEmail(email.data)

  const existing = await db.user.findUnique({
    where: { email: normalized },
    select: { id: true, role: true, isActive: true },
  })
  if (existing?.role === 'ADMIN') {
    // Never silently reset an existing Admin's password.
    return 'already-admin'
  }
  if (existing) {
    if (!input.promote) {
      throw new ProvisioningError(
        'A member account with this email exists; re-run with --promote to make it an ADMIN',
      )
    }
    await db.user.update({
      where: { id: existing.id },
      // Role only: a deactivated account stays deactivated.
      data: { role: 'ADMIN' },
    })
    return 'promoted'
  }

  await db.user.create({
    data: {
      email: normalized,
      name: name.data,
      passwordHash: await hashPassword(password.data),
      role: 'ADMIN',
    },
  })
  return 'created'
}
