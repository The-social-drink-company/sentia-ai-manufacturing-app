



import { AIForecastingService } from "../ai/forecasting/aiForecasting.js";

export class ExecutiveDashboardService {
  constructor(config = {}) {
    this.aiForecastingService = new AIForecastingService(config);
  }

  async generateExecutiveDashboard(businessData) {
    const intelligence = await this.aiForecastingService.generateBusinessIntelligence(businessData);

    const dashboard = {
      kpis: this.extractStrategicKPIs(intelligence),
      charts: this.generateDashboardCharts(intelligence),
      recommendations: intelligence.recommendations,
    };

    return dashboard;
  }

  extractStrategicKPIs(intelligence) {
    // Extract and format KPIs for the executive dashboard
    const kpis = {
      revenue: intelligence.analysis.financial.revenue,
      profitMargin: intelligence.analysis.financial.profitMargin,
      customerAcquisitionCost: intelligence.analysis.marketing.cac,
      customerLifetimeValue: intelligence.analysis.marketing.clv,
    };

    return kpis;
  }

  generateDashboardCharts(intelligence) {
    // Generate chart data for the executive dashboard
    const charts = {
      cashFlowForecast: this.formatChartData(intelligence.analysis.financial.cashFlow, "Cash Flow Forecast"),
      demandForecast: this.formatChartData(intelligence.analysis.sales.demand, "Demand Forecast"),
    };

    return charts;
  }

  formatChartData(data, label) {
    return {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: label,
          data: data.map(d => d.value),
        },
      ],
    };
  }
}


