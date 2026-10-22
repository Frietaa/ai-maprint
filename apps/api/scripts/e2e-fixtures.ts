// Deterministic synthetic fixtures for the Playwright E2E suite, written to
// the LOCAL TEST database only (maba_printing_test). Every row is owned by
// the E2E suite (IDs prefixed e2e00000-; business_settings id = 1 in the
// test database) and removed again by removeE2eFixtures().
//
// Accounts created by automated tests (API DB tests and E2E) always use a
// reserved *.test.invalid email domain; removeTestAccounts() deletes them,
// every audit row and every session row of the test database.
//
// CLI: tsx scripts/e2e-fixtures.ts clean
import { PrismaPg } from '@prisma/adapter-pg'
import type { DbClient } from '../src/db/prisma.js'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { removeE2eStorage } from './e2e-storage.js'
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

// Deletes EVERY order and its dependent rows — test database only
// (asserted). Orders in maba_printing_test are created exclusively by
// automated tests and E2E runs. Must run before catalog/user cleanup
// because orders reference them (ON DELETE RESTRICT).
export async function removeAllOrders(db: DbClient): Promise<void> {
  await assertTestDatabase(db)
  await db.$executeRaw`DELETE FROM order_status_history`
  await db.$executeRaw`DELETE FROM order_files`
  await db.$executeRaw`DELETE FROM order_items`
  await db.$executeRaw`DELETE FROM laptop_service_requests`
  await db.$executeRaw`DELETE FROM software_installation_requests`
  await db.$executeRaw`DELETE FROM payments`
  await db.$executeRaw`DELETE FROM orders`
}

// Deletes only E2E-owned rows (children first); idempotent.
export async function removeE2eFixtures(db: DbClient): Promise<void> {
  await assertTestDatabase(db)
  await removeAllOrders(db)
  // Rows the Admin E2E creates under E2E categories/locations have random
  // IDs; they are removed through their E2E parent.
  await db.$executeRaw`DELETE FROM location_services WHERE location_id::text LIKE ${PREFIX} OR service_id::text LIKE ${PREFIX} OR service_id IN (SELECT id FROM services WHERE category_id::text LIKE ${PREFIX})`
  await db.$executeRaw`DELETE FROM services WHERE id::text LIKE ${PREFIX} OR category_id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM service_categories WHERE id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM products WHERE id::text LIKE ${PREFIX} OR category_id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM product_categories WHERE id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM locations WHERE id::text LIKE ${PREFIX}`
  await db.$executeRaw`DELETE FROM business_settings WHERE business_name = 'MABA PRINTING E2E'`
}

// Reserved, never-deliverable domains (RFC 2606 .invalid) for synthetic
// accounts: API DB tests and Playwright E2E respectively.
export const AUTH_TEST_EMAIL_DOMAIN = 'auth.test.invalid'
export const E2E_EMAIL_DOMAIN = 'e2e.test.invalid'

// Deletes synthetic test accounts and ALL sessions — test database only
// (asserted). Idempotent.
export async function removeTestAccounts(db: DbClient): Promise<void> {
  await assertTestDatabase(db)
  await removeAllOrders(db)
  // Audit rows reference their Admin actor (ON DELETE RESTRICT). In the
  // application they are append-only; only this test-database cleanup
  // removes them.
  await db.$executeRaw`DELETE FROM admin_audit_logs`
  await db.$executeRaw`DELETE FROM user_sessions`
  await db.$executeRaw`DELETE FROM users WHERE email LIKE ${'%.test.invalid'}`
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

// CLI entry: `tsx scripts/e2e-fixtures.ts clean` (fixtures, test accounts
// and sessions).
if (process.argv[1]?.endsWith('e2e-fixtures.ts')) {
  if (process.argv[2] !== 'clean') {
    console.error('Usage: tsx scripts/e2e-fixtures.ts clean')
    process.exit(2)
  }
  const db = createTestDbClient()
  try {
    await removeE2eFixtures(db)
    await removeTestAccounts(db)
    removeE2eStorage()
    console.log(
      'E2E fixtures, orders, test accounts, sessions and E2E files removed (maba_printing_test).',
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  } finally {
    await db.$disconnect()
  }
}
