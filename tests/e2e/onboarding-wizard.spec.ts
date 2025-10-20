import { expect, test, Page } from '@playwright/test'

type ProgressSnapshot = {
  currentStep: number
  completedSteps: string[]
  data: Record<string, unknown>
  isComplete: boolean
  skipped: boolean
}

const jsonHeaders = { 'content-type': 'application/json' }

async function setupOnboardingMocks(page: Page) {
  const progressState: ProgressSnapshot = {
    currentStep: 0,
    completedSteps: [],
    data: {},
    isComplete: false,
    skipped: false,
  }

  const progressUpdates: Array<{ currentStep: number; completedSteps: string[] }> = []

  await page.route('**/api/onboarding/progress', async route => {
    const request = route.request()

    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ success: true, ...progressState }),
      })
      return
    }

    if (request.method() === 'POST') {
      const payload = await request.postDataJSON()
      progressState.currentStep = payload.currentStep
      progressState.completedSteps = payload.completedSteps
      progressState.data = { ...progressState.data, ...payload.data }
      progressUpdates.push({ currentStep: payload.currentStep, completedSteps: payload.completedSteps })

      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          success: true,
          progress: {
            currentStep: progressState.currentStep,
            completedSteps: progressState.completedSteps,
          },
        }),
      })
      return
    }

    await route.fallback()
  })

  await page.route('**/api/onboarding/generate-sample', async route => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        success: true,
        data: {
          products: 20,
          transactions: 120,
        },
      }),
    })
  })

  await page.route('**/api/onboarding/complete', async route => {
    progressState.isComplete = true
    const payload = await route.request().postDataJSON()
    progressState.data = { ...progressState.data, ...payload }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Onboarding completed successfully',
        redirectUrl: '/dashboard?onboarding=complete&tour=auto',
      }),
    })
  })

  await page.route('**/api/onboarding/skip', async route => {
    progressState.skipped = true
    progressState.isComplete = true

    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ success: true, message: 'Onboarding skipped' }),
    })
  })

  return { progressState, progressUpdates }
}

test.describe('@onboarding Trial Onboarding Wizard', () => {
  test('completes onboarding and triggers dashboard celebration', async ({ page }) => {
    const { progressUpdates } = await setupOnboardingMocks(page)

    await page.goto('/trial-onboarding')

    await expect(page.getByRole('heading', { level: 2, name: 'Company Details' })).toBeVisible()

    const selects = page.locator('form select')
    await selects.nth(0).selectOption('food-beverage')
    await selects.nth(1).selectOption('11-50')
    await selects.nth(2).selectOption('1M-5M')

    await page.getByRole('button', { name: 'Next Step' }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Connect Your Data' })).toBeVisible()
    await page.getByRole('button', { name: /Xero/ }).click()
    await page.getByRole('button', { name: /Shopify/ }).click()
    await page.getByRole('button', { name: /Connect 2 Integrations/ }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Invite Your Team' })).toBeVisible()
    await page.getByPlaceholder('colleague@company.com').fill('team@sentia.test')
    await page.getByRole('button', { name: /Send 1 Invitation/ }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Import Data' })).toBeVisible()
    await page.getByRole('button', { name: 'Generate Sample Data' }).click()

    await expect(page.getByText('Sample data generated successfully!')).toBeVisible()
    await expect(page.getByText('Onboarding complete! Redirecting to your dashboard...')).toBeVisible()

    await expect(page).toHaveURL(/\/dashboard\?onboarding=complete&tour=auto$/)
    await expect(page.locator('canvas')).toBeVisible()

    const stepValues = progressUpdates.map(update => update.currentStep)
    expect(stepValues).toEqual([1, 2, 3])
    expect(stepValues.every(step => step <= 3)).toBeTruthy()
  })

  test('persists progress across refresh and retains integration options', async ({ page }) => {
    const { progressState } = await setupOnboardingMocks(page)

    await page.goto('/trial-onboarding')

    const selects = page.locator('form select')
    await selects.nth(0).selectOption('spirits')
    await selects.nth(1).selectOption('51-200')
    await selects.nth(2).selectOption('5M-10M')
    await page.getByRole('button', { name: 'Next Step' }).click()

    await page.getByRole('button', { name: /Xero/ }).click()
    await page.getByRole('button', { name: /Amazon/ }).click()
    await page.getByRole('button', { name: /Connect 2 Integrations/ }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Invite Your Team' })).toBeVisible()

    await page.reload()

    await expect(page.getByRole('heading', { level: 2, name: 'Invite Your Team' })).toBeVisible()
    expect(progressState.currentStep).toBe(2)

    await page.getByRole('button', { name: 'Skip for now' }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Import Data' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'Import from Integrations' })).toBeVisible()
    await expect(page.getByText('Amazon SP-API')).toBeVisible()
    await expect(page.getByText('Xero')).toBeVisible()
  })

  test('handles skip flow and prevents returning to wizard', async ({ page }) => {
    const { progressState } = await setupOnboardingMocks(page)

    await page.goto('/trial-onboarding')

    await page.getByRole('button', { name: /Skip onboarding and explore on your own/ }).click()

    await expect(page.getByText('Onboarding skipped. Redirecting to dashboard...')).toBeVisible()
    await page.waitForURL('**/dashboard')
    expect(new URL(page.url()).search).toBe('')

    progressState.skipped = true
    progressState.isComplete = true

    await page.goto('/trial-onboarding')

    await page.waitForURL('**/dashboard')
    expect(new URL(page.url()).search).toBe('')
  })
})
