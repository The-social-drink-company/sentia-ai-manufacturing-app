/**
 * Production Entity
 * Core business logic for production management
 */

export class Production {
  constructor({
    id,
    productId,
    quantity,
    startTime,
    endTime,
    status,
    efficiency,
    qualityScore,
    operatorId
  }) {
    this.id = id;
    this.productId = productId;
    this.quantity = quantity;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
    this.efficiency = efficiency;
    this.qualityScore = qualityScore;
    this.operatorId = operatorId;
  }

  /**
   * Calculate Overall Equipment Effectiveness (OEE)
   * @param {number} availability - Equipment availability (0-1)
   * @param {number} performance - Performance rate (0-1)
   * @param {number} quality - Quality rate (0-1)
   * @returns {number} OEE percentage
   */
  static calculateOEE(availability, performance, quality) {
    return availability * performance * quality * 100;
  }

  /**
   * Calculate production duration
   * @returns {number} Duration in hours
   */
  getDuration() {
    if (!this.startTime || !this.endTime) return 0;
    return (this.endTime - this.startTime) / (1000 * 60 * 60);
  }

  /**
   * Calculate production rate
   * @returns {number} Units per hour
   */
  getProductionRate() {
    const duration = this.getDuration();
    return duration > 0 ? this.quantity / duration : 0;
  }

  /**
   * Determine if production is on schedule
   * @param {number} targetQuantity
   * @param {Date} targetDeadline
   * @returns {boolean}
   */
  isOnSchedule(targetQuantity, targetDeadline) {
    const currentTime = new Date();
    const timeRemaining = (targetDeadline - currentTime) / (1000 * 60 * 60);
    const currentRate = this.getProductionRate();
    const projectedQuantity = this.quantity + (currentRate * timeRemaining);

    return projectedQuantity >= targetQuantity;
  }

  /**
   * Get production status
   * @returns {string}
   */
  getStatus() {
    if (this.status === 'completed') return 'completed';
    if (this.status === 'paused') return 'paused';
    if (this.efficiency < 0.6) return 'critical';
    if (this.efficiency < 0.8) return 'warning';
    return 'normal';
  }

  /**
   * Calculate waste percentage
   * @param {number} inputMaterials
   * @returns {number} Waste percentage
   */
  calculateWaste(inputMaterials) {
    const expectedOutput = inputMaterials * this.efficiency;
    const actualOutput = this.quantity;
    const waste = expectedOutput - actualOutput;
    return (waste / inputMaterials) * 100;
  }

  /**
   * Get production recommendations
   * @returns {Array<string>}
   */
  getRecommendations() {
    const recommendations = [];

    if (this.efficiency < 0.7) {
      recommendations.push('Low efficiency detected - consider equipment maintenance');
    }

    if (this.qualityScore < 0.95) {
      recommendations.push('Quality below target - review quality control processes');
    }

    const productionRate = this.getProductionRate();
    if (productionRate < 10) {
      recommendations.push('Production rate is low - analyze bottlenecks');
    }

    return recommendations;
  }
}