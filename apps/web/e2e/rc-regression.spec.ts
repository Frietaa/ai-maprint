import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from '@playwright/test'

// Release-candidate accessibility and responsive regression (TASK-09.05):
// public, member and Admin routes at 360/768/1280 px — no horizontal
// overflow, exactly one h1, a main landmark, named form controls, buttons
// and links, images with alt text — plus keyboard focus visibility and
// reduced motion. Practical checks, not a formal WCAG audit. Runs on the
// LOCAL TEST database with E2E fixtures; teardown removes everything.

const API = 'http://localhost:3199/api/v1'
const WIDTHS = [360, 768, 1280]
const PUBLIC = [
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

async function csrf(request: APIRequestContext): Promise<string> {
  const response = await request.get(`${API}/auth/csrf`)
  return ((await response.json()) as { data: { csrfToken: string } }).data
    .csrfToken
}

interface PageReport {
  overflow: number
  h1: number
  mains: number
  unnamedControls: string[]
  unnamedButtons: string[]
  imagesWithoutAlt: number
}

async function audit(page: Page): Promise<PageReport> {
  return page.evaluate(() => {
    const visible = (element: Element) => {
      const box = (element as HTMLElement).getBoundingClientRect()
      const style = getComputedStyle(element)
      return (
        box.width > 0 &&
        box.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none'
      )
    }
    const named = (element: Element) =>
      Boolean(
        element.getAttribute('aria-label')?.trim() ||
        element.getAttribute('aria-labelledby') ||
        element.getAttribute('title')?.trim() ||
        (element as HTMLInputElement).labels?.length ||
        element.textContent?.trim(),
      )
    const controls = [
      ...document.querySelectorAll('input, select, textarea'),
    ].filter(
      (element) =>
        (element as HTMLInputElement).type !== 'hidden' && visible(element),
    )
    const buttons = [...document.querySelectorAll('button, a[href]')].filter(
      visible,
    )
    return {
      overflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      h1: document.querySelectorAll('h1').length,
      mains: document.querySelectorAll('main').length,
      unnamedControls: controls
        .filter((element) => !named(element))
        .map((element) => element.outerHTML.slice(0, 80)),
      unnamedButtons: buttons
        .filter((element) => !named(element))
        .map((element) => element.outerHTML.slice(0, 80)),
      imagesWithoutAlt: [...document.querySelectorAll('img')].filter(
        (image) => !image.hasAttribute('alt'),
      ).length,
    }
  })
}

async function expectAccessible(page: Page, route: string, width: number) {
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  const report = await audit(page)
  const where = `${route} at ${width}px`
  expect(report.overflow, `${where}: horizontal overflow`).toBeLessThanOrEqual(
    0,
  )
  expect(report.h1, `${where}: h1 count`).toBe(1)
  expect(report.mains, `${where}: main landmark`).toBe(1)
  expect(report.unnamedControls, `${where}: unnamed controls`).toStrictEqual([])
  expect(
    report.unnamedButtons,
    `${where}: unnamed buttons/links`,
  ).toStrictEqual([])
  expect(report.imagesWithoutAlt, `${where}: images without alt`).toBe(0)
}

test('public pages are accessible and fit every width', async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of PUBLIC) {
      await page.goto(route)
      await expectAccessible(page, route, width)
    }
  }
})

test('member pages are accessible and fit every width', async ({ page }) => {
  const email = `rc-member-${Date.now()}@e2e.test.invalid`
  const registered = await page.request.post(`${API}/auth/register`, {
    headers: { 'X-CSRF-Token': await csrf(page.request) },
    data: { name: 'Member RC', email, password: 'e2e member password' },
  })
  expect(registered.status()).toBe(201)
  const products = (await (
    await page.request.get(`${API}/products`)
  ).json()) as {
    data: { id: string; availability: string }[]
  }
  const product = products.data.find((p) => p.availability === 'AVAILABLE')
  const order = await page.request.post(`${API}/orders`, {
    headers: { 'X-CSRF-Token': await csrf(page.request) },
    data: {
      type: 'ATK',
      customerName: 'Member RC',
      customerWhatsapp: '0812-0000-4545',
      items: [{ productId: product?.id, quantity: 1 }],
    },
  })
  expect(order.status()).toBe(201)
  const { publicId } = ((await order.json()) as { data: { publicId: string } })
    .data

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [
      '/account',
      '/account/orders',
      `/account/orders/${publicId}`,
    ]) {
      await page.goto(route)
      await expectAccessible(page, route, width)
    }
  }
})

test('Admin pages are accessible and fit every width', async ({ page }) => {
  const login = await page.request.post(`${API}/auth/login`, {
    headers: { 'X-CSRF-Token': await csrf(page.request) },
    data: { email: 'admin@e2e.test.invalid', password: 'e2e admin password' },
  })
  expect(login.status()).toBe(200)
  const order = await page.request.post(`${API}/orders`, {
    headers: { 'X-CSRF-Token': await csrf(page.request) },
    data: {
      type: 'PRINTING',
      customerName: 'Pelanggan RC',
      customerWhatsapp: '0812-0000-4646',
      requestedCompletionAt: new Date(
        Date.now() + 3 * 86_400_000,
      ).toISOString(),
      description: 'Uji aksesibilitas Admin',
    },
  })
  expect(order.status()).toBe(201)
  const { publicId } = ((await order.json()) as { data: { publicId: string } })
    .data

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [
      '/admin',
      '/admin/orders',
      `/admin/orders/${publicId}`,
      '/admin/products',
      '/admin/services',
      '/admin/locations',
      '/admin/settings',
    ]) {
      await page.goto(route)
      await expectAccessible(page, route, width)
    }
  }
})

test('keyboard focus is visible, starting with the skip link', async ({
  page,
}) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Langsung ke konten utama' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  for (let index = 0; index < 4; index += 1) {
    await page.keyboard.press('Tab')
    const indicator = await page.evaluate(() => {
      const element = document.activeElement
      if (!element || element === document.body) return 'none'
      const style = getComputedStyle(element)
      return style.outlineStyle !== 'none' && style.outlineWidth !== '0px'
        ? 'outline'
        : style.boxShadow !== 'none'
          ? 'shadow'
          : 'none'
    })
    expect(indicator).not.toBe('none')
  }
})

test('reduced motion disables animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/atk')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const animated = await page.evaluate(
    () =>
      [...document.querySelectorAll('*')].filter((element) => {
        const style = getComputedStyle(element)
        return (
          style.animationName !== 'none' &&
          Number.parseFloat(style.animationDuration) > 0.01
        )
      }).length,
  )
  expect(animated).toBe(0)
})
