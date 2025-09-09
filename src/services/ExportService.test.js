/**
 * Basic test for ExportService functionality
 */

import ExportService from './ExportService';

describe('ExportService', () => {
  let exportService;

  beforeEach(() => {
    exportService = new ExportService();
  });

  test('should create ExportService instance', () => {
    expect(exportService).toBeInstanceOf(ExportService);
    expect(exportService.exportFormats).toContain('json');
    expect(exportService.exportFormats).toContain('csv');
  });

  test('should prepare export data with proper structure', async () => {
    const mockDashboardData = {
      revenue: 40000000,
      workingCapital: 5470000,
      operatingMargin: 25.8
    };

    const exportData = await exportService.prepareExportData(mockDashboardData, {
      user: 'Test User',
      timeframe: '12M'
    });

    expect(exportData).toHaveProperty('metadata');
    expect(exportData).toHaveProperty('executiveSummary');
    expect(exportData).toHaveProperty('financialData');
    expect(exportData.metadata.exportedBy).toBe('Test User');
    expect(exportData.metadata.timeframe).toBe('12M');
  });

  test('should format metric names correctly', () => {
    expect(exportService.formatMetricName('totalRevenue')).toBe('Total Revenue');
    expect(exportService.formatMetricName('workingCapital')).toBe('Working Capital');
    expect(exportService.formatMetricName('dso')).toBe('Dso');
  });

  test('should get appropriate units for metrics', () => {
    expect(exportService.getUnit('revenue')).toBe('£');
    expect(exportService.getUnit('margin')).toBe('%');
    expect(exportService.getUnit('dso')).toBe('days');
    expect(exportService.getUnit('efficiency')).toBe('%');
  });

  test('should convert data to CSV format', () => {
    const testData = [
      { Category: 'Financial', Metric: 'Revenue', Value: 40000000, Unit: '£' },
      { Category: 'Financial', Metric: 'Margin', Value: 25.8, Unit: '%' }
    ];

    const csv = exportService.convertToCSV(testData);
    
    expect(csv).toContain('Category,Metric,Value,Unit');
    expect(csv).toContain('Financial,Revenue,40000000,£');
    expect(csv).toContain('Financial,Margin,25.8,%');
  });

  test('should get timestamp for filenames', () => {
    const timestamp = exportService.getTimestamp();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});