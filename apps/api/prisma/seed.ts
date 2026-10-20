// Deterministic LOCAL DEVELOPMENT seed (run with `npm run db:seed`).
//
// Every value here is synthetic: fictional names, addresses and placeholder
// contact data. Nothing is production configuration, and no users or orders
// are seeded.
//
// Idempotent: seed-owned rows have fixed UUIDs (prefix 5eed0000-) and are
// upserted, so a rerun converges to this baseline without duplicates and
// without deleting other local rows. BusinessSettings (the one global row,
// id = 1) is only created when missing: it is database-authoritative and a
// rerun never overwrites values edited later.
import { getPrisma } from '../src/db/prisma.js'
import type { Prisma } from '../src/generated/prisma/client.js'

const prisma = getPrisma()

const DEV_NOTE = 'Synthetic local development data.'

const id = {
  locationA: '5eed0000-0000-4000-8000-000000000101',
  locationB: '5eed0000-0000-4000-8000-000000000102',
  catPrinting: '5eed0000-0000-4000-8000-000000000201',
  catLaptop: '5eed0000-0000-4000-8000-000000000202',
  catSoftware: '5eed0000-0000-4000-8000-000000000203',
  svcPrintBw: '5eed0000-0000-4000-8000-000000000301',
  svcPrintColor: '5eed0000-0000-4000-8000-000000000302',
  svcBinding: '5eed0000-0000-4000-8000-000000000303',
  svcLaptopRepair: '5eed0000-0000-4000-8000-000000000304',
  svcLaptopCleaning: '5eed0000-0000-4000-8000-000000000305',
  svcSoftwareInstall: '5eed0000-0000-4000-8000-000000000306',
  svcRetired: '5eed0000-0000-4000-8000-000000000307',
  catWriting: '5eed0000-0000-4000-8000-000000000401',
  catPaper: '5eed0000-0000-4000-8000-000000000402',
  catNotebooks: '5eed0000-0000-4000-8000-000000000403',
  prodPen: '5eed0000-0000-4000-8000-000000000501',
  prodPencil: '5eed0000-0000-4000-8000-000000000502',
  prodEraser: '5eed0000-0000-4000-8000-000000000503',
  prodPaperA4: '5eed0000-0000-4000-8000-000000000504',
  prodNotebook: '5eed0000-0000-4000-8000-000000000505',
} as const

// Opening-hours shape documented in schema.prisma (WIB local time).
const weekdayHours = [{ open: '08:00', close: '17:00' }]

const locations: Prisma.LocationCreateInput[] = [
  {
    id: id.locationA,
    name: 'Dev Location A',
    isActive: true,
    address: 'Jl. Contoh No. 1, Kota Fiktif (fictional address)',
    openingHours: {
      weekly: {
        mon: weekdayHours,
        tue: weekdayHours,
        wed: weekdayHours,
        thu: weekdayHours,
        fri: weekdayHours,
        sat: [{ open: '09:00', close: '13:00' }],
        sun: [],
      },
    },
  },
  {
    id: id.locationB,
    name: 'Dev Location B',
    isActive: true,
    address: 'Jl. Percobaan No. 2, Kota Fiktif (fictional address)',
    openingHours: {
      weekly: {
        mon: [
          { open: '07:30', close: '12:00' },
          { open: '13:00', close: '16:00' },
        ],
        tue: [],
        wed: [{ open: '07:30', close: '16:00' }],
        thu: [{ open: '07:30', close: '16:00' }],
        fri: [{ open: '07:30', close: '11:30' }],
        sat: [],
        sun: [],
      },
      note: 'Fictional schedule for development.',
    },
  },
]

const serviceCategories = [
  { id: id.catPrinting, name: 'Printing' },
  { id: id.catLaptop, name: 'Laptop Service' },
  { id: id.catSoftware, name: 'Software Installation' },
]

const services: Prisma.ServiceUncheckedCreateInput[] = [
  {
    id: id.svcPrintBw,
    categoryId: id.catPrinting,
    name: 'Print A4 Black & White (per page)',
    priceType: 'FIXED',
    price: 500,
  },
  {
    id: id.svcPrintColor,
    categoryId: id.catPrinting,
    name: 'Print A4 Color (per page)',
    priceType: 'FIXED',
    price: 1500,
  },
  {
    id: id.svcBinding,
    categoryId: id.catPrinting,
    name: 'Document Binding',
    priceType: 'REQUIRES_CONFIRMATION',
    price: null,
  },
  {
    id: id.svcLaptopRepair,
    categoryId: id.catLaptop,
    name: 'Laptop Diagnosis & Repair',
    priceType: 'REQUIRES_CONFIRMATION',
    price: null,
  },
  // REQUIRES_CONFIRMATION with an indicative price.
  {
    id: id.svcLaptopCleaning,
    categoryId: id.catLaptop,
    name: 'Laptop Cleaning',
    priceType: 'REQUIRES_CONFIRMATION',
    price: 50000,
  },
  {
    id: id.svcSoftwareInstall,
    categoryId: id.catSoftware,
    name: 'Legal Software Installation',
    priceType: 'REQUIRES_CONFIRMATION',
    price: null,
  },
  // Inactive (intentionally removed from normal display).
  {
    id: id.svcRetired,
    categoryId: id.catPrinting,
    name: 'Dev Retired Service',
    priceType: 'FIXED',
    price: 1000,
    isActive: false,
  },
]

