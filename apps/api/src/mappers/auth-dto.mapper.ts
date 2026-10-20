// Account → client DTOs. Allow-lists only the fields of the shared
// contract: never the internal ID, password hash, Google subject ID, active
// flag or timestamps.
import type { AuthUserDto, ProfileDto } from '@maba-printing/shared'
import type { UserAccount } from '../repositories/user.repository.js'

export function toAuthUserDto(account: UserAccount): AuthUserDto {
  return { name: account.name, email: account.email, role: account.role }
}

export function toProfileDto(account: UserAccount): ProfileDto {
  return {
    name: account.name,
    email: account.email,
    whatsapp: account.whatsapp,
    signInMethods: {
      password: account.hasPassword,
      google: account.hasGoogle,
    },
  }
}
