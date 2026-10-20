import { expect, test } from '@playwright/test'

test('home page shows the foundation content', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('MABA PRINTING')
  await expect(
    page.getByRole('heading', { name: 'MABA PRINTING' }),
  ).toBeVisible()
})
