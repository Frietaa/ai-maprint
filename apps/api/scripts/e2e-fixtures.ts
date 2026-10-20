// Deterministic synthetic fixtures for the Playwright E2E suite, written to
// the LOCAL TEST database only (maba_printing_test). Every row is owned by
// the E2E suite (IDs prefixed e2e00000-; business_settings id = 1 in the
// test database) and removed again by removeE2eFixtures().
//
// CLI: tsx scripts/e2e-fixtures.ts clean
import { PrismaPg } from '@prisma/adapter-pg'
import type { DbClient } from '../src/db/prisma.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { assertCurrentDatabase, loadTestDatabaseUrl } from './test-database.js'

export const e2eId = {
  locCampus: 'e2e00000-0000-4000-8000-000000000101',
  locCity: 'e2e00000-0000-4000-8000-000000000102',
  locRetired: 'e2e00000-0000-4000-8000-000000000103',
  catPrinting: 'e2e00000-0000-4000-8000-000000000201',
  catLaptop: 'e2e00000-0000-4000-8000-000000000202',
  catSoftware: 'e2e00000-0000-4000-8000-000000000203',
  svcPrintBw: 'e2e00000-0000-4000-8000-000000000301',
  svcBinding: 'e2e00000-0000-4000-8000-000000000302',
  svcLaptop: 'e2e00000-0000-4000-8000-000000000303',
  svcSoftware: 'e2e00000-0000-4000-8000-000000000304',
  svcRetired: 'e2e00000-0000-4000-8000-000000000305',
  catWriting: 'e2e00000-0000-4000-8000-000000000401',
  catPaper: 'e2e00000-0000-4000-8000-000000000402',
  prodPen: 'e2e00000-0000-4000-8000-000000000501',
  prodPaper: 'e2e00000-0000-4000-8000-000000000502',
  prodRetired: 'e2e00000-0000-4000-8000-000000000503',
} as const

const PREFIX = 'e2e00000-%'

export function createTestDbClient(): PrismaClient {
  const url = loadTestDatabaseUrl()
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url.toString() }),
  })
}

async function assertTestDatabase(db: DbClient): Promise<void> {
  const [row] = await db.$queryRaw<
    { name: string }[]
  >`SELECT current_database() AS name`
  assertCurrentDatabase(row?.name)
}

// Deletes only E2E-owned rows (children first); idempotent.
export async function removeE2eFixtures(db: DbClient): Promise<void> {
  await assertTestDatabase(db)
  await db.$executeRaw`DELETE FROM location_services WHERE location_id::text LIKE ${PREFIX} OR service_id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM services WHERE id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM service_categories WHERE id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM products WHERE id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM product_categories WHERE id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM locations WHERE id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM business_settings WHERE business_name = 'MABA PRINTING E2E'`
}

const id = e2eId

export async function applyE2eFixtures(db: PrismaClient): Promise<void> {
  await assertTestDatabase(db)
  await db.$transaction(async (tx) => {
    await removeE2eFixtures(tx)
    await tx.businessSettings.create({
      data: {
        id: 1,
        businessName: 'MABA PRINTING E2E',
        whatsappNumber: '+62 800-0000-0000',
        publicInfo: 'Data uji otomatis (sintetis).',
        qrisImageRef: 'private/e2e-qris.png',
      },
    })
    await tx.location.createMany({
      data: [
        {
          id: id.locCampus,
          name: 'Lokasi Uji Kampus',
          address: 'Jl. Uji Kampus No. 1 (fiktif)',
          openingHours: {
            weekly: {
              mon: [
                { open: '07:30', close: '12:00' },
                { open: '13:00', close: '16:00' },
              ],
              tue: [{ open: '08:00', close: '17:00' }],
              wed: [{ open: '08:00', close: '17:00' }],
              thu: [{ open: '08:00', close: '17:00' }],
              fri: [{ open: '08:00', close: '11:30' }],
              sat: [],
              sun: [],
            },
            note: 'Tutup pada hari libur nasional.',
          },
        },
        {
          id: id.locCity,
          name: 'Lokasi Uji Kota',
          address: 'Jl. Uji Kota No. 2 (fiktif)',
        },
        {
          id: id.locRetired,
          name: 'Lokasi Uji Nonaktif',
          address: 'Jl. Uji Lama (fiktif)',
          isActive: false,
        },
      ],
    })
    await tx.serviceCategory.createMany({
      data: [
        { id: id.catPrinting, name: 'Printing' },
        { id: id.catLaptop, name: 'Service Laptop' },
        { id: id.catSoftware, name: 'Instalasi Software' },
      ],
    })
    await tx.service.createMany({
      data: [
        {
          id: id.svcPrintBw,
          categoryId: id.catPrinting,
          name: 'Cetak A4 Hitam Putih',
          priceType: 'FIXED',
          price: 500,
        },
        {
          id: id.svcBinding,
          categoryId: id.catPrinting,
          name: 'Jilid Spiral',
          priceType: 'REQUIRES_CONFIRMATION',
          price: 5000,
        },
        {
          id: id.svcLaptop,
          categoryId: id.catLaptop,
          name: 'Diagnosa Laptop',
          priceType: 'REQUIRES_CONFIRMATION',
        },
        {
          id: id.svcSoftware,
          categoryId: id.catSoftware,
          name: 'Instal Aplikasi Perkantoran',
          priceType: 'REQUIRES_CONFIRMATION',
        },
        {
          id: id.svcRetired,
          categoryId: id.catPrinting,
          name: 'Layanan Uji Nonaktif',
          priceType: 'FIXED',
          price: 100,
          isActive: false,
        },
      ],
    })
    await tx.locationService.createMany({
      data: [
        { locationId: id.locCampus, serviceId: id.svcPrintBw },
        { locationId: id.locCampus, serviceId: id.svcBinding },
        { locationId: id.locCampus, serviceId: id.svcLaptop },
        { locationId: id.locCampus, serviceId: id.svcSoftware },
        { locationId: id.locCity, serviceId: id.svcPrintBw },
        {
          locationId: id.locCity,
          serviceId: id.svcBinding,
          isAvailable: false,
        },
      ],
    })
    await tx.productCategory.createMany({
      data: [
        { id: id.catWriting, name: 'Alat Tulis' },
        { id: id.catPaper, name: 'Kertas' },
      ],
    })
    await tx.product.createMany({
      data: [
        {
          id: id.prodPen,
          categoryId: id.catWriting,
          name: 'Pulpen Uji',
          price: 3000,
        },
        {
          id: id.prodPaper,
          categoryId: id.catPaper,
          name: 'Kertas A4 Uji',
          price: 55000,
          availability: 'UNAVAILABLE',
        },
        {
          id: id.prodRetired,
          categoryId: id.catWriting,
          name: 'Penghapus Uji Nonaktif',
          price: 1000,
          isActive: false,
        },
      ],
    })
  })
}

// CLI entry: `tsx scripts/e2e-fixtures.ts clean`
if (process.argv[1]?.endsWith('e2e-fixtures.ts')) {
  if (process.argv[2] !== 'clean') {
    console.error('Usage: tsx scripts/e2e-fixtures.ts clean')
    process.exit(2)
  }
  const db = createTestDbClient()
  try {
    await removeE2eFixtures(db)
    console.log('E2E fixtures removed from maba_printing_test.')
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  } finally {
    await db.$disconnect()
  }
}
