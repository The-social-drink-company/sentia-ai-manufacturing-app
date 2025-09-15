


import { AIForecastingService } from "../ai/forecasting/aiForecasting.js";

export class RecommendationEngine {
  constructor(config = {}) {
    this.aiForecastingService = new AIForecastingService(config);
  }

  async generateRecommendations(businessData) {
    const intelligence = await this.aiForecastingService.generateBusinessIntelligence(businessData);

    const recommendations = {
      strategic: this.generateStrategicRecommendations(intelligence),
      operational: this.generateOperationalRecommendations(intelligence),
    };

    return recommendations;
  }

  generateStrategicRecommendations(intelligence) {
    // Generate strategic recommendations based on AI insights
    return intelligence.recommendations.filter(rec => rec.type === 'strategic');
  }

  generateOperationalRecommendations(intelligence) {
    // Generate operational recommendations based on AI insights
    return intelligence.recommendations.filter(rec => rec.type === 'operational');
  }
}


