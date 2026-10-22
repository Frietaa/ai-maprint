import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from '@playwright/test'

// Phase-06 MVP journeys end to end: customer payment information, the
// duplicate-submission protection and an Admin-processed laptop order seen
// by its member. Real browser, real API (port 3199) on the LOCAL TEST
// database with E2E fixtures and isolated E2E storage; everything is removed
// by the global teardown. The QRIS image is a synthetic PNG served by a
// Playwright route (no real payment data).

const API = 'http://localhost:3199/api/v1'
const PASSWORD = 'e2e member password'
const ADMIN = {
  email: 'admin@e2e.test.invalid',
  password: 'e2e admin password',
}
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
)
// 1x1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

function inThreeDaysWib(): string {
  const wib = new Date(Date.now() + 3 * 86_400_000 + 7 * 3_600_000)
  return wib.toISOString().slice(0, 16)
}

async function serveQris(page: Page) {
  await page.route('**/brand/e2e-qris.png', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
  )
}

async function receiptId(page: Page): Promise<string> {
  const receipt = page.getByRole('region', {
    name: 'Permintaan berhasil dikirim',
  })
  await expect(receipt).toBeVisible()
  const id = (await receipt.locator('p.font-mono').textContent()) ?? ''
  expect(id).toMatch(/^MP-\d{4}-[0-9A-HJKMNP-TV-Z]{13}$/)
  return id
}

async function registerViaApi(request: APIRequestContext, email: string) {
  const csrf = await request.get(`${API}/auth/csrf`)
  const { data } = (await csrf.json()) as { data: { csrfToken: string } }
  const response = await request.post(`${API}/auth/register`, {
    headers: { 'X-CSRF-Token': data.csrfToken },
    data: {
      name: 'Member Laptop E2E',
      email,
      password: PASSWORD,
      whatsapp: '0812-0000-7777',
    },
  })
  expect(response.status()).toBe(201)
}

test('a lost response is retried without creating a second order, and the receipt explains payment', async ({
  page,
}) => {
  await serveQris(page)
  // The first submission reaches the server, but its response is "lost".
  let committedId: string | null = null
  await page.route(`${API}/orders`, async (route) => {
    if (committedId === null && route.request().method() === 'POST') {
      const response = await route.fetch()
      const body = (await response.json()) as { data: { publicId: string } }
      committedId = body.data.publicId
      await route.abort('connectionreset')
      return
    }
    await route.continue()
  })

  await page.goto('/printing')
  const form = page.getByRole('region', { name: 'Ajukan permintaan printing' })
  await form.getByLabel('Nama', { exact: true }).fill('Pelanggan Ulang E2E')
  await form.getByLabel('Nomor WhatsApp').fill('0812-0000-6666')
  await form.getByLabel(/^Tenggat yang diinginkan/).fill(inThreeDaysWib())
  await form.getByLabel(/^File dokumen/).setInputFiles({
    name: 'Ulang E2E.pdf',
    mimeType: 'application/pdf',
    buffer: PDF,
  })
  await form.getByRole('button', { name: 'Kirim permintaan' }).click()
  await expect(form.getByRole('alert')).toContainText(
    'tidak akan membuat pesanan ganda',
  )

  // Resending the unchanged form returns the order already created.
  await form.getByRole('button', { name: 'Kirim permintaan' }).click()
  const publicId = await receiptId(page)
  expect(publicId).toBe(committedId)

  // Payment information: static QRIS, manual confirmation.
  const payment = page.getByRole('region', { name: 'Pembayaran' })
  await expect(
    payment.getByRole('img', {
      name: 'Kode QRIS MABA PRINTING E2E untuk pembayaran',
    }),
  ).toBeVisible()
  await expect(payment).toContainText('dikonfirmasi secara manual oleh admin')

  // Tracking shows how to pay, never a payment state.
  await page
    .getByRole('region', { name: 'Permintaan berhasil dikirim' })
    .getByRole('link', { name: 'Lacak pesanan', exact: true })
    .click()
  await page.getByRole('button', { name: 'Lacak' }).click()
  await expect(page.getByRole('region', { name: publicId })).toBeVisible()
  const trackingPayment = page.getByRole('region', { name: 'Pembayaran' })
  await expect(trackingPayment).toBeVisible()
  await expect(
    trackingPayment.getByText('Status pembayaran', { exact: true }),
  ).toHaveCount(0)
  await expect(trackingPayment).not.toContainText(/Belum dibayar|Lunas/)
})

