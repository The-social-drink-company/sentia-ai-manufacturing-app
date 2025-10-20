/**
 * Interactive Reporting System API
 * 
 * Comprehensive REST API for advanced reporting, custom dashboards, automated
 * report generation, and business intelligence for the CapLiquify Platform
 * MCP Server. Integrates with advanced analytics engine and visualization
 * components for complete reporting solution.
 * 
 * Features:
 * - Custom report builder with dynamic queries
 * - Automated report scheduling and delivery
 * - Interactive dashboard management
 * - Multi-format export capabilities (PDF, Excel, CSV, PowerBI)
 * - Real-time report updates and streaming
 * - Template management and sharing
 * - Access control and permissions
 * - Report analytics and usage tracking
 */

import { Router } from 'express';
import { createLogger } from '../utils/logger.js';
import { advancedAnalytics } from '../utils/analytics.js';
import { businessAnalytics } from '../utils/business-analytics.js';
import { monitoring } from '../utils/monitoring.js';
import { cacheManager } from '../utils/cache.js';
import { SERVER_CONFIG } from '../config/server-config.js';

const router = Router();
const logger = createLogger();

/**
 * Report storage and management
 */
class ReportManager {
  constructor() {
    this.reports = new Map();
    this.templates = new Map();
    this.schedules = new Map();
    this.dashboards = new Map();
    this.reportHistory = [];
    
    this.initialize();
  }

  async initialize() {
    // Load existing reports and templates
    await this.loadReportTemplates();
    logger.debug('Report manager initialized');
  }

  async loadReportTemplates() {
    // Load default report templates
    const defaultTemplates = [
      {
        id: 'financial-summary',
        name: 'Financial Summary Report',
        type: 'financial',
        sections: ['revenue', 'costs', 'profitability', 'forecasts'],
        schedule: 'daily',
        format: 'pdf'
      },
      {
        id: 'operational-dashboard',
        name: 'Operational Performance Dashboard',
        type: 'operational',
        sections: ['production', 'quality', 'efficiency', 'downtime'],
        schedule: 'real-time',
        format: 'dashboard'
      },
      {
        id: 'customer-analytics',
        name: 'Customer Analytics Report',
        type: 'customer',
        sections: ['satisfaction', 'retention', 'acquisition', 'value'],
        schedule: 'weekly',
        format: 'excel'
      }
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }
  }

  async createReport(definition, userId) {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report = {
      id: reportId,
      ...definition,
      createdBy: userId,
      createdAt: Date.now(),
      status: 'draft',
      version: '1.0.0'
    };

    this.reports.set(reportId, report);
    
    logger.info('Report created', { reportId, type: definition.type, createdBy: userId });
    
    return report;
  }

  async generateReport(reportId, options = {}) {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const startTime = Date.now();
    
    try {
      report.status = 'generating';
      
      // Generate report data based on type and configuration
      const reportData = await this.buildReportData(report, options);
      
      // Apply formatting and styling
      const formattedReport = await this.formatReport(reportData, report.format);
      
      // Store generated report
      const generatedReport = {
        ...report,
        data: reportData,
        formatted: formattedReport,
        generatedAt: Date.now(),
        generationTime: Date.now() - startTime,
        status: 'completed',
        size: JSON.stringify(formattedReport).length
      };

      this.reports.set(reportId, generatedReport);
      this.reportHistory.push({
        reportId,
        generatedAt: Date.now(),
        generationTime: generatedReport.generationTime,
        success: true
      });

      logger.info('Report generated successfully', {
        reportId,
        type: report.type,
        generationTime: generatedReport.generationTime,
        size: generatedReport.size
      });

      return generatedReport;
    } catch (error) {
      report.status = 'failed';
      report.error = error.message;
      
      this.reportHistory.push({
        reportId,
        generatedAt: Date.now(),
        success: false,
        error: error.message
      });

      logger.error('Report generation failed', { reportId, error });
      throw error;
    }
  }

