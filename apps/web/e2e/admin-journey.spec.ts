import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from '@playwright/test'

// Admin operations end to end: real browser, real API (port 3199) on the
// LOCAL TEST database with E2E fixtures, isolated E2E file storage and the
// PostgreSQL session store. The synthetic Admin is provisioned by the E2E
// API at start-up (test database only). Everything created here — orders,
// files, catalog rows under E2E categories, audit rows, accounts and
// sessions — is removed by the global teardown.

const API = 'http://localhost:3199/api/v1'
const ADMIN = {
  email: 'admin@e2e.test.invalid',
  password: 'e2e admin password',
}
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
)

async function csrf(request: APIRequestContext): Promise<string> {
  const response = await request.get(`${API}/auth/csrf`)
  const { data } = (await response.json()) as { data: { csrfToken: string } }
  return data.csrfToken
}

// A guest printing order with one document, submitted through the API.
async function guestOrder(request: APIRequestContext): Promise<string> {
  const token = await csrf(request)
  const response = await request.post(`${API}/orders`, {
    headers: { 'X-CSRF-Token': token },
    multipart: {
      payload: JSON.stringify({
        type: 'PRINTING',
        customerName: 'Pelanggan Admin E2E',
        customerWhatsapp: '0812-0000-5555',
        requestedCompletionAt: new Date(
          Date.now() + 3 * 86_400_000,
        ).toISOString(),
        description: 'Cetak untuk uji Admin.',
      }),
      files: {
        name: 'Dokumen Uji.pdf',
        mimeType: 'application/pdf',
        buffer: PDF,
      },
    },
  })
  expect(response.status()).toBe(201)
  const { data } = (await response.json()) as { data: { publicId: string } }
  return data.publicId
}

async function adminLogin(page: Page, redirect = '') {
  await page.goto(`/admin/login${redirect}`)
  await page.getByLabel('Email').fill(ADMIN.email)
  await page.getByLabel('Kata sandi').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Masuk' }).click()
}

test('a member cannot enter the Admin area', async ({ page, playwright }) => {
  const email = `member-${Date.now()}@e2e.test.invalid`
  const setup = await playwright.request.newContext()
  const token = await csrf(setup)
  await setup.post(`${API}/auth/register`, {
    headers: { 'X-CSRF-Token': token },
    data: { name: 'Member Biasa', email, password: 'e2e member password' },
  })
  await setup.dispose()

  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login\?redirect=%2Fadmin$/)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi').fill('e2e member password')
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page.getByRole('alert')).toHaveText('Akun ini bukan akun Admin.')

  await page.goto('/admin/orders')
  await expect(
    page.getByRole('heading', { name: 'Khusus Admin' }),
  ).toBeVisible()
  const api = await page.request.get(`${API}/admin/orders`)
  expect(api.status()).toBe(403)
})

test('an Admin processes an order from submission to completion', async ({
  page,
  playwright,
}) => {
  const guest = await playwright.request.newContext()
  const publicId = await guestOrder(guest)
  await guest.dispose()

  await adminLogin(
    page,
    `?redirect=${encodeURIComponent(`/admin/orders/${publicId}`)}`,
  )
  await expect(page).toHaveURL(new RegExp(`/admin/orders/${publicId}$`))
  await expect(
    page.getByRole('heading', { level: 1, name: publicId }),
  ).toBeVisible()
  const facts = page.getByRole('region', { name: 'Detail permintaan' })
  await expect(facts).toContainText('Pelanggan Admin E2E')
  await expect(facts).toContainText('Tamu')

  // Document download (attachment, original name).
  const download = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Unduh Dokumen Uji.pdf' }).click()
  expect((await download).suggestedFilename()).toBe('Dokumen Uji.pdf')

  // Pricing, payment and internal notes.
  const pricing = page.getByRole('region', { name: 'Harga' })
  await pricing.getByLabel('Total akhir (Rp)').fill('12000')
  await pricing.getByRole('button', { name: 'Simpan harga' }).click()
  await expect(page.getByText('Harga disimpan.')).toBeVisible()

  const notes = page.getByRole('region', { name: 'Catatan admin (internal)' })
  await notes.getByLabel('Catatan').fill('Catatan rahasia E2E')
  await notes.getByRole('button', { name: 'Simpan catatan' }).click()
  await expect(page.getByText('Catatan disimpan.')).toBeVisible()

  // Status machine to completion; terminal afterwards.
  for (const label of [
    'Pesanan Diterima',
    'Sedang Dikerjakan',
    'Siap/Selesai',
    'Pesanan Selesai',
  ]) {
    await page
      .getByRole('region', { name: 'Status' })
      .getByRole('button', { name: `Ubah ke: ${label}` })
      .click()
    await expect(page.getByText(`Status diubah ke ${label}.`)).toBeVisible()
  }
  await expect(
    page.getByText('Status akhir — tidak dapat diubah lagi.'),
  ).toBeVisible()

  const payment = page.getByRole('region', { name: 'Pembayaran' })
  await payment.getByLabel('Metode').selectOption('QRIS_STATIC')
  await payment.getByLabel('Status').selectOption('PAID')
  await payment.getByLabel('Jumlah (Rp)').fill('12000')
  await payment.getByRole('button', { name: 'Simpan pembayaran' }).click()
  await expect(page.getByRole('region', { name: 'Pembayaran' })).toContainText(
    'Dikonfirmasi lunas oleh Admin E2E',
  )

  // The customer sees the completed status, never the internal notes.
  await page.goto('/track-order')
  await page.getByLabel('ID pesanan').fill(publicId)
  await page.getByRole('button', { name: 'Lacak' }).click()
  const result = page.getByRole('region', { name: publicId })
  await expect(result).toContainText('Pesanan Selesai')
  const tracking = await page.request.get(`${API}/orders/track/${publicId}`)
  expect(await tracking.text()).not.toMatch(
    /rahasia|adminNotes|12000|Pelanggan/,
  )

  // Admin mutations without the CSRF token are refused.
  const forged = await page.request.patch(
    `${API}/admin/orders/${publicId}/notes`,
    {
      data: { adminNotes: 'x' },
    },
  )
  expect(forged.status()).toBe(403)
})

