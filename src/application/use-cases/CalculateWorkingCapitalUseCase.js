/**
 * Calculate Working Capital Use Case
 * Orchestrates the working capital calculation business logic
 */

import { WorkingCapital } from '../../domain/entities/WorkingCapital';

export class CalculateWorkingCapitalUseCase {
  constructor(workingCapitalRepository, auditService) {
    this.workingCapitalRepository = workingCapitalRepository;
    this.auditService = auditService;
  }

  /**
   * Execute the use case
   * @param {Object} request - Request DTO
   * @returns {Promise<Object>} Response DTO
   */
  async execute(request) {
    try {
      // Validate input
      this.validateRequest(request);

      // Create domain entity
      const workingCapital = new WorkingCapital({
        currentAssets: request.currentAssets,
        currentLiabilities: request.currentLiabilities,
        inventory: request.inventory,
        accountsReceivable: request.accountsReceivable,
        accountsPayable: request.accountsPayable,
        cash: request.cash
      });

      // Calculate metrics
      const calculatedValue = workingCapital.calculate();
      const currentRatio = workingCapital.getCurrentRatio();
      const quickRatio = workingCapital.getQuickRatio();
      const healthStatus = workingCapital.getHealthStatus();
      const recommendations = workingCapital.getRecommendations();

      // Save to repository
      const saved = await this.workingCapitalRepository.save({
        companyId: request.companyId,
        periodId: request.periodId,
        value: calculatedValue,
        currentRatio,
        quickRatio,
        healthStatus,
        timestamp: new Date()
      });

      // Audit the calculation
      await this.auditService.log({
        action: 'WORKING_CAPITAL_CALCULATED',
        userId: request.userId,
        companyId: request.companyId,
        details: {
          value: calculatedValue,
          currentRatio,
          quickRatio
        }
      });

      // Return response DTO
      return {
        success: true,
        data: {
          id: saved.id,
          value: calculatedValue,
          currentRatio,
          quickRatio,
          healthStatus,
          recommendations,
          cashConversionCycle: request.daysInventoryOutstanding
            ? workingCapital.getCashConversionCycle(
                request.daysInventoryOutstanding,
                request.daysSalesOutstanding,
                request.daysPayableOutstanding
              )
            : null
        }
      };
    } catch (error) {
      // Handle errors
      await this.auditService.log({
        action: 'WORKING_CAPITAL_CALCULATION_FAILED',
        userId: request.userId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate request
   * @param {Object} request
   * @throws {Error}
   */
  validateRequest(request) {
    if (!request.currentAssets || request.currentAssets < 0) {
      throw new Error('Invalid current assets value');
    }

    if (!request.currentLiabilities || request.currentLiabilities < 0) {
      throw new Error('Invalid current liabilities value');
    }

    if (request.currentLiabilities === 0) {
      throw new Error('Current liabilities cannot be zero');
    }

    if (!request.companyId) {
      throw new Error('Company ID is required');
    }

    if (!request.userId) {
      throw new Error('User ID is required');
    }
  }
}