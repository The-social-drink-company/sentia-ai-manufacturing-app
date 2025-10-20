/**
 * Onboarding Service
 *
 * API service layer for trial user onboarding flow.
 * Handles progress tracking, data persistence, and sample data generation.
 *
 * @module src/services/onboardingService
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class OnboardingService {
  constructor() {
    this.apiBaseUrl = `${API_BASE_URL}/onboarding`
  }

  /**
   * Helper method for API calls with error handling
   * @private
   */
  async fetchWithAuth(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || `API Error: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('[OnboardingService] API Call Failed:', error)
      throw error
    }
  }

  /**
   * Fetch current onboarding progress
   * @param {string} tenantId - Optional tenant ID (defaults to current user)
   * @returns {Promise<Object>} Progress data
   */
  async fetchProgress(tenantId = null) {
    const url = tenantId
      ? `${this.apiBaseUrl}/progress?tenantId=${tenantId}`
      : `${this.apiBaseUrl}/progress`

    return this.fetchWithAuth(url)
  }

  /**
   * Save onboarding progress for current step
   * @param {number} currentStep - Current step index (0-3)
   * @param {string[]} completedSteps - Array of completed step IDs
   * @param {Object} data - Step data (company, integrations, team, import)
   * @param {string} tenantId - Optional tenant ID
   * @returns {Promise<Object>} Save result
   */
  async saveProgress(currentStep, completedSteps, data, tenantId = null) {
    const url = tenantId
      ? `${this.apiBaseUrl}/progress?tenantId=${tenantId}`
      : `${this.apiBaseUrl}/progress`

    return this.fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({
        currentStep,
        completedSteps,
        data,
      }),
    })
  }

  /**
   * Mark onboarding as complete
   * @param {Object} onboardingData - Complete onboarding data
   * @param {string} tenantId - Optional tenant ID
   * @returns {Promise<Object>} Completion result with redirect URL
   */
  async completeOnboarding(onboardingData, tenantId = null) {
    const url = tenantId
      ? `${this.apiBaseUrl}/complete?tenantId=${tenantId}`
      : `${this.apiBaseUrl}/complete`

    return this.fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(onboardingData),
    })
  }

  /**
   * Generate sample data for trial users
   * @param {string} tenantId - Optional tenant ID
   * @returns {Promise<Object>} Generation result
   */
  async generateSampleData(tenantId = null) {
    const url = tenantId
      ? `${this.apiBaseUrl}/generate-sample?tenantId=${tenantId}`
      : `${this.apiBaseUrl}/generate-sample`

    return this.fetchWithAuth(url, {
      method: 'POST',
    })
  }

  /**
   * Fetch onboarding checklist status
   * @param {string} tenantId - Optional tenant ID
   * @returns {Promise<Object>} Checklist status
   */
  async fetchChecklist(tenantId = null) {
    const url = tenantId
      ? `${this.apiBaseUrl}/checklist?tenantId=${tenantId}`
      : `${this.apiBaseUrl}/checklist`

    return this.fetchWithAuth(url)
  }

  /**
   * Skip onboarding entirely
   * @param {string} tenantId - Optional tenant ID
   * @returns {Promise<Object>} Skip result
   */
  async skipOnboarding(tenantId = null) {
    const url = tenantId
      ? `${this.apiBaseUrl}/skip?tenantId=${tenantId}`
      : `${this.apiBaseUrl}/skip`

    return this.fetchWithAuth(url, {
      method: 'PATCH',
    })
  }
}

// Create singleton instance
const onboardingService = new OnboardingService()

export default onboardingService
export { OnboardingService }