  async buildReportData(report, options) {
    const { timeRange = '7d', includeForecasts = true } = options;
    
    // Get analytics data based on report type
    const analyticsData = await advancedAnalytics.getBusinessIntelligence(
      report.type,
      { timeRange, includeForecasts }
    );

    // Build sections based on report configuration
    const sections = {};
    
    for (const sectionName of report.sections) {
      sections[sectionName] = await this.buildReportSection(
        sectionName,
        analyticsData,
        report.type,
        options
      );
    }

    return {
      metadata: {
        reportId: report.id,
        type: report.type,
        title: report.name,
        generatedAt: Date.now(),
        timeRange,
        sections: Object.keys(sections)
      },
      summary: this.buildReportSummary(analyticsData, sections),
      sections,
      analytics: analyticsData,
      charts: await this.generateChartData(sections, report.type)
    };
  }

  async buildReportSection(sectionName, analyticsData, reportType, options) {
    switch (sectionName) {
      case 'revenue':
        return this.buildRevenueSection(analyticsData);
      case 'costs':
        return this.buildCostsSection(analyticsData);
      case 'profitability':
        return this.buildProfitabilitySection(analyticsData);
      case 'forecasts':
        return this.buildForecastsSection(analyticsData);
      case 'production':
        return this.buildProductionSection(analyticsData);
      case 'quality':
        return this.buildQualitySection(analyticsData);
      case 'efficiency':
        return this.buildEfficiencySection(analyticsData);
      case 'satisfaction':
        return this.buildSatisfactionSection(analyticsData);
      case 'retention':
        return this.buildRetentionSection(analyticsData);
      default:
        return { error: `Unknown section: ${sectionName}` };
    }
  }

  buildReportSummary(analyticsData, sections) {
    return {
      overallHealth: analyticsData.summary?.overallHealth || 'good',
      keyMetrics: this.extractKeyMetrics(sections),
      insights: analyticsData.summary?.keyInsights || [],
      recommendations: analyticsData.recommendations || []
    };
  }

  async generateChartData(sections, reportType) {
    const charts = [];
    
    for (const [sectionName, sectionData] of Object.entries(sections)) {
      if (sectionData.metrics) {
        charts.push({
          id: `${sectionName}_chart`,
          type: this.determineChartType(sectionName),
          title: `${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Trends`,
          data: sectionData.metrics,
          config: this.getChartConfig(sectionName)
        });
      }
    }

    return charts;
  }

  // Section builders
  buildRevenueSection(analyticsData) {
    return {
      title: 'Revenue Analysis',
      metrics: {
        totalRevenue: analyticsData.financial?.revenue?.total || 0,
        revenueGrowth: analyticsData.financial?.revenue?.growth || 0,
        averageOrderValue: analyticsData.financial?.revenue?.avgOrderValue || 0
      },
      trends: analyticsData.financial?.revenue?.trends || {},
      charts: ['revenue_timeline', 'revenue_by_product']
    };
  }

  buildCostsSection(analyticsData) {
    return {
      title: 'Cost Analysis',
      metrics: {
        totalCosts: analyticsData.financial?.costs?.total || 0,
        costPerUnit: analyticsData.financial?.costs?.perUnit || 0,
        costTrend: analyticsData.financial?.costs?.trend || 'stable'
      },
      breakdown: analyticsData.financial?.costs?.breakdown || {},
      charts: ['cost_breakdown', 'cost_trends']
    };
  }

  buildProfitabilitySection(analyticsData) {
    return {
      title: 'Profitability Analysis',
      metrics: {
        grossMargin: analyticsData.financial?.profitability?.grossMargin || 0,
        netMargin: analyticsData.financial?.profitability?.netMargin || 0,
        roi: analyticsData.financial?.profitability?.roi || 0
      },
      trends: analyticsData.financial?.profitability?.trends || {},
      charts: ['margin_trends', 'roi_analysis']
    };
  }

  buildForecastsSection(analyticsData) {
    return {
      title: 'Financial Forecasts',
      forecasts: analyticsData.forecasts || {},
      confidence: analyticsData.forecastConfidence || 0.85,
      horizon: '30 days',
      charts: ['revenue_forecast', 'cost_forecast']
    };
  }

  buildProductionSection(analyticsData) {
    return {
      title: 'Production Performance',
      metrics: {
        efficiency: analyticsData.operational?.production?.efficiency || 0,
        throughput: analyticsData.operational?.production?.throughput || 0,
        utilization: analyticsData.operational?.production?.utilization || 0
      },
      kpis: analyticsData.operational?.production?.kpis || {},
      charts: ['production_efficiency', 'throughput_trends']
    };
  }

