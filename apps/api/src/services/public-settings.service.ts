import type { PublicSettingsDto } from '@maba-printing/shared'
import type { DbClient } from '../db/prisma.js'
import { toPublicSettingsDto } from '../mappers/public-dto.mapper.js'
import { findBusinessSettings } from '../repositories/business-settings.repository.js'

// Public business settings (KI-011: the database row is authoritative).
// Returns null when the settings row has not been created yet; no values
// are fabricated and no environment fallback is applied.
export async function getPublicSettings(
  db: DbClient,
): Promise<PublicSettingsDto | null> {
  const record = await findBusinessSettings(db)
  return record ? toPublicSettingsDto(record) : null
}
