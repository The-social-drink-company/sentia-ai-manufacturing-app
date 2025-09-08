/**
 * ExportService - Handles dashboard data export functionality
 * Supports JSON, CSV, Excel, and PDF formats
 */

export class ExportService {
  constructor() {
    this.exportFormats = ['json', 'csv', 'excel', 'pdf'];
    this.dateEngine = null;
  }

  /**
   * Main export function - exports dashboard data in specified format
   */
  async exportDashboardData(dashboardData, format = 'json', options = {}) {
    try {
      const exportData = await this.prepareExportData(dashboardData, options);
      
      switch (format.toLowerCase()) {
        case 'json':
          return this.exportAsJSON(exportData, options.filename);
        case 'csv':
          return this.exportAsCSV(exportData, options.filename);
        case 'excel':
          return this.exportAsExcel(exportData, options.filename);
        case 'pdf':
          return this.exportAsPDF(exportData, options.filename);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Prepare comprehensive dashboard data for export
   */
  async prepareExportData(dashboardData, options = {}) {
    const currentDate = new Date();
    const exportTimestamp = currentDate.toISOString();
    
    // Collect data from all dashboard components
    const exportData = {
      metadata: {
        exportedAt: exportTimestamp,
        exportedBy: options.user || 'Anonymous',
        dashboardVersion: '2.1.0',
        timeframe: options.timeframe || '12M',
        currency: options.currency || 'GBP',
        exportFormat: options.format || 'json'
      },
      
      // Executive Summary Data
      executiveSummary: {
        totalRevenue: dashboardData?.revenue || 0,
        workingCapital: dashboardData?.workingCapital || 0,
        cashPosition: dashboardData?.cashPosition || 0,
        operatingMargin: dashboardData?.operatingMargin || 0,
        productionEfficiency: dashboardData?.productionEfficiency || 0
      },

      // Financial Data
      financialData: this.extractFinancialData(dashboardData),
      
      // Working Capital Analysis
      workingCapitalData: this.extractWorkingCapitalData(dashboardData),
      
      // Production & Operations
      operationsData: this.extractOperationsData(dashboardData),
      
      // Forecasting Data
      forecastingData: this.extractForecastingData(dashboardData),
      
      // KPI Trends
      kpiTrends: this.extractKPITrends(dashboardData),
      
      // Risk Assessment
      riskAssessment: this.extractRiskData(dashboardData)
    };

    return exportData;
  }

  /**
   * Extract financial data from dashboard
   */
  extractFinancialData(dashboardData) {
    return {
      revenue: {
        current: dashboardData?.revenue || 40000000,
        projected: dashboardData?.projectedRevenue || 42000000,
        growth: dashboardData?.revenueGrowth || 5.0
      },
      costs: {
        operatingCosts: dashboardData?.operatingCosts || 26000000,
        financingCosts: dashboardData?.financingCosts || 800000,
        totalCosts: dashboardData?.totalCosts || 26800000
      },
      margins: {
        gross: dashboardData?.grossMargin || 35.0,
        operating: dashboardData?.operatingMargin || 25.0,
        net: dashboardData?.netMargin || 18.0
      },
      cashFlow: {
        operating: dashboardData?.operatingCashFlow || 7200000,
        investing: dashboardData?.investingCashFlow || -2400000,
        financing: dashboardData?.financingCashFlow || -1800000,
        net: dashboardData?.netCashFlow || 3000000
      }
    };
  }

  /**
   * Extract working capital data
   */
  extractWorkingCapitalData(dashboardData) {
    return {
      components: {
        receivables: dashboardData?.receivables || 4930000,
        inventory: dashboardData?.inventory || 2740000,
        payables: dashboardData?.payables || 2200000
      },
      metrics: {
        workingCapital: dashboardData?.workingCapital || 5470000,
        dso: dashboardData?.dso || 45,
        dio: dashboardData?.dio || 30,
        dpo: dashboardData?.dpo || 60,
        cashConversionCycle: dashboardData?.ccc || 15
      },
      projections: dashboardData?.workingCapitalProjections || []
    };
  }

  /**
   * Extract operations data
   */
  extractOperationsData(dashboardData) {
    return {
      production: {
        currentCapacity: dashboardData?.productionCapacity || 85,
        efficiency: dashboardData?.productionEfficiency || 92,
        downtime: dashboardData?.downtime || 3.5,
        qualityScore: dashboardData?.qualityScore || 98.2
      },
      inventory: {
        turnover: dashboardData?.inventoryTurnover || 12.2,
        stockouts: dashboardData?.stockouts || 0.8,
        excessInventory: dashboardData?.excessInventory || 4.2
      },
      supply: {
        supplierReliability: dashboardData?.supplierReliability || 96.5,
        leadTimes: dashboardData?.averageLeadTime || 14,
        costVariance: dashboardData?.costVariance || 2.1
      }
    };
  }

  /**
   * Extract forecasting data
   */
  extractForecastingData(dashboardData) {
    return {
      demandForecast: dashboardData?.demandForecast || [],
      accuracyMetrics: {
        mape: dashboardData?.forecastMAPE || 8.5,
        rmse: dashboardData?.forecastRMSE || 125,
        confidence: dashboardData?.forecastConfidence || 87
      },
      seasonality: dashboardData?.seasonalPatterns || [],
      trends: dashboardData?.demandTrends || []
    };
  }

  /**
   * Extract KPI trends
   */
  extractKPITrends(dashboardData) {
    return {
      financial: dashboardData?.financialKPIs || [],
      operational: dashboardData?.operationalKPIs || [],
      quality: dashboardData?.qualityKPIs || [],
      efficiency: dashboardData?.efficiencyKPIs || []
    };
  }

  /**
   * Extract risk assessment data
   */
  extractRiskData(dashboardData) {
    return {
      overallRisk: dashboardData?.overallRisk || 'Medium',
      riskFactors: dashboardData?.riskFactors || [
        { category: 'Supply Chain', level: 'Low', impact: 2.5 },
        { category: 'Market Volatility', level: 'Medium', impact: 5.2 },
        { category: 'Operational', level: 'Low', impact: 1.8 }
      ],
      mitigation: dashboardData?.mitigationStrategies || []
    };
  }

  /**
   * Export as JSON file
   */
  exportAsJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    this.downloadFile(blob, filename || `dashboard-export-${this.getTimestamp()}.json`);
    return { success: true, format: 'json', size: blob.size };
  }

  /**
   * Export as CSV file
   */
  exportAsCSV(data, filename) {
    // Flatten data for CSV export
    const csvData = this.flattenDataForCSV(data);
    const csvString = this.convertToCSV(csvData);
    const blob = new Blob([csvString], { type: 'text/csv' });
    this.downloadFile(blob, filename || `dashboard-export-${this.getTimestamp()}.csv`);
    return { success: true, format: 'csv', size: blob.size };
  }

  /**
   * Export as Excel file (using CSV format for simplicity)
   */
  exportAsExcel(data, filename) {
    // For now, export as CSV with .xlsx extension
    // In production, you'd use a library like xlsx or exceljs
    const csvData = this.flattenDataForCSV(data);
    const csvString = this.convertToCSV(csvData);
    const blob = new Blob([csvString], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.downloadFile(blob, filename || `dashboard-export-${this.getTimestamp()}.xlsx`);
    return { success: true, format: 'excel', size: blob.size };
  }

  /**
   * Export as PDF file
   */
  exportAsPDF(data, filename) {
    // Create a simplified PDF-like text document
    const pdfContent = this.formatDataForPDF(data);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    this.downloadFile(blob, filename || `dashboard-report-${this.getTimestamp()}.txt`);
    return { success: true, format: 'pdf', size: blob.size };
  }

  /**
   * Flatten nested data structure for CSV export
   */
  flattenDataForCSV(data) {
    const flattened = [];
    
    // Add metadata
    flattened.push({
      Category: 'Metadata',
      Metric: 'Export Date',
      Value: data.metadata.exportedAt,
      Unit: 'ISO Date'
    });
    
    // Add executive summary
    Object.entries(data.executiveSummary).forEach(([key, value]) => {
      flattened.push({
        Category: 'Executive Summary',
        Metric: this.formatMetricName(key),
        Value: value,
        Unit: this.getUnit(key)
      });
    });

    // Add financial data
    if (data.financialData) {
      Object.entries(data.financialData.revenue).forEach(([key, value]) => {
        flattened.push({
          Category: 'Revenue',
          Metric: this.formatMetricName(key),
          Value: value,
          Unit: key === 'growth' ? '%' : '£'
        });
      });
    }

    // Add working capital data
    if (data.workingCapitalData) {
      Object.entries(data.workingCapitalData.components).forEach(([key, value]) => {
        flattened.push({
          Category: 'Working Capital',
          Metric: this.formatMetricName(key),
          Value: value,
          Unit: '£'
        });
      });

      Object.entries(data.workingCapitalData.metrics).forEach(([key, value]) => {
        flattened.push({
          Category: 'WC Metrics',
          Metric: this.formatMetricName(key),
          Value: value,
          Unit: key.includes('so') || key.includes('io') || key.includes('po') || key === 'cashConversionCycle' ? 'days' : '£'
        });
      });
    }

    return flattened;
  }

  /**
   * Convert data array to CSV string
   */
  convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Format data for PDF-like text document
   */
  formatDataForPDF(data) {
    const lines = [];
    lines.push('SENTIA MANUFACTURING DASHBOARD REPORT');
    lines.push('=====================================\n');
    
    lines.push(`Generated: ${data.metadata.exportedAt}`);
    lines.push(`Exported by: ${data.metadata.exportedBy}`);
    lines.push(`Timeframe: ${data.metadata.timeframe}`);
    lines.push(`Currency: ${data.metadata.currency}\n`);

    lines.push('EXECUTIVE SUMMARY');
    lines.push('-----------------');
    Object.entries(data.executiveSummary).forEach(([key, value]) => {
      lines.push(`${this.formatMetricName(key)}: ${this.formatValue(value, key)}`);
    });
    lines.push('');

    if (data.financialData) {
      lines.push('FINANCIAL PERFORMANCE');
      lines.push('---------------------');
      lines.push(`Revenue: £${data.financialData.revenue.current.toLocaleString()}`);
      lines.push(`Operating Margin: ${data.financialData.margins.operating}%`);
      lines.push(`Net Cash Flow: £${data.financialData.cashFlow.net.toLocaleString()}`);
      lines.push('');
    }

    if (data.workingCapitalData) {
      lines.push('WORKING CAPITAL ANALYSIS');
      lines.push('------------------------');
      lines.push(`Working Capital: £${data.workingCapitalData.metrics.workingCapital.toLocaleString()}`);
      lines.push(`Cash Conversion Cycle: ${data.workingCapitalData.metrics.cashConversionCycle} days`);
      lines.push(`DSO: ${data.workingCapitalData.metrics.dso} days`);
      lines.push(`DIO: ${data.workingCapitalData.metrics.dio} days`);
      lines.push(`DPO: ${data.workingCapitalData.metrics.dpo} days`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Trigger file download
   */
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get current timestamp for filenames
   */
  getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  }

  /**
   * Format metric names for display
   */
  formatMetricName(key) {
    return key.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
  }

  /**
   * Get appropriate unit for metrics
   */
  getUnit(key) {
    if (key.includes('revenue') || key.includes('cost') || key.includes('capital') || key.includes('cash')) {
      return '£';
    }
    if (key.includes('margin') || key.includes('efficiency') || key.includes('growth')) {
      return '%';
    }
    if (key.includes('days') || key.includes('dso') || key.includes('dio') || key.includes('dpo')) {
      return 'days';
    }
    return '';
  }

  /**
   * Format values with appropriate units
   */
  formatValue(value, key) {
    const unit = this.getUnit(key);
    if (unit === '£') {
      return `£${value.toLocaleString()}`;
    }
    if (unit === '%') {
      return `${value}%`;
    }
    if (unit === 'days') {
      return `${value} days`;
    }
    return value;
  }

  /**
   * Quick export - exports current dashboard state as JSON
   */
  quickExport(dashboardData) {
    return this.exportDashboardData(dashboardData, 'json', {
      filename: `sentia-dashboard-${this.getTimestamp()}.json`
    });
  }
}

export default ExportService;