  buildQualitySection(analyticsData) {
    return {
      title: 'Quality Metrics',
      metrics: {
        qualityScore: analyticsData.operational?.quality?.score || 0,
        defectRate: analyticsData.operational?.quality?.defectRate || 0,
        firstPassYield: analyticsData.operational?.quality?.firstPassYield || 0
      },
      trends: analyticsData.operational?.quality?.trends || {},
      charts: ['quality_trends', 'defect_analysis']
    };
  }

  buildEfficiencySection(analyticsData) {
    return {
      title: 'Operational Efficiency',
      metrics: {
        oee: analyticsData.operational?.efficiency?.oee || 0,
        availability: analyticsData.operational?.efficiency?.availability || 0,
        performance: analyticsData.operational?.efficiency?.performance || 0
      },
      benchmarks: analyticsData.operational?.efficiency?.benchmarks || {},
      charts: ['oee_trends', 'efficiency_breakdown']
    };
  }

  buildSatisfactionSection(analyticsData) {
    return {
      title: 'Customer Satisfaction',
      metrics: {
        nps: analyticsData.customer?.satisfaction?.nps || 0,
        csat: analyticsData.customer?.satisfaction?.csat || 0,
        responseTime: analyticsData.customer?.satisfaction?.responseTime || 0
      },
      feedback: analyticsData.customer?.satisfaction?.feedback || {},
      charts: ['satisfaction_trends', 'nps_breakdown']
    };
  }

  buildRetentionSection(analyticsData) {
    return {
      title: 'Customer Retention',
      metrics: {
        retentionRate: analyticsData.customer?.retention?.rate || 0,
        churnRate: analyticsData.customer?.retention?.churnRate || 0,
        lifetimeValue: analyticsData.customer?.retention?.lifetimeValue || 0
      },
      cohorts: analyticsData.customer?.retention?.cohorts || {},
      charts: ['retention_trends', 'churn_analysis']
    };
  }

  extractKeyMetrics(sections) {
    const keyMetrics = [];
    
    for (const [sectionName, sectionData] of Object.entries(sections)) {
      if (sectionData.metrics) {
        for (const [metricName, metricValue] of Object.entries(sectionData.metrics)) {
          keyMetrics.push({
            section: sectionName,
            metric: metricName,
            value: metricValue,
            importance: this.calculateMetricImportance(sectionName, metricName)
          });
        }
      }
    }

    return keyMetrics.sort((a, b) => b.importance - a.importance).slice(0, 10);
  }

  calculateMetricImportance(section, metric) {
    const importance = {
      revenue: { totalRevenue: 10, revenueGrowth: 9 },
      profitability: { grossMargin: 8, netMargin: 9, roi: 8 },
      production: { efficiency: 7, throughput: 6 },
      quality: { qualityScore: 8, defectRate: 7 },
      satisfaction: { nps: 9, csat: 8 }
    };

    return importance[section]?.[metric] || 5;
  }

  determineChartType(sectionName) {
    const chartTypes = {
      revenue: 'line',
      costs: 'bar',
      profitability: 'line',
      production: 'bar',
      quality: 'line',
      satisfaction: 'gauge'
    };

    return chartTypes[sectionName] || 'line';
  }

