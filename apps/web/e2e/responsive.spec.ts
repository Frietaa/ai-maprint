import { expect, test } from '@playwright/test'

const routes = [
  '/',
  '/printing',
  '/atk',
  '/laptop-service',
  '/software-installation',
  '/locations',
  '/halaman-tidak-ada',
]

// Representative mobile, tablet and desktop widths.
for (const width of [360, 768, 1280]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const route of routes) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      )
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(0)
    }
  })
}

test('mobile menu is keyboard operable', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')

  const toggle = page.getByRole('button', { name: 'Menu' })
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')

  const mobileNav = page.getByRole('navigation', {
    name: 'Navigasi utama (seluler)',
  })
  await mobileNav.getByRole('link', { name: 'Lokasi' }).focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/locations$/)
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})

test('unknown routes show the NotFound page', async ({ page }) => {
  await page.goto('/tidak-ada')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Halaman tidak ditemukan' }),
  ).toBeVisible()
  await expect(page).toHaveTitle(/^Halaman tidak ditemukan \| /)
})
