import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from '@playwright/test'

// Order submission, private files and tracking end to end: real browser,
// real API (port 3199) on the LOCAL TEST database with E2E fixtures, an
// isolated temporary file storage and the PostgreSQL session store. Orders,
// accounts, sessions and uploaded files are removed by the global teardown.

const API = 'http://localhost:3199/api/v1'
const PASSWORD = 'e2e member password'
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
)

function inThreeDaysWib(): string {
  const wib = new Date(Date.now() + 3 * 86_400_000 + 7 * 3_600_000)
  return wib.toISOString().slice(0, 16)
}

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test.invalid`
}

async function registerViaApi(
  request: APIRequestContext,
  email: string,
  name: string,
): Promise<void> {
  const csrf = await request.get(`${API}/auth/csrf`)
  const { data } = (await csrf.json()) as { data: { csrfToken: string } }
  const response = await request.post(`${API}/auth/register`, {
    headers: { 'X-CSRF-Token': data.csrfToken },
    data: { name, email, password: PASSWORD, whatsapp: '0812-0000-2222' },
  })
  expect(response.status()).toBe(201)
}

async function fillContact(form: ReturnType<Page['locator']>) {
  await form.getByLabel('Nama', { exact: true }).fill('Pelanggan E2E')
  await form.getByLabel('Nomor WhatsApp').fill('0812-0000-1111')
}

async function receiptId(page: Page): Promise<string> {
  const receipt = page.getByRole('region', {
    name: 'Permintaan berhasil dikirim',
  })
  await expect(receipt).toBeVisible()
  const id = await receipt.locator('p.font-mono').textContent()
  expect(id).toMatch(/^MP-\d{4}-[0-9A-HJKMNP-TV-Z]{13}$/)
  return id ?? ''
}

test('a guest submits a printing request with a document and tracks it', async ({
  page,
}) => {
  await page.goto('/printing')
  const form = page.getByRole('region', { name: 'Ajukan permintaan printing' })
  await fillContact(form)
  await form.getByLabel('Lokasi').selectOption({ label: 'Lokasi Uji Kampus' })
  await form.getByLabel(/^Tenggat yang diinginkan/).fill(inThreeDaysWib())
  await form.getByLabel(/^File dokumen/).setInputFiles({
    name: 'Tugas Akhir E2E.pdf',
    mimeType: 'application/pdf',
    buffer: PDF,
  })
  await expect(form.getByRole('list', { name: 'File terpilih' })).toContainText(
    'Tugas Akhir E2E.pdf',
  )
  await form.getByLabel(/^Kebutuhan cetak/).fill('A4 hitam putih, 2 rangkap.')
  await form.getByRole('button', { name: 'Kirim permintaan' }).click()

  const publicId = await receiptId(page)
  await expect(page.getByText('Menunggu Konfirmasi')).toBeVisible()
  // WhatsApp handoff: configured number, message with the public ID only.
  const whatsapp = page.getByRole('link', { name: 'Diskusikan lewat WhatsApp' })
  const href = (await whatsapp.getAttribute('href')) ?? ''
  expect(href.startsWith('https://wa.me/6280000000000?text=')).toBe(true)
  expect(decodeURIComponent(href)).toContain(publicId)
  expect(decodeURIComponent(href)).not.toMatch(/Pelanggan|0812|Tugas|A4/)

  await page
    .getByRole('region', { name: 'Permintaan berhasil dikirim' })
    .getByRole('link', { name: 'Lacak pesanan', exact: true })
    .click()
  await expect(page).toHaveURL(/\/track-order$/)
  await expect(page.getByLabel('ID pesanan')).toHaveValue(publicId)
  const result = page.getByRole('region', { name: publicId })
  await expect(result).toContainText('Menunggu Konfirmasi')
  await expect(result).toContainText('Lokasi Uji Kampus')
  await expect(result).not.toContainText('Pelanggan E2E')
  await expect(result).not.toContainText('Tugas Akhir')

  // Exact, normalized lookup from a fresh page; unknown IDs are 404s.
  await page.goto('/track-order')
  await page.getByLabel('ID pesanan').fill(` ${publicId.toLowerCase()} `)
  await page.getByRole('button', { name: 'Lacak' }).click()
  await expect(page.getByRole('region', { name: publicId })).toBeVisible()
  await page.getByLabel('ID pesanan').fill('MP-2026-0000000000000')
  await page.getByRole('button', { name: 'Lacak' }).click()
  await expect(page.getByRole('alert')).toContainText('Pesanan tidak ditemukan')

  // The public API never exposes the document or customer data.
  const tracking = await page.request.get(`${API}/orders/track/${publicId}`)
  expect(await tracking.text()).not.toMatch(
    /Pelanggan|0812|Tugas|storage|\.pdf/,
  )
})

test('a member orders ATK and finds it in the order history', async ({
  page,
  playwright,
}) => {
  const email = uniqueEmail('atk')
  const setup = await playwright.request.newContext()
  await registerViaApi(setup, email, 'Member ATK E2E')
  await setup.dispose()

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL(/\/account$/)

  await page.goto('/atk')
  const form = page.getByRole('region', { name: 'Ajukan pembelian ATK' })
  // Prefilled from the profile (editable, order-only).
  await expect(form.getByLabel('Nama', { exact: true })).toHaveValue(
    'Member ATK E2E',
  )
  await expect(form.getByLabel('Nomor WhatsApp')).toHaveValue('0812-0000-2222')
  // UNAVAILABLE products cannot be chosen.
  await expect(form.getByLabel(/Kertas A4 Uji/)).toHaveCount(0)
  await form.getByLabel(/Pulpen Uji/).fill('2')
  await expect(form.getByText(/Perkiraan total:/)).toContainText('6.000')
  await form.getByRole('button', { name: 'Kirim permintaan' }).click()

  const publicId = await receiptId(page)
  await expect(page.getByText(/Rp\s6\.000/).first()).toBeVisible()

  await page.goto('/account')
  await page.getByRole('link', { name: 'Lihat riwayat pesanan' }).click()
  await expect(page).toHaveURL(/\/account\/orders$/)
  await page.getByRole('link', { name: new RegExp(publicId) }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: publicId }),
  ).toBeVisible()
  await expect(page.getByRole('table')).toContainText('Pulpen Uji')
  await expect(page.getByRole('table')).toContainText('2')
  await expect(page.getByText('Member ATK E2E')).toBeVisible()
})

test('a guest requests laptop pickup and software installation', async ({
  page,
}) => {
  await page.goto('/laptop-service')
  const laptop = page.getByRole('region', { name: 'Ajukan service laptop' })
  await laptop.getByLabel(/^Keluhan/).fill('Laptop mati total.')
  await laptop.getByLabel('Dijemput').check()
  await laptop
    .getByLabel(/^Alamat penjemputan/)
    .fill('Jl. Uji Jemput 7 (fiktif)')
  await fillContact(laptop)
  await laptop
    .getByLabel(/^Waktu selesai yang diinginkan/)
    .fill(inThreeDaysWib())
  await laptop.getByRole('button', { name: 'Kirim permintaan' }).click()
  await receiptId(page)

  await page.goto('/software-installation')
  const software = page.getByRole('region', {
    name: 'Ajukan instalasi software',
  })
  await software.getByLabel(/^Nama software/).fill('LibreOffice')
  await fillContact(software)
  await software
    .getByLabel(/^Waktu selesai yang diinginkan/)
    .fill(inThreeDaysWib())
  await software.getByRole('button', { name: 'Kirim permintaan' }).click()
  await expect(
    software.getByText('Centang pernyataan lisensi untuk melanjutkan.'),
  ).toBeVisible()
  await software.getByRole('checkbox').check()
  await software.getByRole('button', { name: 'Kirim permintaan' }).click()
  await receiptId(page)
})

test('order submission without the CSRF token is refused', async ({ page }) => {
  await page.goto('/printing')
  const response = await page.request.post(`${API}/orders`, {
    data: {
      type: 'PRINTING',
      customerName: 'Tanpa Token',
      customerWhatsapp: '0812-0000-3333',
      requestedCompletionAt: new Date(Date.now() + 86_400_000).toISOString(),
      description: 'x',
    },
  })
  expect(response.status()).toBe(403)
})
