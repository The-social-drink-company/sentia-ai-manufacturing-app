/**
 * Visualization Engine Test Suite
 * 
 * Comprehensive tests for the VisualizationEngine class including:
 * - Chart generation for multiple types
 * - Interactive visualization features
 * - Theme support and customization
 * - Real-time updates
 * - Performance optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VisualizationEngine } from '../../../src/utils/visualization.js';

describe('VisualizationEngine', () => {
  let visualizationEngine;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      enableInteractivity: true,
      enableRealTimeUpdates: true,
      defaultTheme: 'sentia',
      maxDataPoints: 10000,
      renderingTimeout: 5000,
      cacheEnabled: true
    };

    visualizationEngine = new VisualizationEngine(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const engine = new VisualizationEngine();
      expect(engine).toBeDefined();
      expect(engine.config).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      expect(visualizationEngine.config).toEqual(expect.objectContaining(mockConfig));
    });

    it('should initialize chart generators', () => {
      expect(visualizationEngine.chartGenerators).toBeDefined();
      expect(visualizationEngine.chartGenerators.size).toBeGreaterThan(0);
    });

    it('should load built-in themes', () => {
      expect(visualizationEngine.themes).toBeDefined();
      expect(visualizationEngine.themes.has('sentia')).toBe(true);
      expect(visualizationEngine.themes.has('dark')).toBe(true);
      expect(visualizationEngine.themes.has('light')).toBe(true);
    });
  });

  describe('chart generation', () => {
    const mockTimeSeriesData = [
      { timestamp: '2024-01-01', value: 1000 },
      { timestamp: '2024-01-02', value: 1200 },
      { timestamp: '2024-01-03', value: 1100 },
      { timestamp: '2024-01-04', value: 1350 },
      { timestamp: '2024-01-05', value: 1250 }
    ];

    const mockCategoricalData = [
      { category: 'Product A', value: 5000 },
      { category: 'Product B', value: 3200 },
      { category: 'Product C', value: 4100 },
      { category: 'Product D', value: 2800 }
    ];

    it('should generate line charts', async () => {
      const chart = await visualizationEngine.generateChart('line', mockTimeSeriesData, {
        title: 'Revenue Trend',
        xAxis: { label: 'Date' },
        yAxis: { label: 'Revenue ($)' }
      });

      expect(chart).toBeDefined();
      expect(chart.type).toBe('line');
      expect(chart.config).toBeDefined();
      expect(chart.data).toBeDefined();
      expect(chart.metadata.dataPoints).toBe(5);
    });

    it('should generate bar charts', async () => {
      const chart = await visualizationEngine.generateChart('bar', mockCategoricalData, {
        title: 'Product Sales',
        orientation: 'vertical'
      });

      expect(chart).toBeDefined();
      expect(chart.type).toBe('bar');
      expect(chart.config.orientation).toBe('vertical');
      expect(chart.data.length).toBe(4);
    });

    it('should generate pie charts', async () => {
      const chart = await visualizationEngine.generateChart('pie', mockCategoricalData, {
        title: 'Product Distribution',
        showLabels: true,
        showPercentages: true
      });

      expect(chart).toBeDefined();
      expect(chart.type).toBe('pie');
      expect(chart.config.showLabels).toBe(true);
      expect(chart.config.showPercentages).toBe(true);
    });

    it('should generate scatter plots', async () => {
      const scatterData = [
        { x: 10, y: 20, label: 'Point 1' },
        { x: 15, y: 25, label: 'Point 2' },
        { x: 20, y: 30, label: 'Point 3' },
        { x: 12, y: 22, label: 'Point 4' }
      ];

      const chart = await visualizationEngine.generateChart('scatter', scatterData, {
        title: 'Correlation Analysis',
        xAxis: { label: 'Metric X' },
        yAxis: { label: 'Metric Y' }
      });

      expect(chart).toBeDefined();
      expect(chart.type).toBe('scatter');
      expect(chart.data.length).toBe(4);
    });

    it('should generate heatmaps', async () => {
      const heatmapData = [
        { x: 'Monday', y: 'Product A', value: 100 },
        { x: 'Monday', y: 'Product B', value: 80 },
        { x: 'Tuesday', y: 'Product A', value: 120 },
        { x: 'Tuesday', y: 'Product B', value: 90 }
      ];

      const chart = await visualizationEngine.generateChart('heatmap', heatmapData, {
        title: 'Sales Heatmap',
        colorScale: 'viridis'
      });

      expect(chart).toBeDefined();
      expect(chart.type).toBe('heatmap');
      expect(chart.config.colorScale).toBe('viridis');
    });

    it('should generate area charts', async () => {
      const chart = await visualizationEngine.generateChart('area', mockTimeSeriesData, {
        title: 'Revenue Area Chart',
        fillOpacity: 0.6,
        stacked: false
      });

      expect(chart).toBeDefined();
      expect(chart.type).toBe('area');
      expect(chart.config.fillOpacity).toBe(0.6);
      expect(chart.config.stacked).toBe(false);
    });

    it('should handle unsupported chart types', async () => {
      await expect(visualizationEngine.generateChart('unsupported-type', mockTimeSeriesData))
        .rejects.toThrow('Unsupported chart type: unsupported-type');
    });
  });

  describe('theme support', () => {
    it('should apply Sentia theme', async () => {
      const chart = await visualizationEngine.generateChart('line', [
        { timestamp: '2024-01-01', value: 1000 }
      ], {
        theme: 'sentia'
      });

      expect(chart.theme).toBe('sentia');
      expect(chart.config.colors).toBeDefined();
      expect(chart.config.colors.primary).toBe('#1E40AF'); // Sentia blue
    });

    it('should apply dark theme', async () => {
      const chart = await visualizationEngine.generateChart('bar', [
        { category: 'A', value: 100 }
      ], {
        theme: 'dark'
      });

      expect(chart.theme).toBe('dark');
      expect(chart.config.backgroundColor).toBe('#1F2937');
      expect(chart.config.textColor).toBe('#F9FAFB');
    });

    it('should apply light theme', async () => {
      const chart = await visualizationEngine.generateChart('pie', [
        { category: 'A', value: 100 }
      ], {
        theme: 'light'
      });

      expect(chart.theme).toBe('light');
      expect(chart.config.backgroundColor).toBe('#FFFFFF');
      expect(chart.config.textColor).toBe('#111827');
    });

    it('should create custom themes', async () => {
      const customTheme = {
        name: 'custom',
        colors: {
          primary: '#FF6B6B',
          secondary: '#4ECDC4',
          accent: '#45B7D1'
        },
        backgroundColor: '#F8F9FA',
        textColor: '#343A40'
      };

      visualizationEngine.registerTheme(customTheme);

      const chart = await visualizationEngine.generateChart('line', [
        { timestamp: '2024-01-01', value: 1000 }
      ], {
        theme: 'custom'
      });

      expect(chart.theme).toBe('custom');
      expect(chart.config.colors.primary).toBe('#FF6B6B');
    });
  });

  describe('interactive features', () => {
    it('should enable tooltips', async () => {
      const chart = await visualizationEngine.generateChart('line', [
        { timestamp: '2024-01-01', value: 1000, label: 'Revenue' }
      ], {
        interactive: true,
        tooltips: {
          enabled: true,
          format: 'Date: {x}, Value: ${y}'
        }
      });

      expect(chart.config.interactive).toBe(true);
      expect(chart.config.tooltips.enabled).toBe(true);
      expect(chart.config.tooltips.format).toBe('Date: {x}, Value: ${y}');
    });

    it('should enable zoom and pan', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        value: Math.random() * 1000
      }));

      const chart = await visualizationEngine.generateChart('line', largeDataset, {
        interactive: true,
        zoom: { enabled: true, mode: 'xy' },
        pan: { enabled: true }
      });

      expect(chart.config.zoom.enabled).toBe(true);
      expect(chart.config.zoom.mode).toBe('xy');
      expect(chart.config.pan.enabled).toBe(true);
    });

    it('should enable selection and brushing', async () => {
      const chart = await visualizationEngine.generateChart('scatter', [
        { x: 10, y: 20 },
        { x: 15, y: 25 },
        { x: 20, y: 30 }
      ], {
        interactive: true,
        selection: {
          enabled: true,
          mode: 'brush',
          onSelect: vi.fn()
        }
      });

      expect(chart.config.selection.enabled).toBe(true);
      expect(chart.config.selection.mode).toBe('brush');
      expect(typeof chart.config.selection.onSelect).toBe('function');
    });

    it('should enable drill-down functionality', async () => {
      const hierarchicalData = [
        { category: 'Q1', value: 10000, children: [
          { category: 'Jan', value: 3000 },
          { category: 'Feb', value: 3500 },
          { category: 'Mar', value: 3500 }
        ]},
        { category: 'Q2', value: 12000, children: [
          { category: 'Apr', value: 4000 },
          { category: 'May', value: 4000 },
          { category: 'Jun', value: 4000 }
        ]}
      ];

      const chart = await visualizationEngine.generateChart('bar', hierarchicalData, {
        interactive: true,
        drillDown: {
          enabled: true,
          levels: 2
        }
      });

      expect(chart.config.drillDown.enabled).toBe(true);
      expect(chart.config.drillDown.levels).toBe(2);
    });
  });

  describe('real-time updates', () => {
    it('should support real-time data streaming', async () => {
      const initialData = [
        { timestamp: '2024-01-01T10:00:00Z', value: 1000 }
      ];

      const chart = await visualizationEngine.generateChart('line', initialData, {
        realTime: {
          enabled: true,
          updateInterval: 1000,
          maxDataPoints: 100
        }
      });

      expect(chart.config.realTime.enabled).toBe(true);
      expect(chart.config.realTime.updateInterval).toBe(1000);

      // Simulate real-time update
      const newDataPoint = { timestamp: '2024-01-01T10:01:00Z', value: 1100 };
      const updatedChart = await visualizationEngine.updateChart(chart.id, newDataPoint);

      expect(updatedChart.data.length).toBe(2);
      expect(updatedChart.lastUpdated).toBeDefined();
    });

    it('should handle data point limits for streaming', async () => {
      const chart = await visualizationEngine.generateChart('line', [], {
        realTime: {
          enabled: true,
          maxDataPoints: 5
        }
      });

      // Add 10 data points
      for (let i = 0; i < 10; i++) {
        const dataPoint = {
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          value: Math.random() * 1000
        };
        await visualizationEngine.updateChart(chart.id, dataPoint);
      }

      const finalChart = await visualizationEngine.getChart(chart.id);
      expect(finalChart.data.length).toBe(5); // Should maintain max limit
    });

    it('should emit update events', (done) => {
      visualizationEngine.on('chart-updated', (event) => {
        expect(event.chartId).toBeDefined();
        expect(event.newData).toBeDefined();
        expect(event.timestamp).toBeDefined();
        done();
      });

      visualizationEngine.generateChart('line', [
        { timestamp: '2024-01-01', value: 1000 }
      ], {
        realTime: { enabled: true }
      }).then(chart => {
        visualizationEngine.updateChart(chart.id, {
          timestamp: '2024-01-02',
          value: 1100
        });
      });
    });
  });

  describe('performance optimization', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 50000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        value: Math.random() * 1000
      }));

      const startTime = Date.now();
      
      const chart = await visualizationEngine.generateChart('line', largeDataset, {
        performance: {
          sampling: true,
          maxPoints: 1000,
          useWebGL: true
        }
      });

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      expect(chart).toBeDefined();
      expect(renderTime).toBeLessThan(5000); // Should render within 5 seconds
      expect(chart.data.length).toBeLessThanOrEqual(1000); // Should be sampled
    });

    it('should cache chart configurations', async () => {
      const data = [{ timestamp: '2024-01-01', value: 1000 }];
      const options = {
        title: 'Test Chart',
        cacheKey: 'test-chart-cache'
      };

      // First generation should cache
      const chart1 = await visualizationEngine.generateChart('line', data, options);
      
      // Second generation should use cache
      const chart2 = await visualizationEngine.generateChart('line', data, options);

      expect(chart1.id).toBe(chart2.id);
      expect(chart2.fromCache).toBe(true);
    });

    it('should lazy load chart generators', async () => {
      const initialGenerators = visualizationEngine.chartGenerators.size;

      // Request an advanced chart type
      const chart = await visualizationEngine.generateChart('candlestick', [
        { timestamp: '2024-01-01', open: 100, high: 110, low: 95, close: 105 }
      ]);

      expect(chart).toBeDefined();
      expect(visualizationEngine.chartGenerators.size).toBeGreaterThanOrEqual(initialGenerators);
    });
  });

  describe('export capabilities', () => {
    it('should export charts as SVG', async () => {
      const chart = await visualizationEngine.generateChart('bar', [
        { category: 'A', value: 100 },
        { category: 'B', value: 150 }
      ]);

      const svgExport = await visualizationEngine.exportChart(chart.id, {
        format: 'svg',
        width: 800,
        height: 600
      });

      expect(svgExport).toBeDefined();
      expect(svgExport.format).toBe('svg');
      expect(svgExport.data).toContain('<svg');
      expect(svgExport.dimensions.width).toBe(800);
      expect(svgExport.dimensions.height).toBe(600);
    });

    it('should export charts as PNG', async () => {
      const chart = await visualizationEngine.generateChart('pie', [
        { category: 'A', value: 100 },
        { category: 'B', value: 150 }
      ]);

      const pngExport = await visualizationEngine.exportChart(chart.id, {
        format: 'png',
        width: 1200,
        height: 800,
        dpi: 300
      });

      expect(pngExport).toBeDefined();
      expect(pngExport.format).toBe('png');
      expect(pngExport.data).toMatch(/^data:image\/png;base64,/);
      expect(pngExport.size).toBeDefined();
    });

    it('should export charts as JSON data', async () => {
      const originalData = [
        { category: 'A', value: 100 },
        { category: 'B', value: 150 }
      ];

      const chart = await visualizationEngine.generateChart('bar', originalData);

      const jsonExport = await visualizationEngine.exportChart(chart.id, {
        format: 'json',
        includeConfig: true,
        includeMetadata: true
      });

      expect(jsonExport).toBeDefined();
      expect(jsonExport.format).toBe('json');
      expect(jsonExport.data.chartData).toEqual(originalData);
      expect(jsonExport.data.config).toBeDefined();
      expect(jsonExport.data.metadata).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle invalid data gracefully', async () => {
      const invalidData = [
        { invalid: 'structure' },
        null,
        undefined,
        { timestamp: 'invalid-date', value: 'not-a-number' }
      ];

      const chart = await visualizationEngine.generateChart('line', invalidData, {
        validateData: true
      });

      expect(chart).toBeDefined();
      expect(chart.warnings).toBeDefined();
      expect(chart.warnings.length).toBeGreaterThan(0);
      expect(chart.data.length).toBe(0); // No valid data points
    });

    it('should handle rendering failures', async () => {
      // Mock a rendering failure
      vi.spyOn(visualizationEngine, 'renderChart').mockRejectedValue(
        new Error('Rendering failed')
      );

      await expect(visualizationEngine.generateChart('line', [
        { timestamp: '2024-01-01', value: 1000 }
      ])).rejects.toThrow('Rendering failed');
    });

    it('should validate chart options', async () => {
      const data = [{ timestamp: '2024-01-01', value: 1000 }];

      await expect(visualizationEngine.generateChart('line', data, {
        width: -100 // Invalid width
      })).rejects.toThrow('Width must be positive');

      await expect(visualizationEngine.generateChart('line', data, {
        height: 'invalid' // Invalid height type
      })).rejects.toThrow('Height must be a number');
    });

    it('should handle memory limits', async () => {
      const hugeDataset = Array.from({ length: 1000000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        value: Math.random() * 1000
      }));

      await expect(visualizationEngine.generateChart('line', hugeDataset, {
        performance: {
          maxDataPoints: 10000,
          enforceLimit: true
        }
      })).rejects.toThrow('Dataset exceeds maximum allowed size');
    });
  });

  describe('accessibility features', () => {
    it('should generate accessible charts', async () => {
      const chart = await visualizationEngine.generateChart('bar', [
        { category: 'Product A', value: 100 },
        { category: 'Product B', value: 150 }
      ], {
        accessibility: {
          enabled: true,
          title: 'Product Sales Chart',
          description: 'Bar chart showing sales data for products A and B'
        }
      });

      expect(chart.config.accessibility.enabled).toBe(true);
      expect(chart.config.accessibility.title).toBeDefined();
      expect(chart.config.accessibility.description).toBeDefined();
      expect(chart.config.ariaLabels).toBeDefined();
    });

    it('should support keyboard navigation', async () => {
      const chart = await visualizationEngine.generateChart('line', [
        { timestamp: '2024-01-01', value: 1000 },
        { timestamp: '2024-01-02', value: 1100 }
      ], {
        accessibility: {
          keyboardNavigation: true,
          focusable: true
        }
      });

      expect(chart.config.accessibility.keyboardNavigation).toBe(true);
      expect(chart.config.accessibility.focusable).toBe(true);
    });

    it('should provide alt text for exported images', async () => {
      const chart = await visualizationEngine.generateChart('pie', [
        { category: 'A', value: 60 },
        { category: 'B', value: 40 }
      ], {
        accessibility: {
          altText: 'Pie chart showing 60% category A and 40% category B'
        }
      });

      const pngExport = await visualizationEngine.exportChart(chart.id, {
        format: 'png'
      });

      expect(pngExport.altText).toBe('Pie chart showing 60% category A and 40% category B');
    });
  });
});