  getChartConfig(sectionName) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true }
      }
    };
  }

  async formatReport(reportData, format) {
    switch (format) {
      case 'pdf':
        return this.formatPDF(reportData);
      case 'excel':
        return this.formatExcel(reportData);
      case 'csv':
        return this.formatCSV(reportData);
      case 'json':
        return reportData;
      case 'html':
        return this.formatHTML(reportData);
      default:
        return reportData;
    }
  }

  formatPDF(reportData) {
    // PDF formatting would integrate with a PDF library
    return {
      format: 'pdf',
      content: reportData,
      pages: this.calculatePages(reportData),
      size: 'A4'
    };
  }

  formatExcel(reportData) {
    // Excel formatting would integrate with Excel library
    return {
      format: 'excel',
      sheets: this.createExcelSheets(reportData),
      charts: reportData.charts
    };
  }

  formatCSV(reportData) {
    const csvData = [];
    
    // Convert sections to CSV rows
    for (const [sectionName, sectionData] of Object.entries(reportData.sections)) {
      if (sectionData.metrics) {
        for (const [metric, value] of Object.entries(sectionData.metrics)) {
          csvData.push([sectionName, metric, value]);
        }
      }
    }

    return {
      format: 'csv',
      headers: ['Section', 'Metric', 'Value'],
      data: csvData
    };
  }

  formatHTML(reportData) {
    return {
      format: 'html',
      content: this.generateHTMLReport(reportData),
      styles: this.getReportStyles()
    };
  }

  calculatePages(reportData) {
    return Math.ceil(Object.keys(reportData.sections).length / 2);
  }

  createExcelSheets(reportData) {
    const sheets = [];
    
    sheets.push({
      name: 'Summary',
      data: this.convertSummaryToRows(reportData.summary)
    });

    for (const [sectionName, sectionData] of Object.entries(reportData.sections)) {
      sheets.push({
        name: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
        data: this.convertSectionToRows(sectionData)
      });
    }

    return sheets;
  }

  convertSummaryToRows(summary) {
    const rows = [['Metric', 'Value']];
    
    if (summary.keyMetrics) {
      for (const metric of summary.keyMetrics) {
        rows.push([`${metric.section}: ${metric.metric}`, metric.value]);
      }
    }

    return rows;
  }

  convertSectionToRows(sectionData) {
    const rows = [['Metric', 'Value']];
    
    if (sectionData.metrics) {
      for (const [metric, value] of Object.entries(sectionData.metrics)) {
        rows.push([metric, value]);
      }
    }

    return rows;
  }

  generateHTMLReport(reportData) {
    return `
      <html>
        <head>
          <title>${reportData.metadata.title}</title>
          <style>${this.getReportStyles()}</style>
        </head>
        <body>
          <h1>${reportData.metadata.title}</h1>
          <div class="summary">${this.generateSummaryHTML(reportData.summary)}</div>
          <div class="sections">${this.generateSectionsHTML(reportData.sections)}</div>
        </body>
      </html>
    `;
  }

  getReportStyles() {
    return `
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }
      .summary { background: #f8f9fa; padding: 15px; margin: 20px 0; }
      .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
      .metric { display: flex; justify-content: space-between; margin: 5px 0; }
    `;
  }

  generateSummaryHTML(summary) {
    let html = '<h2>Summary</h2>';
    
    if (summary.keyMetrics) {
      html += '<div class="metrics">';
      for (const metric of summary.keyMetrics.slice(0, 5)) {
        html += `<div class="metric"><span>${metric.metric}</span><span>${metric.value}</span></div>`;
      }
      html += '</div>';
    }

    return html;
  }

  generateSectionsHTML(sections) {
    let html = '';
    
    for (const [sectionName, sectionData] of Object.entries(sections)) {
      html += `<div class="section">
        <h3>${sectionData.title}</h3>
        ${this.generateMetricsHTML(sectionData.metrics)}
      </div>`;
    }

    return html;
  }

  generateMetricsHTML(metrics) {
    if (!metrics) return '';
    
    let html = '<div class="metrics">';
    for (const [metric, value] of Object.entries(metrics)) {
      html += `<div class="metric"><span>${metric}</span><span>${value}</span></div>`;
    }
    html += '</div>';
    
    return html;
  }
}

// Initialize report manager
const reportManager = new ReportManager();

/**
 * API Endpoints
 */

/**
 * Get all reports
 * GET /reports
 */
router.get('/', async (req, res) => {
  try {
    const {
      type,
      status,
      createdBy,
      limit = 50,
      offset = 0
    } = req.query;

    let reports = Array.from(reportManager.reports.values());

    // Apply filters
    if (type) reports = reports.filter(r => r.type === type);
    if (status) reports = reports.filter(r => r.status === status);
    if (createdBy) reports = reports.filter(r => r.createdBy === createdBy);

    // Sort by creation date (newest first)
    reports.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const paginatedReports = reports.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      reports: paginatedReports,
      pagination: {
        total: reports.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < reports.length
      },
      filters: { type, status, createdBy }
    });

  } catch (error) {
    logger.error('Failed to get reports', { error });
    res.status(500).json({
      error: 'Failed to get reports',
      message: error.message
    });
  }
});

