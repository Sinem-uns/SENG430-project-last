import { test, expect } from '@playwright/test'

test.describe('HEALTH-AI Journey', () => {
  test('page loads with title and stepper', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('HEALTH-AI')).toBeVisible()
    await expect(page.getByText('Clinical Context')).toBeVisible()
    await expect(page.getByText('Data Exploration')).toBeVisible()
  })

  test('can select a specialty', async ({ page }) => {
    await page.goto('/')
    // Click domain selector
    await page.getByRole('button', { name: /select specialty/i }).click()
    // Pick Cardiology
    await page.getByText('Heart Failure').first().click()
    // Domain is now shown
    await expect(page.getByText(/cardiology/i).first()).toBeVisible()
  })

  test('Step 1 shows clinical context after domain selected', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /select specialty/i }).click()
    await page.getByText('Heart Failure').first().click()
    await expect(page.getByText(/30-day/i)).toBeVisible()
    await expect(page.getByText(/next/i).first()).toBeVisible()
  })

  test('Step 2 loads built-in dataset', async ({ page }) => {
    await page.goto('/')
    // Select cardiology
    await page.getByRole('button', { name: /select specialty/i }).click()
    await page.getByText('Heart Failure').first().click()
    // Go to step 2
    await page.getByRole('button', { name: /next/i }).first().click()
    // Load built-in data
    await page.getByText(/use built-in/i).first().click()
    // Should show data table
    await expect(page.getByText(/rows/i)).toBeVisible({ timeout: 10000 })
  })

  test('locked steps cannot be navigated to', async ({ page }) => {
    await page.goto('/')
    // Step 3 stepper item should appear disabled/locked
    const step3 = page.getByText('Data Prep')
    await expect(step3.locator('xpath=ancestor::*[1]')).toHaveAttribute('aria-disabled', 'true')
  })

  test('help modal opens and shows glossary', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /help/i }).click()
    await expect(page.getByText('Sensitivity')).toBeVisible()
    await expect(page.getByText('Confusion Matrix')).toBeVisible()
  })

  test('reset button with confirmation', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /select specialty/i }).click()
    await page.getByText('Heart Failure').first().click()
    await page.getByRole('button', { name: /reset/i }).click()
    // Confirmation dialog appears
    await expect(page.getByText(/are you sure/i)).toBeVisible()
    await page.getByRole('button', { name: /confirm|yes/i }).first().click()
    // Back to initial state
    await expect(page.getByRole('button', { name: /select specialty/i })).toBeVisible()
  })
})