test('Admin catalog and settings changes appear on the public site', async ({
  page,
}) => {
  await adminLogin(page)
  await expect(
    page.getByRole('navigation', { name: 'Navigasi admin' }),
  ).toBeVisible()

  // New product in an E2E category is public at once.
  await page
    .getByRole('navigation', { name: 'Navigasi admin' })
    .getByRole('link', { name: 'Produk' })
    .click()
  await page.getByRole('button', { name: 'Tambah produk' }).click()
  const form = page.getByRole('region', { name: 'Produk baru' })
  await form.getByLabel('Kategori').selectOption({ label: 'Alat Tulis' })
  await form.getByLabel(/^Nama/).fill('Spidol Admin E2E')
  await form.getByLabel(/^Harga/).fill('8000')
  await form.getByRole('button', { name: 'Simpan' }).click()
  await expect(
    page.getByRole('cell', { name: 'Spidol Admin E2E', exact: true }),
  ).toBeVisible()

  // Per-location service availability (PUT, cross-origin in E2E): toggle
  // it off and back on, persisted across a reload.
  await page
    .getByRole('navigation', { name: 'Navigasi admin' })
    .getByRole('link', { name: 'Lokasi' })
    .click()
  const campus = page.getByRole('region', { name: 'Lokasi Uji Kampus' })
  const binding = campus.getByRole('checkbox', { name: 'Jilid Spiral' })
  await expect(binding).toBeChecked()
  await binding.uncheck()
  await page.reload()
  await expect(
    page
      .getByRole('region', { name: 'Lokasi Uji Kampus' })
      .getByRole('checkbox', { name: 'Jilid Spiral' }),
  ).not.toBeChecked()
  await page
    .getByRole('region', { name: 'Lokasi Uji Kampus' })
    .getByRole('checkbox', { name: 'Jilid Spiral' })
    .check()
  await page.reload()
  await expect(
    page
      .getByRole('region', { name: 'Lokasi Uji Kampus' })
      .getByRole('checkbox', { name: 'Jilid Spiral' }),
  ).toBeChecked()

  // A social link added in the settings shows up in the public footer.
  await page
    .getByRole('navigation', { name: 'Navigasi admin' })
    .getByRole('link', { name: 'Pengaturan' })
    .click()
  await page.getByRole('button', { name: '+ Tautan' }).click()
  await page.getByLabel('Platform').last().fill('instagram')
  await page.getByLabel('URL').last().fill('https://instagram.example/maba-e2e')
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click()
  await expect(
    page.getByText('Pengaturan disimpan dan langsung tampil di situs.'),
  ).toBeVisible()

  await page.goto('/atk')
  await expect(
    page.getByRole('heading', { name: 'Spidol Admin E2E' }),
  ).toBeVisible()
  await expect(
    page.getByRole('contentinfo').getByRole('link', { name: 'instagram' }),
  ).toHaveAttribute('href', 'https://instagram.example/maba-e2e')

  // Leave the shared E2E catalog as other specs expect it: deactivate the
  // new product again (records are never deleted) and remove the link.
  const token = await csrf(page.request)
  const list = await page.request.get(`${API}/admin/products`)
  const { data } = (await list.json()) as {
    data: { id: string; name: string }[]
  }
  const created = data.find((product) => product.name === 'Spidol Admin E2E')
  expect(created).toBeDefined()
  const deactivated = await page.request.patch(
    `${API}/admin/products/${created?.id}`,
    {
      headers: { 'X-CSRF-Token': token },
      data: { isActive: false },
    },
  )
  expect(deactivated.status()).toBe(200)
  const restored = await page.request.patch(`${API}/admin/settings`, {
    headers: { 'X-CSRF-Token': token },
    data: { socialLinks: {} },
  })
  expect(restored.status()).toBe(200)
  await page.goto('/atk')
  await expect(
    page.getByRole('heading', { name: 'Spidol Admin E2E' }),
  ).toHaveCount(0)
})

test('Admin pages fit small screens', async ({ page }) => {
  await adminLogin(page)
  await expect(
    page.getByRole('navigation', { name: 'Navigasi admin' }),
  ).toBeVisible()
  await page.setViewportSize({ width: 360, height: 800 })
  for (const path of [
    '/admin',
    '/admin/orders',
    '/admin/products',
    '/admin/services',
    '/admin/locations',
    '/admin/settings',
  ]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    )
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