// Location A offers every active service; Location B offers printing only,
// with color printing temporarily unavailable.
const locationServices: Prisma.LocationServiceUncheckedCreateInput[] = [
  { locationId: id.locationA, serviceId: id.svcPrintBw, isAvailable: true },
  { locationId: id.locationA, serviceId: id.svcPrintColor, isAvailable: true },
  { locationId: id.locationA, serviceId: id.svcBinding, isAvailable: true },
  {
    locationId: id.locationA,
    serviceId: id.svcLaptopRepair,
    isAvailable: true,
  },
  {
    locationId: id.locationA,
    serviceId: id.svcLaptopCleaning,
    isAvailable: true,
  },
  {
    locationId: id.locationA,
    serviceId: id.svcSoftwareInstall,
    isAvailable: true,
  },
  { locationId: id.locationB, serviceId: id.svcPrintBw, isAvailable: true },
  { locationId: id.locationB, serviceId: id.svcPrintColor, isAvailable: false },
]

const productCategories = [
  { id: id.catWriting, name: 'Writing Tools' },
  { id: id.catPaper, name: 'Paper' },
  { id: id.catNotebooks, name: 'Notebooks' },
]

const products: Prisma.ProductUncheckedCreateInput[] = [
  {
    id: id.prodPen,
    categoryId: id.catWriting,
    name: 'Ballpoint Pen (Black)',
    price: 3000,
  },
  {
    id: id.prodPencil,
    categoryId: id.catWriting,
    name: 'Pencil 2B',
    price: 2500,
    imageRef: 'dev/placeholder-pencil.png',
  },
  // Inactive (intentionally removed from normal display).
  {
    id: id.prodEraser,
    categoryId: id.catWriting,
    name: 'Dev Discontinued Eraser',
    price: 1500,
    isActive: false,
  },
  // Active but temporarily out of stock.
  {
    id: id.prodPaperA4,
    categoryId: id.catPaper,
    name: 'A4 Paper (1 ream)',
    price: 55000,
    availability: 'UNAVAILABLE',
  },
  {
    id: id.prodNotebook,
    categoryId: id.catNotebooks,
    name: 'Notebook A5 (40 sheets)',
    price: 8000,
  },
]

async function main(): Promise<void> {
  // One batch transaction: the seed applies completely or not at all.
  await prisma.$transaction([
    prisma.businessSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        businessName: 'MABA PRINTING (Local Dev)',
        // Placeholder, not a real number.
        whatsappNumber: '+620000000000',
        logoRef: 'dev/placeholder-logo.png',
        qrisImageRef: null,
        socialLinks: {},
        publicInfo: DEV_NOTE,
      },
    }),
    ...locations.map((data) =>
      prisma.location.upsert({
        where: { id: data.id },
        update: data,
        create: data,
      }),
    ),
    ...serviceCategories.map((data) =>
      prisma.serviceCategory.upsert({
        where: { id: data.id },
        update: { ...data, description: DEV_NOTE, isActive: true },
        create: { ...data, description: DEV_NOTE },
      }),
    ),
    ...services.map((data) => {
      const row = { isActive: true, description: DEV_NOTE, ...data }
      return prisma.service.upsert({
        where: { id: data.id },
        update: row,
        create: row,
      })
    }),
    ...locationServices.map((data) =>
      prisma.locationService.upsert({
        where: {
          locationId_serviceId: {
            locationId: data.locationId,
            serviceId: data.serviceId,
          },
        },
        update: { isAvailable: data.isAvailable },
        create: data,
      }),
    ),
    ...productCategories.map((data) =>
      prisma.productCategory.upsert({
        where: { id: data.id },
        update: { ...data, description: DEV_NOTE, isActive: true },
        create: { ...data, description: DEV_NOTE },
      }),
    ),
    ...products.map((data) => {
      const row = {
        isActive: true,
        availability: 'AVAILABLE' as const,
        imageRef: null,
        description: DEV_NOTE,
        ...data,
      }
      return prisma.product.upsert({
        where: { id: data.id },
        update: row,
        create: row,
      })
    }),
  ])
}

try {
  await main()
  console.log('Seed applied: synthetic local development baseline.')
} catch (error) {
  console.error('Seed failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
