import { expect, test } from '@playwright/test'

// The production build under the website security-header policy: headers
// are present, hashed assets are immutable, and no page triggers a CSP
// violation or a console error while loading data from the API.

const ROUTES = [
  '/',
  '/printing',
  '/atk',
  '/laptop-service',
  '/software-installation',
  '/locations',
  '/track-order',
  '/login',
  '/signup',
  '/admin/login',
]

test('the website sends the security headers', async ({ request }) => {
  const page = await request.get('/')
  const headers = page.headers()
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['content-security-policy']).toContain(
    "connect-src 'self' http://localhost:3189",
  )
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups')
  expect(headers['cache-control']).toBe('no-cache')

  const html = await page.text()
  const script = /src="(\/assets\/[^"]+\.js)"/.exec(html)?.[1]
  expect(script).toBeTruthy()
  const asset = await request.get(script ?? '')
  expect(asset.headers()['cache-control']).toBe(
    'public, max-age=31536000, immutable',
  )
})

test('pages load under the CSP without violations or console errors', async ({
  page,
}) => {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text())
  })
  page.on('pageerror', (error) => problems.push(error.message))
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.error(
        `CSP violation: ${event.violatedDirective} ${event.blockedURI}`,
      )
    })
  })

  for (const route of ROUTES) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  }
  // Data really arrived cross-origin through connect-src.
  await page.goto('/atk')
  await expect(page.getByRole('heading', { name: 'Pulpen Uji' })).toBeVisible()
  expect(problems).toStrictEqual([])
})
