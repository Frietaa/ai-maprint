import { expect, type Page, test } from '@playwright/test'

// Full-stack journey over deterministic E2E fixtures (apps/api/scripts/
// e2e-fixtures.ts): PostgreSQL (test DB) -> Prisma -> repository ->
// service -> controller -> REST -> fetch -> TanStack Query -> React.

function primaryNav(page: Page) {
  return page.getByRole('navigation', { name: 'Navigasi utama' })
}

// Intl formats "Rp 500" with a non-breaking space.
function rupiah(amount: string): RegExp {
  return new RegExp(`Rp\\s${amount.replace('.', '\\.')}`)
}

test('visitor browses home, locations, a service page and ATK', async ({
  page,
}) => {
  // Home: business identity and location preview come from the database.
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'MABA PRINTING E2E' }),
  ).toBeVisible()
  await expect(page).toHaveTitle('MABA PRINTING E2E')
  const preview = page.getByRole('region', { name: 'Lokasi kami' })
  await expect(
    preview.getByRole('heading', { name: 'Lokasi Uji Kampus' }),
  ).toBeVisible()
  await expect(preview.getByText('Lokasi Uji Nonaktif')).toHaveCount(0)
  await expect(page.getByRole('contentinfo')).toContainText('+62 800-0000-0000')

  // Locations: opening hours with split shift, closed day and note.
  await primaryNav(page).getByRole('link', { name: 'Lokasi' }).click()
  await expect(page).toHaveURL(/\/locations$/)
  await expect(page).toHaveTitle('Lokasi | MABA PRINTING E2E')
  const campus = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Lokasi Uji Kampus' }),
  })
  await expect(campus).toContainText('Jl. Uji Kampus No. 1 (fiktif)')
  await expect(campus).toContainText('07.30–12.00, 13.00–16.00')
  await expect(campus).toContainText('Tutup pada hari libur nasional.')
  await expect(campus.getByText('Tutup', { exact: true }).first()).toBeVisible()
  const city = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Lokasi Uji Kota' }),
  })
  await expect(city).toContainText('Jam buka belum tersedia.')
  await expect(page.getByRole('article')).toHaveCount(2)

  // Printing: database services, price rules, availability by location.
  await primaryNav(page).getByRole('link', { name: 'Printing' }).click()
  await expect(page).toHaveURL(/\/printing$/)
  const printBw = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Cetak A4 Hitam Putih' }),
  })
  await expect(printBw).toContainText(rupiah('500'))
  await expect(printBw).toContainText(
    'Tersedia di: Lokasi Uji Kampus, Lokasi Uji Kota',
  )
  const binding = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Jilid Spiral' }),
  })
  await expect(binding).toContainText(/Mulai Rp\s5\.000/)
  await expect(page.getByText('Layanan Uji Nonaktif')).toHaveCount(0)
  await expect(page.getByText('Diagnosa Laptop')).toHaveCount(0)

  // Location filter goes through the API (locationId).
  const filtered = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/services?locationId=') &&
      response.status() === 200,
  )
  await page
    .getByLabel('Tampilkan layanan di lokasi')
    .selectOption({ label: 'Lokasi Uji Kota' })
  await filtered
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article')).toContainText('Cetak A4 Hitam Putih')

  // ATK: Rupiah prices, UNAVAILABLE visible, inactive excluded.
  await primaryNav(page).getByRole('link', { name: 'ATK' }).click()
  await expect(page).toHaveURL(/\/atk$/)
  const paper = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Kertas A4 Uji' }),
  })
  await expect(paper).toContainText(rupiah('55.000'))
  await expect(paper).toContainText('Stok sedang kosong')
  const pen = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Pulpen Uji' }),
  })
  await expect(pen).toContainText(rupiah('3.000'))
  await expect(pen).toContainText('Tersedia')
  await expect(page.getByText('Penghapus Uji Nonaktif')).toHaveCount(0)
})

test('service-line pages show their own catalog', async ({ page }) => {
  await page.goto('/laptop-service')
  const laptop = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Diagnosa Laptop' }),
  })
  await expect(laptop).toContainText('Konfirmasi harga')
  await expect(page.getByText('Cetak A4 Hitam Putih')).toHaveCount(0)

  await page.goto('/software-installation')
  await expect(
    page.getByRole('heading', { name: 'Hanya software legal' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Instal Aplikasi Perkantoran' }),
  ).toBeVisible()
})

test('the API is reachable cross-origin only from the allowed web origin', async ({
  request,
}) => {
  const allowed = await request.get('http://localhost:3199/api/v1/products', {
    headers: { Origin: 'http://localhost:5179' },
  })
  expect(allowed.status()).toBe(200)
  expect(allowed.headers()['access-control-allow-origin']).toBe(
    'http://localhost:5179',
  )
  const body = (await allowed.json()) as { meta: { count: number } }
  expect(body.meta.count).toBe(2)

  const other = await request.get('http://localhost:3199/api/v1/products', {
    headers: { Origin: 'https://evil.example.test' },
  })
  expect(other.headers()['access-control-allow-origin']).toBeUndefined()

  const invalid = await request.get(
    'http://localhost:3199/api/v1/products?availability=SOLD_OUT',
  )
  expect(invalid.status()).toBe(400)
  expect(await invalid.json()).toStrictEqual({
    message: 'Validation failed',
    errors: { availability: ['Must be AVAILABLE or UNAVAILABLE'] },
  })
})