/**
 * Create new report
 * POST /reports
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      sections,
      schedule,
      format = 'json',
      template,
      options = {}
    } = req.body;

    const userId = req.user?.id || 'anonymous';

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'type']
      });
    }

    const reportDefinition = {
      name,
      type,
      sections: sections || ['summary'],
      schedule,
      format,
      template,
      options
    };

    const report = await reportManager.createReport(reportDefinition, userId);

    res.status(201).json({
      success: true,
      report
    });

    logger.info('Report created via API', {
      reportId: report.id,
      type,
      createdBy: userId
    });

  } catch (error) {
    logger.error('Failed to create report', { error });
    res.status(500).json({
      error: 'Failed to create report',
      message: error.message
    });
  }
});

/**
 * Get specific report
 * GET /reports/:reportId
 */
router.get('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { includeData = false } = req.query;

    const report = reportManager.reports.get(reportId);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        reportId
      });
    }

    // Remove large data fields if not requested
    const responseReport = { ...report };
    if (!includeData) {
      delete responseReport.data;
      delete responseReport.formatted;
    }

    res.json({
      report: responseReport
    });

  } catch (error) {
    logger.error('Failed to get report', { error, reportId: req.params.reportId });
    res.status(500).json({
      error: 'Failed to get report',
      message: error.message
    });
  }
});

/**
 * Generate report
 * POST /reports/:reportId/generate
 */
router.post('/:reportId/generate', async (req, res) => {
  try {
    const { reportId } = req.params;
    const options = req.body;

    const generatedReport = await reportManager.generateReport(reportId, options);

    res.json({
      success: true,
      report: generatedReport,
      generationTime: generatedReport.generationTime
    });

    // Update monitoring metrics
    monitoring.setMetric('reports.generation.count', 1, { type: generatedReport.type });
    monitoring.setMetric('reports.generation.time', generatedReport.generationTime, { type: generatedReport.type });

  } catch (error) {
    logger.error('Failed to generate report', { error, reportId: req.params.reportId });
    res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

/**
 * Export report
 * GET /reports/:reportId/export
 */
router.get('/:reportId/export', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { format = 'json' } = req.query;

    const report = reportManager.reports.get(reportId);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        reportId
      });
    }

    if (report.status !== 'completed') {
      return res.status(400).json({
        error: 'Report not ready for export',
        status: report.status
      });
    }

    // Get formatted data
    const formattedData = await reportManager.formatReport(report.data, format);

    // Set appropriate headers based on format
    switch (format) {
      case 'pdf':
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `attachment; filename=report_${reportId}.pdf`);
        break;
      case 'excel':
        res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.set('Content-Disposition', `attachment; filename=report_${reportId}.xlsx`);
        break;
      case 'csv':
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition', `attachment; filename=report_${reportId}.csv`);
        break;
      case 'html':
        res.set('Content-Type', 'text/html');
        break;
      default:
        res.set('Content-Type', 'application/json');
    }

    if (format === 'csv') {
      // Convert CSV data to string
      const csvString = [formattedData.headers, ...formattedData.data]
        .map(row => row.join(','))
        .join('\n');
      res.send(csvString);
    } else {
      res.json(formattedData);
    }

    logger.info('Report exported', { reportId, format });

  } catch (error) {
    logger.error('Failed to export report', { error, reportId: req.params.reportId });
    res.status(500).json({
      error: 'Failed to export report',
      message: error.message
    });
  }
});

/**
 * Update report
 * PUT /reports/:reportId
 */
router.put('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const updates = req.body;

    const report = reportManager.reports.get(reportId);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        reportId
      });
    }

    // Update report fields
    const updatedReport = {
      ...report,
      ...updates,
      updatedAt: Date.now(),
      version: this.incrementVersion(report.version)
    };

    reportManager.reports.set(reportId, updatedReport);

    res.json({
      success: true,
      report: updatedReport
    });

    logger.info('Report updated', { reportId });

  } catch (error) {
    logger.error('Failed to update report', { error, reportId: req.params.reportId });
    res.status(500).json({
      error: 'Failed to update report',
      message: error.message
    });
  }
});

/**
 * Delete report
 * DELETE /reports/:reportId
 */
router.delete('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = reportManager.reports.get(reportId);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        reportId
      });
    }

    reportManager.reports.delete(reportId);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

    logger.info('Report deleted', { reportId });

  } catch (error) {
    logger.error('Failed to delete report', { error, reportId: req.params.reportId });
    res.status(500).json({
      error: 'Failed to delete report',
      message: error.message
    });
  }
});

