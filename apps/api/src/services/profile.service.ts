// Member profile use cases (framework-free).
import type { DbClient } from '../db/prisma.js'
import {
  updateMemberProfile,
  type UserAccount,
} from '../repositories/user.repository.js'
import type { UpdateProfileInput } from '../validators/auth.validator.js'

// Updates the caller's own name/WhatsApp. `userId` always comes from the
// server-side principal, never from the request.
export function updateProfile(
  db: DbClient,
  userId: string,
  input: UpdateProfileInput,
): Promise<UserAccount> {
  return updateMemberProfile(db, userId, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp }),
  })
}
