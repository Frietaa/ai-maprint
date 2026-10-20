// Persistence access for the BusinessSettings singleton (id = 1). It is the
// authoritative source of mutable operational values (KI-011); no env
// fallback or defaults are applied here.
import type { DbClient } from '../db/prisma.js'
import type { Prisma } from '../generated/prisma/client.js'

const SETTINGS_ID = 1

const businessSettingsSelect = {
  businessName: true,
  whatsappNumber: true,
  logoRef: true,
  qrisImageRef: true,
  socialLinks: true,
  publicInfo: true,
  updatedAt: true,
} satisfies Prisma.BusinessSettingsSelect

export type BusinessSettingsRecord = Prisma.BusinessSettingsGetPayload<{
  select: typeof businessSettingsSelect
}>

// null when the row has not been created yet (not configured).
export function findBusinessSettings(
  db: DbClient,
): Promise<BusinessSettingsRecord | null> {
  return db.businessSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: businessSettingsSelect,
  })
}
