import { expect, test } from '@playwright/test'

const VIN = '1HGCM82633A004352'

test('searching a VIN shows documents from both sources', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('VIN').fill(VIN)
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page.getByText('Vehicle Purchase Agreement')).toBeVisible()
  await expect(page.getByText('10,000 km Service')).toBeVisible()
  await expect(page.getByText('Sales').first()).toBeVisible()
  await expect(page.getByText('Service').first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('a VIN with no documents shows the empty state', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('VIN').fill('3VWFE21C04M000001')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page.getByText('No documents found for 3VWFE21C04M000001')).toBeVisible()
})

test('a malformed VIN is blocked before any request', async ({ page }) => {
  let requests = 0
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/vehicles')) {
      requests += 1
    }
  })

  await page.goto('/')
  await page.getByLabel('VIN').fill('NOT-A-VIN')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page.getByText(/17-character VIN/)).toBeVisible()
  expect(requests).toBe(0)
})