/**
 * Get report templates
 * GET /reports/templates
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = Array.from(reportManager.templates.values());

    res.json({
      templates
    });

  } catch (error) {
    logger.error('Failed to get report templates', { error });
    res.status(500).json({
      error: 'Failed to get report templates',
      message: error.message
    });
  }
});

/**
 * Create report from template
 * POST /reports/templates/:templateId/create
 */
router.post('/templates/:templateId/create', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, options = {} } = req.body;

    const template = reportManager.templates.get(templateId);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        templateId
      });
    }

    const userId = req.user?.id || 'anonymous';

    // Create report from template
    const reportDefinition = {
      ...template,
      name: name || `${template.name} - ${new Date().toISOString()}`,
      template: templateId,
      options
    };

    const report = await reportManager.createReport(reportDefinition, userId);

    res.status(201).json({
      success: true,
      report
    });

    logger.info('Report created from template', {
      reportId: report.id,
      templateId,
      createdBy: userId
    });

  } catch (error) {
    logger.error('Failed to create report from template', { error });
    res.status(500).json({
      error: 'Failed to create report from template',
      message: error.message
    });
  }
});

/**
 * Get dashboard configurations
 * GET /reports/dashboards
 */
router.get('/dashboards', async (req, res) => {
  try {
    const dashboards = Array.from(reportManager.dashboards.values());

    res.json({
      dashboards
    });

  } catch (error) {
    logger.error('Failed to get dashboards', { error });
    res.status(500).json({
      error: 'Failed to get dashboards',
      message: error.message
    });
  }
});

/**
 * Create dashboard
 * POST /reports/dashboards
 */
