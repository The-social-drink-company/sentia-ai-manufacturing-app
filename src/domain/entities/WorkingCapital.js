/**
 * Working Capital Entity
 * Core business logic for working capital calculations
 */

export class WorkingCapital {
  constructor({
    currentAssets,
    currentLiabilities,
    inventory,
    accountsReceivable,
    accountsPayable,
    cash
  }) {
    this.currentAssets = currentAssets;
    this.currentLiabilities = currentLiabilities;
    this.inventory = inventory;
    this.accountsReceivable = accountsReceivable;
    this.accountsPayable = accountsPayable;
    this.cash = cash;
  }

  /**
   * Calculate working capital
   * @returns {number} Working capital value
   */
  calculate() {
    return this.currentAssets - this.currentLiabilities;
  }

  /**
   * Calculate quick ratio
   * @returns {number} Quick ratio
   */
  getQuickRatio() {
    return (this.currentAssets - this.inventory) / this.currentLiabilities;
  }

  /**
   * Calculate current ratio
   * @returns {number} Current ratio
   */
  getCurrentRatio() {
    return this.currentAssets / this.currentLiabilities;
  }

  /**
   * Calculate cash conversion cycle
   * @param {number} daysInventoryOutstanding
   * @param {number} daysSalesOutstanding
   * @param {number} daysPayableOutstanding
   * @returns {number} Cash conversion cycle in days
   */
  getCashConversionCycle(
    daysInventoryOutstanding,
    daysSalesOutstanding,
    daysPayableOutstanding
  ) {
    return daysInventoryOutstanding + daysSalesOutstanding - daysPayableOutstanding;
  }

  /**
   * Determine health status
   * @returns {string} Health status
   */
  getHealthStatus() {
    const ratio = this.getCurrentRatio();
    if (ratio >= 2) return 'excellent';
    if (ratio >= 1.5) return 'good';
    if (ratio >= 1) return 'adequate';
    return 'poor';
  }

  /**
   * Get recommendations
   * @returns {Array<string>} List of recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const currentRatio = this.getCurrentRatio();
    const quickRatio = this.getQuickRatio();

    if (currentRatio < 1.5) {
      recommendations.push('Consider improving collections to increase current assets');
    }

    if (quickRatio < 1) {
      recommendations.push('Quick ratio below 1 indicates potential liquidity issues');
    }

    if (this.inventory > this.accountsReceivable * 1.5) {
      recommendations.push('High inventory levels - consider optimizing stock levels');
    }

    if (this.accountsPayable > this.accountsReceivable) {
      recommendations.push('Consider negotiating better payment terms with suppliers');
    }

    return recommendations;
  }
}