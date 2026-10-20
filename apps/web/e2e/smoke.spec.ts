import { expect, test } from '@playwright/test'

test('public shell renders and navigates', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Navigasi utama' })
    .getByRole('link', { name: 'Lokasi' })
    .click()

  await expect(page).toHaveURL(/\/locations$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lokasi' }),
  ).toBeVisible()
})