test('a member’s laptop pickup is priced and confirmed by an Admin, and the member sees the safe result', async ({
  browser,
  playwright,
}) => {
  const email = `laptop-${Date.now()}@e2e.test.invalid`
  const setup = await playwright.request.newContext()
  await registerViaApi(setup, email)
  await setup.dispose()

  const memberContext = await browser.newContext()
  const member = await memberContext.newPage()
  await serveQris(member)
  await member.goto('/login')
  await member.getByLabel('Email').fill(email)
  await member.getByLabel('Kata sandi').fill(PASSWORD)
  await member.getByRole('button', { name: 'Masuk' }).click()
  await expect(member).toHaveURL(/\/account$/)

  await member.goto('/laptop-service')
  const laptop = member.getByRole('region', { name: 'Ajukan service laptop' })
  await laptop.getByLabel(/^Keluhan/).fill('Engsel patah, layar berkedip.')
  await laptop.getByLabel('Dijemput').check()
  await laptop
    .getByLabel(/^Alamat penjemputan/)
    .fill('Jl. Uji Jemput 9 (fiktif)')
  await laptop
    .getByLabel(/^Waktu selesai yang diinginkan/)
    .fill(inThreeDaysWib())
  await laptop.getByRole('button', { name: 'Kirim permintaan' }).click()
  const publicId = await receiptId(member)

  // Admin: distance → pickup fee (ceil(7.3 − 5) × Rp2.000 = Rp6.000),
  // final total, status and manual QRIS confirmation.
  const adminContext = await browser.newContext()
  const admin = await adminContext.newPage()
  await admin.goto(
    `/admin/login?redirect=${encodeURIComponent(`/admin/orders/${publicId}`)}`,
  )
  await admin.getByLabel('Email').fill(ADMIN.email)
  await admin.getByLabel('Kata sandi').fill(ADMIN.password)
  await admin.getByRole('button', { name: 'Masuk' }).click()
  await expect(
    admin.getByRole('heading', { level: 1, name: publicId }),
  ).toBeVisible()
  const pricing = admin.getByRole('region', { name: 'Harga' })
  await pricing.getByLabel(/Jarak penjemputan/).fill('7.3')
  await pricing.getByLabel('Total akhir (Rp)').fill('156000')
  await pricing.getByRole('button', { name: 'Simpan harga' }).click()
  await expect(admin.getByText('Harga disimpan.')).toBeVisible()
  await admin
    .getByRole('region', { name: 'Status' })
    .getByRole('button', { name: 'Ubah ke: Pesanan Diterima' })
    .click()
  await expect(
    admin.getByText('Status diubah ke Pesanan Diterima.'),
  ).toBeVisible()
  const adminPayment = admin.getByRole('region', { name: 'Pembayaran' })
  await adminPayment.getByLabel('Metode').selectOption('QRIS_STATIC')
  await adminPayment.getByLabel('Status').selectOption('PAID')
  await adminPayment.getByLabel('Jumlah (Rp)').fill('156000')
  await adminPayment.getByRole('button', { name: 'Simpan pembayaran' }).click()
  await expect(adminPayment).toContainText('Dikonfirmasi lunas oleh Admin E2E')
  await adminContext.close()

  // Member: safe updated state; no Admin identity, no QRIS once paid.
  await member.goto(`/account/orders/${publicId}`)
  await expect(member.getByText('Pesanan Diterima').first()).toBeVisible()
  await expect(member.getByText(/Rp\s6\.000/)).toBeVisible()
  const payment = member.getByRole('region', { name: 'Pembayaran' })
  await expect(payment).toContainText('Lunas')
  await expect(payment).toContainText('QRIS')
  await expect(payment).toContainText('156.000')
  await expect(payment.getByRole('img')).toHaveCount(0)
  await expect(member.locator('body')).not.toContainText('Admin E2E')
  const detail = await member.request.get(`${API}/account/orders/${publicId}`)
  expect(await detail.text()).not.toMatch(/confirmed|Admin E2E/)
  await memberContext.close()
})

test('a guest requests a legal software installation and tracks it', async ({
  page,
}) => {
  await page.goto('/software-installation')
  const software = page.getByRole('region', {
    name: 'Ajukan instalasi software',
  })
  await software.getByLabel(/^Nama software/).fill('Inkscape')
  await software.getByLabel('Nama', { exact: true }).fill('Tamu Software E2E')
  await software.getByLabel('Nomor WhatsApp').fill('0812-0000-8888')
  await software
    .getByLabel(/^Waktu selesai yang diinginkan/)
    .fill(inThreeDaysWib())
  await software.getByRole('checkbox').check()
  await software.getByRole('button', { name: 'Kirim permintaan' }).click()
  const publicId = await receiptId(page)

  await page.goto('/track-order')
  await page.getByLabel('ID pesanan').fill(publicId.toLowerCase())
  await page.getByRole('button', { name: 'Lacak' }).click()
  const result = page.getByRole('region', { name: publicId })
  await expect(result).toContainText('Instalasi Software')
  await expect(result).toContainText('Menunggu Konfirmasi')
  const tracking = await page.request.get(`${API}/orders/track/${publicId}`)
  expect(await tracking.text()).not.toMatch(/Inkscape|Tamu|0812|payment/)
})
