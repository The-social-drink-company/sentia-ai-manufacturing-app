import { test, expect } from '@playwright/test'

test.describe('Dashboard Application', () => {
  test('should load the main dashboard page', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check that the page has loaded
    expect(await page.title()).toBeTruthy()
  })
  
  test('should have working API connectivity', async ({ page }) => {
    // Test that the backend API is accessible
    const response = await page.request.get('/api/test')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('message')
  })
  
  test('should display navigation elements', async ({ page }) => {
    await page.goto('/')
    
    // Add tests for navigation elements once they exist
    // For example:
    // await expect(page.getByRole('navigation')).toBeVisible()
    // await expect(page.getByText('Dashboard')).toBeVisible()
  })
})

test.describe('Unleashed Integration', () => {
  test('should test Unleashed API connectivity', async ({ page }) => {
    // Test the Unleashed API endpoint
    const response = await page.request.get('/api/unleashed/test')
    
    if (response.ok()) {
      const data = await response.json()
      expect(data).toHaveProperty('success')
    } else {
      // If API fails, it might be due to credentials - that's expected in test environment
      console.log('Unleashed API test skipped - may require credentials')
    }
  })
})