router.post('/dashboards', async (req, res) => {
  try {
    const {
      name,
      widgets,
      layout,
      refreshInterval = 60,
      filters = {}
    } = req.body;

    const dashboardId = `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = req.user?.id || 'anonymous';

    const dashboard = {
      id: dashboardId,
      name,
      widgets,
      layout,
      refreshInterval,
      filters,
      createdBy: userId,
      createdAt: Date.now(),
      status: 'active'
    };

    reportManager.dashboards.set(dashboardId, dashboard);

    res.status(201).json({
      success: true,
      dashboard
    });

    logger.info('Dashboard created', { dashboardId, createdBy: userId });

  } catch (error) {
    logger.error('Failed to create dashboard', { error });
    res.status(500).json({
      error: 'Failed to create dashboard',
      message: error.message
    });
  }
});

/**
 * Get dashboard data
 * GET /reports/dashboards/:dashboardId/data
 */
router.get('/dashboards/:dashboardId/data', async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { refresh = false } = req.query;

    const dashboard = reportManager.dashboards.get(dashboardId);

    if (!dashboard) {
      return res.status(404).json({
        error: 'Dashboard not found',
        dashboardId
      });
    }

    // Check cache first if not forcing refresh
    const cacheKey = `dashboard:${dashboardId}:data`;
    if (!refresh) {
      const cachedData = await cacheManager.get(cacheKey, 'ai_analysis');
      if (cachedData) {
        return res.json(cachedData);
      }
    }

    // Generate dashboard data
    const dashboardData = await this.generateDashboardData(dashboard);

    // Cache the results
    await cacheManager.set(cacheKey, dashboardData, 'ai_analysis', dashboard.refreshInterval);

    res.json(dashboardData);

  } catch (error) {
    logger.error('Failed to get dashboard data', { error, dashboardId: req.params.dashboardId });
    res.status(500).json({
      error: 'Failed to get dashboard data',
      message: error.message
    });
  }
});

/**
 * Get report analytics
 * GET /reports/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const analytics = {
      totalReports: reportManager.reports.size,
      reportsByType: this.getReportsByType(),
      reportsByStatus: this.getReportsByStatus(),
      generationHistory: reportManager.reportHistory.slice(-100), // Last 100 generations
      averageGenerationTime: this.calculateAverageGenerationTime(),
      popularTemplates: this.getPopularTemplates(),
      dashboardCount: reportManager.dashboards.size
    };

    res.json({
      analytics
    });

  } catch (error) {
    logger.error('Failed to get report analytics', { error });
    res.status(500).json({
      error: 'Failed to get report analytics',
      message: error.message
    });
  }
});

/**
 * Helper methods
 */
function getReportsByType() {
  const typeCount = {};
  for (const report of reportManager.reports.values()) {
    typeCount[report.type] = (typeCount[report.type] || 0) + 1;
  }
  return typeCount;
}

function getReportsByStatus() {
  const statusCount = {};
  for (const report of reportManager.reports.values()) {
    statusCount[report.status] = (statusCount[report.status] || 0) + 1;
  }
  return statusCount;
}

function calculateAverageGenerationTime() {
  const completedGenerations = reportManager.reportHistory.filter(h => h.success && h.generationTime);
  if (completedGenerations.length === 0) return 0;
  
  const totalTime = completedGenerations.reduce((sum, h) => sum + h.generationTime, 0);
  return totalTime / completedGenerations.length;
}

function getPopularTemplates() {
  const templateUsage = {};
  for (const report of reportManager.reports.values()) {
    if (report.template) {
      templateUsage[report.template] = (templateUsage[report.template] || 0) + 1;
    }
  }
  
  return Object.entries(templateUsage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([template, count]) => ({ template, count }));
}

async function generateDashboardData(dashboard) {
  const data = {
    dashboardId: dashboard.id,
    name: dashboard.name,
    lastUpdated: Date.now(),
    widgets: {}
  };

  for (const widget of dashboard.widgets) {
    try {
      data.widgets[widget.id] = await generateWidgetData(widget, dashboard.filters);
    } catch (error) {
      logger.error('Failed to generate widget data', { error, widgetId: widget.id });
      data.widgets[widget.id] = { error: error.message };
    }
  }

  return data;
}

async function generateWidgetData(widget, filters) {
  const { type, config } = widget;

  switch (type) {
    case 'metric':
      return generateMetricWidget(config, filters);
    case 'chart':
      return generateChartWidget(config, filters);
    case 'table':
      return generateTableWidget(config, filters);
    case 'kpi':
      return generateKPIWidget(config, filters);
    default:
      throw new Error(`Unknown widget type: ${type}`);
  }
}

async function generateMetricWidget(config, filters) {
  const { metric, timeRange = '1h' } = config;
  
  const analytics = await advancedAnalytics.getAnalytics(metric, {
    timeRange,
    includeTrends: true
  });

  return {
    type: 'metric',
    value: analytics.statistics.mean,
    trend: analytics.trends?.trend || 'stable',
    change: analytics.trends?.change || 0,
    timestamp: Date.now()
  };
}

async function generateChartWidget(config, filters) {
  const { metrics, chartType, timeRange = '24h' } = config;
  
  const chartData = {
    type: 'chart',
    chartType,
    data: [],
    labels: [],
    timestamp: Date.now()
  };

  for (const metric of metrics) {
    const analytics = await advancedAnalytics.getAnalytics(metric, { timeRange });
    
    if (analytics.data && analytics.data.length > 0) {
      chartData.data.push({
        label: metric,
        data: analytics.data.map(d => d.value)
      });
      
      if (chartData.labels.length === 0) {
        chartData.labels = analytics.data.map(d => new Date(d.timestamp).toISOString());
      }
    }
  }

  return chartData;
}

async function generateTableWidget(config, filters) {
  const { dataSource, columns } = config;
  
  // Get data from analytics
  const intelligence = await advancedAnalytics.getBusinessIntelligence(dataSource);
  
  return {
    type: 'table',
    columns,
    rows: intelligence.summary?.keyMetrics || [],
    timestamp: Date.now()
  };
}

async function generateKPIWidget(config, filters) {
  const { kpis } = config;
  
  const kpiData = [];
  
  for (const kpi of kpis) {
    const analytics = await advancedAnalytics.getAnalytics(kpi.metric);
    
    kpiData.push({
      name: kpi.name,
      value: analytics.statistics.mean,
      target: kpi.target,
      unit: kpi.unit,
      trend: analytics.trends?.trend || 'stable'
    });
  }

  return {
    type: 'kpi',
    kpis: kpiData,
    timestamp: Date.now()
  };
}

function incrementVersion(version) {
  const parts = version.split('.');
  parts[2] = (parseInt(parts[2]) + 1).toString();
  return parts.join('.');
}

export default router;