import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from '@playwright/test'

// Member authentication end to end: real browser, real API (port 3199) on
// the LOCAL TEST database with the PostgreSQL session store and a real
// HttpOnly session cookie. Accounts use the reserved e2e.test.invalid
// domain and are removed (with all sessions) by the global teardown.
//
// Google Sign-In is not exercised here: it needs a real Google account and
// interactive consent. Its server-side verification is covered by API
// integration tests (fake verifier) and the button by component tests.

const API = 'http://localhost:3199/api/v1'
const PASSWORD = 'e2e member password'

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test.invalid`
}

function banner(page: Page) {
  return page.getByRole('banner')
}

// Creates a member through the public API (CSRF token included).
async function registerViaApi(
  request: APIRequestContext,
  email: string,
  name: string,
): Promise<void> {
  const csrf = await request.get(`${API}/auth/csrf`)
  const { data } = (await csrf.json()) as { data: { csrfToken: string } }
  const response = await request.post(`${API}/auth/register`, {
    headers: { 'X-CSRF-Token': data.csrfToken },
    data: { name, email, password: PASSWORD },
  })
  expect(response.status()).toBe(201)
}

test('a visitor signs up, edits the profile, stays signed in and signs out', async ({
  page,
  context,
}) => {
  const email = uniqueEmail('signup')

  await page.goto('/')
  await banner(page).getByRole('link', { name: 'Daftar' }).click()
  await expect(page).toHaveURL(/\/signup$/)

  await page.getByLabel('Nama').fill('Member Uji E2E')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi').fill(PASSWORD)
  await page.getByRole('button', { name: 'Buat akun' }).click()

  // Signed in on the account page.
  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByText('Akun berhasil dibuat.')).toBeVisible()
  const profile = page.getByRole('region', { name: 'Profil' })
  await expect(profile).toContainText('Member Uji E2E')
  await expect(profile).toContainText(email)
  await expect(banner(page).getByRole('link', { name: 'Akun' })).toBeVisible()

  // The session lives in an HttpOnly, SameSite=Lax cookie only.
  const cookies = await context.cookies()
  const session = cookies.find((cookie) => cookie.name === 'maba.sid')
  expect(session?.httpOnly).toBe(true)
  expect(session?.sameSite).toBe('Lax')
  const storage = await page.evaluate(() =>
    JSON.stringify({ ...localStorage, ...sessionStorage }),
  )
  expect(storage).not.toMatch(/maba\.sid|csrf|password/i)
  expect(await page.evaluate(() => document.cookie)).not.toContain('maba.sid')

  // Edit the profile.
  await page.getByRole('button', { name: 'Ubah profil' }).click()
  await page.getByLabel('Nama').fill('Member Uji Diubah')
  await page.getByLabel('Nomor WhatsApp').fill('0812-0000-1111')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Profil berhasil diperbarui.')).toBeVisible()
  await expect(profile).toContainText('Member Uji Diubah')
  await expect(profile).toContainText('0812-0000-1111')

  // A reload keeps the server session (persisted in PostgreSQL).
  await page.reload()
  await expect(profile).toContainText('Member Uji Diubah')

  // Sign out: back to the public site, the account is protected again.
  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(banner(page).getByRole('link', { name: 'Masuk' })).toBeVisible()
  expect(
    (await context.cookies()).some((cookie) => cookie.name === 'maba.sid'),
  ).toBe(false)

  await page.goto('/account')
  await expect(page).toHaveURL(/\/login\?redirect=%2Faccount$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Masuk' }),
  ).toBeVisible()
})

test('a member signs in and out', async ({ page, playwright }) => {
  const email = uniqueEmail('login')
  const setup = await playwright.request.newContext()
  await registerViaApi(setup, email, 'Member Login E2E')
  await setup.dispose()

  // Protected page first: sign-in returns to it.
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login\?redirect=%2Faccount$/)
  await expect(
    page.getByText('Silakan masuk untuk membuka akun.'),
  ).toBeVisible()

  // Wrong password: one generic message.
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi').fill('not the password')
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'Email atau kata sandi tidak sesuai.',
  )

  await page.getByLabel('Kata sandi').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByRole('region', { name: 'Profil' })).toContainText(
    'Member Login E2E',
  )

  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page).toHaveURL(/\/$/)
  const me = await page.request.get(`${API}/auth/me`)
  expect(await me.json()).toStrictEqual({ data: null })
})

test('continue as guest creates no account and no session', async ({
  page,
  context,
}) => {
  const unsafe: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (request.method() !== 'GET' || url.includes('/auth/csrf')) {
      unsafe.push(`${request.method()} ${url}`)
    }
  })

  for (const path of ['/login', '/signup']) {
    await page.goto(path)
    await page.getByRole('link', { name: 'Lanjut sebagai tamu' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }

  expect(unsafe).toStrictEqual([])
  expect(
    (await context.cookies()).some((cookie) => cookie.name === 'maba.sid'),
  ).toBe(false)
})

test('state-changing requests without the CSRF token are refused', async ({
  page,
  playwright,
}) => {
  const email = uniqueEmail('csrf')
  const setup = await playwright.request.newContext()
  await registerViaApi(setup, email, 'Member CSRF E2E')
  await setup.dispose()

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi').fill(PASSWORD)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL(/\/account$/)

  // Same browser cookies, but no X-CSRF-Token: like a cross-site form post.
  const forged = await page.request.patch(`${API}/account/profile`, {
    data: { name: 'Diretas' },
  })
  expect(forged.status()).toBe(403)
  const logout = await page.request.post(`${API}/auth/logout`)
  expect(logout.status()).toBe(403)

  // Still signed in, profile unchanged.
  await page.reload()
  await expect(page.getByRole('region', { name: 'Profil' })).toContainText(
    'Member CSRF E2E',
  )
})
