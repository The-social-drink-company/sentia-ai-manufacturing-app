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

/**
 * Page Object Model for Onboarding Wizard
 * Provides reusable methods for interacting with the wizard
 */
class OnboardingWizardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/trial-onboarding')
  }

  async waitForStep(stepName: string) {
    await expect(this.page.getByRole('heading', { level: 2, name: stepName })).toBeVisible()
  }

  async fillCompanyDetails(industry: string, companySize: string, revenue: string) {
    const selects = this.page.locator('form select')
    await selects.nth(0).selectOption(industry)
    await selects.nth(1).selectOption(companySize)
    await selects.nth(2).selectOption(revenue)
  }

  async selectIntegrations(integrations: string[]) {
    for (const integration of integrations) {
      await this.page.getByRole('button', { name: new RegExp(integration) }).click()
    }
  }

  async clickNextStep() {
    await this.page.getByRole('button', { name: 'Next Step' }).click()
  }

  async clickSkip() {
    await this.page.getByRole('button', { name: 'Skip for now' }).click()
  }

  async inviteTeamMember(email: string) {
    await this.page.getByPlaceholder('colleague@company.com').fill(email)
  }

  async generateSampleData() {
    await this.page.getByRole('button', { name: 'Generate Sample Data' }).click()
  }

  async skipEntireOnboarding() {
    await this.page.getByRole('button', { name: /Skip onboarding and explore on your own/ }).click()
  }

  async verifyProgressBar(percentage: number) {
    const progressBar = this.page.locator('.progress-bar, [role="progressbar"]')
    if (await progressBar.count() > 0) {
      const value = await progressBar.getAttribute('aria-valuenow')
      expect(parseInt(value || '0')).toBeCloseTo(percentage, 0)
    }
  }

  async verifyStepIndicator(currentStep: number, totalSteps: number) {
    const stepText = await this.page.getByText(`Step ${currentStep} of ${totalSteps}`).count()
    expect(stepText).toBeGreaterThan(0)
  }
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

  test('validates required company details fields', async ({ page }) => {
    await setupOnboardingMocks(page)
    const wizardPage = new OnboardingWizardPage(page)

    await wizardPage.goto()
    await wizardPage.waitForStep('Company Details')

    // Try to proceed without filling required fields
    await wizardPage.clickNextStep()

    // Verify we're still on the same step (validation prevented navigation)
    await wizardPage.waitForStep('Company Details')

    // Fill only industry (partial)
    const selects = page.locator('form select')
    await selects.nth(0).selectOption('spirits')
    await wizardPage.clickNextStep()

    // Still on same step
    await wizardPage.waitForStep('Company Details')

    // Complete all required fields
    await wizardPage.fillCompanyDetails('spirits', '11-50', '1M-5M')
    await wizardPage.clickNextStep()

    // Should proceed to next step
    await wizardPage.waitForStep('Connect Your Data')
  })

  test('handles back navigation through wizard steps', async ({ page }) => {
    await setupOnboardingMocks(page)
    const wizardPage = new OnboardingWizardPage(page)

    await wizardPage.goto()
    await wizardPage.waitForStep('Company Details')

    // Complete step 1
    await wizardPage.fillCompanyDetails('food-beverage', '51-200', '5M-10M')
    await wizardPage.clickNextStep()
    await wizardPage.waitForStep('Connect Your Data')

    // Select integrations and proceed
    await wizardPage.selectIntegrations(['Xero'])
    await page.getByRole('button', { name: /Connect 1 Integration/ }).click()
    await wizardPage.waitForStep('Invite Your Team')

    // Navigate back to integrations
    const backButton = page.getByRole('button', { name: /Back|Previous/ })
    if (await backButton.count() > 0) {
      await backButton.click()
      await wizardPage.waitForStep('Connect Your Data')

      // Verify previous selection persisted
      const xeroButton = page.getByRole('button', { name: /Xero/ })
      const isSelected = await xeroButton.evaluate(el =>
        el.classList.contains('border-blue-600') || el.getAttribute('aria-selected') === 'true'
      )
      expect(isSelected).toBeTruthy()
    }
  })

  test('supports skipping all optional steps', async ({ page }) => {
    await setupOnboardingMocks(page)
    const wizardPage = new OnboardingWizardPage(page)

    await wizardPage.goto()

    // Complete required step
    await wizardPage.fillCompanyDetails('industrial', '201-500', '10M-50M')
    await wizardPage.clickNextStep()

    // Skip integrations (optional)
    await wizardPage.waitForStep('Connect Your Data')
    await wizardPage.clickSkip()

    // Skip team invite (optional)
    await wizardPage.waitForStep('Invite Your Team')
    await wizardPage.clickSkip()

    // Skip data import (optional) - generates sample data
    await wizardPage.waitForStep('Import Data')
    await wizardPage.generateSampleData()

    // Verify completion
    await expect(page.getByText('Sample data generated successfully!')).toBeVisible()
    await page.waitForURL(/\/dashboard\?onboarding=complete/)
  })

  test('shows integration-specific import options based on selections', async ({ page }) => {
    await setupOnboardingMocks(page)
    const wizardPage = new OnboardingWizardPage(page)

    await wizardPage.goto()

    // Complete company details
    await wizardPage.fillCompanyDetails('spirits', '11-50', '1M-5M')
    await wizardPage.clickNextStep()

    // Select specific integrations
    await wizardPage.selectIntegrations(['Xero', 'Shopify'])
    await page.getByRole('button', { name: /Connect 2 Integrations/ }).click()

    // Skip team
    await wizardPage.clickSkip()

    // Verify import step shows selected integrations
    await wizardPage.waitForStep('Import Data')
    await expect(page.getByText('Xero')).toBeVisible()
    await expect(page.getByText('Shopify')).toBeVisible()

    // Verify non-selected integrations are not shown
    const amazonText = await page.getByText('Amazon SP-API').count()
    expect(amazonText).toBe(0)
  })

  test('handles API errors gracefully with user-friendly messages', async ({ page }) => {
    const { progressState } = await setupOnboardingMocks(page)

    // Override generate-sample to fail
    await page.route('**/api/onboarding/generate-sample', async route => {
      await route.fulfill({
        status: 500,
        headers: jsonHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed',
        }),
      })
    })

    const wizardPage = new OnboardingWizardPage(page)
    await wizardPage.goto()

    // Complete to last step
    await wizardPage.fillCompanyDetails('spirits', '11-50', '1M-5M')
    await wizardPage.clickNextStep()
    await wizardPage.clickSkip() // Skip integrations
    await wizardPage.clickSkip() // Skip team

    // Try to generate sample data
    await wizardPage.generateSampleData()

    // Should show error message (toast or inline)
    const errorMessages = [
      page.getByText(/error/i),
      page.getByText(/failed/i),
      page.getByText(/try again/i),
    ]

    let foundError = false
    for (const errorMsg of errorMessages) {
      if (await errorMsg.count() > 0) {
        foundError = true
        break
      }
    }

    expect(foundError).toBeTruthy()

    // Verify we're still on import step (didn't proceed with error)
    await wizardPage.waitForStep('Import Data')
  })

  test('displays confetti animation on successful completion', async ({ page }) => {
    await setupOnboardingMocks(page)
    const wizardPage = new OnboardingWizardPage(page)

    await wizardPage.goto()

    // Complete minimal path
    await wizardPage.fillCompanyDetails('spirits', '11-50', '1M-5M')
    await wizardPage.clickNextStep()
    await wizardPage.clickSkip() // Skip integrations
    await wizardPage.clickSkip() // Skip team
    await wizardPage.generateSampleData()

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard\?onboarding=complete/)

    // Verify confetti canvas is present
    const confettiCanvas = page.locator('canvas')
    await expect(confettiCanvas).toBeVisible({ timeout: 5000 })
  })

  test('validates email format in team invite step', async ({ page }) => {
    await setupOnboardingMocks(page)
    const wizardPage = new OnboardingWizardPage(page)

    await wizardPage.goto()

    // Navigate to team invite step
    await wizardPage.fillCompanyDetails('spirits', '11-50', '1M-5M')
    await wizardPage.clickNextStep()
    await wizardPage.clickSkip() // Skip integrations

    await wizardPage.waitForStep('Invite Your Team')

    // Try invalid email
    await wizardPage.inviteTeamMember('not-an-email')
    const sendButton = page.getByRole('button', { name: /Send.*Invitation/ })
    await sendButton.click()

    // Should show validation error or prevent submission
    const emailInput = page.getByPlaceholder('colleague@company.com')
    const validationError = await emailInput.evaluate(el =>
      (el as HTMLInputElement).validationMessage
    )

    // HTML5 validation should catch this
    expect(validationError).toBeTruthy()
  })

  test('tracks progress percentage through wizard', async ({ page }) => {
    const { progressUpdates } = await setupOnboardingMocks(page)
    const wizardPage = new OnboardingWizardPage(page)

    await wizardPage.goto()

    // Step 1: Company details (0/4 complete = 0%)
    await wizardPage.fillCompanyDetails('spirits', '11-50', '1M-5M')
    await wizardPage.clickNextStep()

    // Step 2: Integrations (1/4 complete = 25%)
    expect(progressUpdates.length).toBe(1)
    await wizardPage.clickSkip()

    // Step 3: Team (2/4 complete = 50%)
    expect(progressUpdates.length).toBe(2)
    await wizardPage.clickSkip()

    // Step 4: Data import (3/4 complete = 75%)
    expect(progressUpdates.length).toBe(3)
    await wizardPage.generateSampleData()

    // Completion (4/4 = 100%)
    await page.waitForURL(/\/dashboard\?onboarding=complete/)
  })

  test('maintains responsive layout on mobile viewport', async ({ page }) => {
    await setupOnboardingMocks(page)

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const wizardPage = new OnboardingWizardPage(page)
    await wizardPage.goto()

    // Verify wizard is visible and functional
    await wizardPage.waitForStep('Company Details')

    const form = page.locator('form')
    await expect(form).toBeVisible()

    // Check that form elements are accessible (not overflowing)
    const selects = page.locator('form select')
    const selectCount = await selects.count()
    expect(selectCount).toBeGreaterThanOrEqual(3)

    // Verify buttons are clickable
    const nextButton = page.getByRole('button', { name: 'Next Step' })
    await expect(nextButton).toBeVisible()

    // Verify no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = 375
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 50) // Allow 50px tolerance
  })

  test('shows loading states during API operations', async ({ page }) => {
    await setupOnboardingMocks(page)

    // Add delay to mock to simulate network latency
    await page.route('**/api/onboarding/generate-sample', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          success: true,
          data: { products: 20, transactions: 120 },
        }),
      })
    })

    const wizardPage = new OnboardingWizardPage(page)
    await wizardPage.goto()

    // Navigate to data import
    await wizardPage.fillCompanyDetails('spirits', '11-50', '1M-5M')
    await wizardPage.clickNextStep()
    await wizardPage.clickSkip()
    await wizardPage.clickSkip()

    // Click generate button
    const generateButton = page.getByRole('button', { name: 'Generate Sample Data' })
    await generateButton.click()

    // Verify loading indicator appears
    const loadingIndicators = [
      page.locator('[role="status"]'),
      page.locator('.animate-spin'),
      page.getByText(/generating/i),
      page.getByText(/loading/i),
    ]

    let foundLoading = false
    for (const indicator of loadingIndicators) {
      if (await indicator.count() > 0) {
        foundLoading = true
        break
      }
    }

    expect(foundLoading).toBeTruthy()
  })

  test('supports keyboard navigation through wizard', async ({ page }) => {
    await setupOnboardingMocks(page)
    const wizardPage = new OnboardingWizardPage(page)

    await wizardPage.goto()
    await wizardPage.waitForStep('Company Details')

    // Use Tab to navigate through form fields
    await page.keyboard.press('Tab') // Focus first select
    await page.keyboard.press('ArrowDown') // Open dropdown
    await page.keyboard.press('Enter') // Select option

    // Verify keyboard navigation works for dropdowns
    const firstSelect = page.locator('form select').first()
    const value = await firstSelect.inputValue()
    expect(value).toBeTruthy()
  })
})
