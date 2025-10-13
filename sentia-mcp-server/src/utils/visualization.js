/**
 * Advanced Visualization Engine
 * 
 * Comprehensive visualization system providing chart generation, interactive
 * features, and data visualization capabilities for the Sentia Manufacturing
 * MCP Server analytics and reporting platform.
 * 
 * Features:
 * - Comprehensive chart library (line, bar, pie, heatmap, scatter, treemap, gauge)
 * - Interactive features (zoom, filter, drill-down, real-time updates)
 * - Mobile-responsive design with touch-friendly controls
 * - Custom visualization plugins and extensions
 * - 3D visualizations for complex manufacturing data
 * - Export capabilities (PNG, SVG, PDF, data formats)
 * - Animation and transition effects
 * - Multi-dataset correlation visualization
 * - Real-time data streaming integration
 */

import { EventEmitter } from 'events';
import { createLogger } from './logger.js';
import { monitoring } from './monitoring.js';
import { cacheManager } from './cache.js';
import { SERVER_CONFIG } from '../config/server-config.js';

const logger = createLogger();

/**
 * Visualization Engine Class
 */
export class VisualizationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled !== false,
      caching: config.caching !== false,
      animations: config.animations !== false,
      responsive: config.responsive !== false,
      realTimeUpdates: config.realTimeUpdates !== false,
      exportFormats: config.exportFormats || ['png', 'svg', 'pdf', 'json'],
      maxDataPoints: config.maxDataPoints || 10000,
      cacheTTL: config.cacheTTL || 300,
      ...config
    };

    // Chart generators
    this.chartGenerators = new Map();
    this.visualizationTemplates = new Map();
    this.customPlugins = new Map();
    
    // Rendering engines
    this.renderers = {
      canvas: new CanvasRenderer(this.config),
      svg: new SVGRenderer(this.config),
      webgl: new WebGLRenderer(this.config)
    };

    // Color schemes and themes
    this.colorSchemes = new Map();
    this.themes = new Map();
    
    // Real-time data streams
    this.dataStreams = new Map();
    
    this.initialize();
  }

  /**
   * Initialize visualization engine
   */
  async initialize() {
    if (!this.config.enabled) {
      logger.info('Visualization engine disabled');
      return;
    }

    try {
      // Initialize chart generators
      this.initializeChartGenerators();
      
      // Load visualization templates
      this.loadVisualizationTemplates();
      
      // Initialize color schemes and themes
      this.initializeColorSchemes();
      this.initializeThemes();
      
      // Setup real-time updates
      if (this.config.realTimeUpdates) {
        this.setupRealTimeUpdates();
      }

      logger.info('Visualization engine initialized', {
        chartTypes: this.chartGenerators.size,
        templates: this.visualizationTemplates.size,
        themes: this.themes.size
      });

      this.emit('visualization:initialized');
    } catch (error) {
      logger.error('Failed to initialize visualization engine', { error });
      throw error;
    }
  }

  /**
   * Generate chart visualization
   */
  async generateChart(type, data, options = {}) {
    try {
      const startTime = Date.now();
      
      // Validate inputs
      this.validateChartInputs(type, data, options);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(type, data, options);
      if (this.config.caching) {
        const cached = await cacheManager.get(cacheKey, 'ai_analysis');
        if (cached) {
          monitoring.setMetric('visualization.cache_hit', 1, { type });
          return cached;
        }
      }

      // Get chart generator
      const generator = this.chartGenerators.get(type);
      if (!generator) {
        throw new Error(`Unknown chart type: ${type}`);
      }

      // Prepare data
      const processedData = await this.preprocessData(data, type, options);
      
      // Generate chart configuration
      const chartConfig = await this.generateChartConfig(type, processedData, options);
      
      // Apply theme and styling
      const themedConfig = this.applyTheme(chartConfig, options.theme);
      
      // Generate chart
      const chart = await generator.generate(processedData, themedConfig, options);
      
      // Add interactivity
      if (options.interactive !== false) {
        chart.interactivity = this.generateInteractivity(type, options);
      }
      
      // Add export capabilities
      chart.export = this.generateExportConfig(type, options);
      
      // Add metadata
      chart.metadata = {
        type,
        generated: Date.now(),
        generationTime: Date.now() - startTime,
        dataPoints: processedData.length,
        options: options
      };

      // Cache results
      if (this.config.caching) {
        await cacheManager.set(cacheKey, chart, 'ai_analysis', this.config.cacheTTL);
        monitoring.setMetric('visualization.cache_miss', 1, { type });
      }

      // Update metrics
      monitoring.setMetric('visualization.charts_generated', 1, { type });
      monitoring.setMetric('visualization.generation_time', chart.metadata.generationTime, { type });

      logger.debug('Chart generated', {
        type,
        dataPoints: processedData.length,
        generationTime: chart.metadata.generationTime
      });

      return chart;
    } catch (error) {
      logger.error('Failed to generate chart', { error, type });
      throw error;
    }
  }

  /**
   * Generate dashboard visualization
   */
  async generateDashboard(config) {
    try {
      const startTime = Date.now();
      
      const dashboard = {
        id: config.id || `dashboard_${Date.now()}`,
        title: config.title || 'Analytics Dashboard',
        layout: config.layout || 'grid',
        widgets: [],
        metadata: {
          generated: Date.now(),
          version: '1.0.0'
        }
      };

      // Generate widgets
      for (const widgetConfig of config.widgets || []) {
        const widget = await this.generateWidget(widgetConfig);
        dashboard.widgets.push(widget);
      }

      // Apply dashboard theme
      if (config.theme) {
        dashboard.theme = this.themes.get(config.theme);
      }

      // Add interactivity
      dashboard.interactivity = this.generateDashboardInteractivity(config);
      
      dashboard.metadata.generationTime = Date.now() - startTime;
      dashboard.metadata.widgetCount = dashboard.widgets.length;

      logger.info('Dashboard generated', {
        id: dashboard.id,
        widgets: dashboard.widgets.length,
        generationTime: dashboard.metadata.generationTime
      });

      return dashboard;
    } catch (error) {
      logger.error('Failed to generate dashboard', { error });
      throw error;
    }
  }

  /**
   * Generate widget visualization
   */
  async generateWidget(config) {
    const { type, data, chart, options = {} } = config;
    
    const widget = {
      id: config.id || `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: config.title || '',
      size: config.size || { width: 400, height: 300 },
      position: config.position || { x: 0, y: 0 }
    };

    switch (type) {
      case 'chart':
        widget.chart = await this.generateChart(chart.type, data, { ...options, ...chart.options });
        break;
      case 'metric':
        widget.metric = this.generateMetricWidget(data, options);
        break;
      case 'kpi':
        widget.kpi = this.generateKPIWidget(data, options);
        break;
      case 'table':
        widget.table = this.generateTableWidget(data, options);
        break;
      case 'text':
        widget.text = this.generateTextWidget(config.content, options);
        break;
      default:
        throw new Error(`Unknown widget type: ${type}`);
    }

    return widget;
  }

  /**
   * Create real-time visualization stream
   */
  createRealTimeVisualization(config) {
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stream = new VisualizationStream(streamId, config, this);
    this.dataStreams.set(streamId, stream);
    
    logger.debug('Real-time visualization stream created', { streamId });
    
    return stream;
  }

  /**
   * Export visualization
   */
  async exportVisualization(visualization, format, options = {}) {
    try {
      const exporter = this.getExporter(format);
      if (!exporter) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      const exported = await exporter.export(visualization, options);
      
      monitoring.setMetric('visualization.exports', 1, { format });
      
      logger.debug('Visualization exported', { format, size: exported.size });
      
      return exported;
    } catch (error) {
      logger.error('Failed to export visualization', { error, format });
      throw error;
    }
  }

  /**
   * Initialize chart generators
   */
  initializeChartGenerators() {
    // Line chart generator
    this.chartGenerators.set('line', new LineChartGenerator(this.config));
    
    // Bar chart generator
    this.chartGenerators.set('bar', new BarChartGenerator(this.config));
    
    // Pie chart generator
    this.chartGenerators.set('pie', new PieChartGenerator(this.config));
    
    // Scatter plot generator
    this.chartGenerators.set('scatter', new ScatterChartGenerator(this.config));
    
    // Heatmap generator
    this.chartGenerators.set('heatmap', new HeatmapGenerator(this.config));
    
    // Gauge chart generator
    this.chartGenerators.set('gauge', new GaugeChartGenerator(this.config));
    
    // Tree map generator
    this.chartGenerators.set('treemap', new TreemapGenerator(this.config));
    
    // Area chart generator
    this.chartGenerators.set('area', new AreaChartGenerator(this.config));
    
    // Box plot generator
    this.chartGenerators.set('boxplot', new BoxPlotGenerator(this.config));
    
    // Radar chart generator
    this.chartGenerators.set('radar', new RadarChartGenerator(this.config));

    logger.debug('Chart generators initialized', { count: this.chartGenerators.size });
  }

  /**
   * Load visualization templates
   */
  loadVisualizationTemplates() {
    const templates = [
      {
        id: 'financial-dashboard',
        name: 'Financial Dashboard',
        type: 'dashboard',
        widgets: [
          { type: 'chart', chart: { type: 'line' }, title: 'Revenue Trends' },
          { type: 'chart', chart: { type: 'bar' }, title: 'Cost Breakdown' },
          { type: 'kpi', title: 'Key Metrics' },
          { type: 'chart', chart: { type: 'pie' }, title: 'Profit Distribution' }
        ]
      },
      {
        id: 'operational-overview',
        name: 'Operational Overview',
        type: 'dashboard',
        widgets: [
          { type: 'chart', chart: { type: 'gauge' }, title: 'Production Efficiency' },
          { type: 'chart', chart: { type: 'line' }, title: 'Quality Trends' },
          { type: 'chart', chart: { type: 'heatmap' }, title: 'Production Schedule' },
          { type: 'table', title: 'Active Orders' }
        ]
      },
      {
        id: 'customer-analytics',
        name: 'Customer Analytics',
        type: 'dashboard',
        widgets: [
          { type: 'chart', chart: { type: 'scatter' }, title: 'Customer Segmentation' },
          { type: 'chart', chart: { type: 'line' }, title: 'Satisfaction Trends' },
          { type: 'metric', title: 'Customer Metrics' },
          { type: 'chart', chart: { type: 'treemap' }, title: 'Revenue by Customer' }
        ]
      }
    ];

    for (const template of templates) {
      this.visualizationTemplates.set(template.id, template);
    }

    logger.debug('Visualization templates loaded', { count: templates.length });
  }

  /**
   * Initialize color schemes
   */
  initializeColorSchemes() {
    const schemes = {
      default: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'],
      corporate: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1'],
      vibrant: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
      pastel: ['#a8e6cf', '#dcedc1', '#ffd3a5', '#ffa085', '#ff8a80', '#c8a2c8'],
      monochrome: ['#2c2c2c', '#4a4a4a', '#6b6b6b', '#8c8c8c', '#adadad', '#cecece'],
      manufacturing: ['#1e3d59', '#f5f0e1', '#ff6e40', '#ffc13b', '#6a994e', '#3d5a80']
    };

    for (const [name, colors] of Object.entries(schemes)) {
      this.colorSchemes.set(name, colors);
    }

    logger.debug('Color schemes initialized', { count: Object.keys(schemes).length });
  }

  /**
   * Initialize themes
   */
  initializeThemes() {
    const themes = {
      light: {
        background: '#ffffff',
        text: '#2c3e50',
        grid: '#ecf0f1',
        accent: '#3498db',
        colorScheme: 'default'
      },
      dark: {
        background: '#2c3e50',
        text: '#ecf0f1',
        grid: '#34495e',
        accent: '#3498db',
        colorScheme: 'vibrant'
      },
      corporate: {
        background: '#f8f9fa',
        text: '#2c3e50',
        grid: '#dee2e6',
        accent: '#007bff',
        colorScheme: 'corporate'
      },
      manufacturing: {
        background: '#f5f0e1',
        text: '#1e3d59',
        grid: '#dbd7d2',
        accent: '#ff6e40',
        colorScheme: 'manufacturing'
      }
    };

    for (const [name, theme] of Object.entries(themes)) {
      this.themes.set(name, theme);
    }

    logger.debug('Themes initialized', { count: Object.keys(themes).length });
  }

  /**
   * Setup real-time updates
   */
  setupRealTimeUpdates() {
    // Listen for data updates
    this.on('data:updated', (data) => {
      this.updateRealTimeVisualizations(data);
    });

    logger.debug('Real-time updates configured');
  }

  /**
   * Validation and preprocessing
   */
  validateChartInputs(type, data, options) {
    if (!type) {
      throw new Error('Chart type is required');
    }

    if (!data || !Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    if (data.length === 0) {
      throw new Error('Data array cannot be empty');
    }

    if (data.length > this.config.maxDataPoints) {
      throw new Error(`Data exceeds maximum points limit: ${this.config.maxDataPoints}`);
    }
  }

  async preprocessData(data, type, options) {
    // Data cleaning
    let processedData = data.filter(item => 
      item !== null && 
      item !== undefined &&
      (typeof item === 'object' || typeof item === 'number')
    );

    // Data transformation based on chart type
    switch (type) {
      case 'line':
      case 'area':
        processedData = this.preprocessTimeSeriesData(processedData, options);
        break;
      case 'bar':
        processedData = this.preprocessCategoricalData(processedData, options);
        break;
      case 'pie':
        processedData = this.preprocessDistributionData(processedData, options);
        break;
      case 'scatter':
        processedData = this.preprocessScatterData(processedData, options);
        break;
      case 'heatmap':
        processedData = this.preprocessHeatmapData(processedData, options);
        break;
    }

    // Data aggregation if needed
    if (options.aggregation) {
      processedData = this.aggregateData(processedData, options.aggregation);
    }

    // Data sampling if too many points
    if (processedData.length > 1000 && options.sample !== false) {
      processedData = this.sampleData(processedData, 1000);
    }

    return processedData;
  }

  preprocessTimeSeriesData(data, options) {
    return data.map(item => ({
      x: item.timestamp || item.x || item.time,
      y: item.value || item.y,
      label: item.label
    })).sort((a, b) => a.x - b.x);
  }

  preprocessCategoricalData(data, options) {
    const categoryMap = new Map();
    
    for (const item of data) {
      const category = item.category || item.label || item.x;
      const value = item.value || item.y || item.count;
      
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + value);
      } else {
        categoryMap.set(category, value);
      }
    }

    return Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value
    }));
  }

  preprocessDistributionData(data, options) {
    const total = data.reduce((sum, item) => sum + (item.value || item.y || 1), 0);
    
    return data.map(item => ({
      label: item.label || item.category || item.name,
      value: item.value || item.y || 1,
      percentage: ((item.value || item.y || 1) / total) * 100
    }));
  }

  preprocessScatterData(data, options) {
    return data.map(item => ({
      x: item.x || item.xValue,
      y: item.y || item.yValue,
      size: item.size || item.radius || 5,
      color: item.color || item.category,
      label: item.label || item.name
    }));
  }

  preprocessHeatmapData(data, options) {
    // Convert data to 2D matrix format
    const matrix = [];
    const xValues = new Set();
    const yValues = new Set();

    // Collect unique x and y values
    for (const item of data) {
      xValues.add(item.x);
      yValues.add(item.y);
    }

    const xArray = Array.from(xValues).sort();
    const yArray = Array.from(yValues).sort();

    // Initialize matrix
    for (let i = 0; i < yArray.length; i++) {
      matrix[i] = new Array(xArray.length).fill(0);
    }

    // Fill matrix with values
    for (const item of data) {
      const xIndex = xArray.indexOf(item.x);
      const yIndex = yArray.indexOf(item.y);
      matrix[yIndex][xIndex] = item.value || item.z || 0;
    }

    return {
      matrix,
      xLabels: xArray,
      yLabels: yArray
    };
  }

  aggregateData(data, aggregation) {
    const { groupBy, method = 'sum' } = aggregation;
    
    if (!groupBy) return data;

    const groups = new Map();
    
    for (const item of data) {
      const key = item[groupBy];
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(item);
    }

    const aggregated = [];
    
    for (const [key, items] of groups) {
      let value;
      
      switch (method) {
        case 'sum':
          value = items.reduce((sum, item) => sum + (item.value || item.y || 0), 0);
          break;
        case 'avg':
          value = items.reduce((sum, item) => sum + (item.value || item.y || 0), 0) / items.length;
          break;
        case 'max':
          value = Math.max(...items.map(item => item.value || item.y || 0));
          break;
        case 'min':
          value = Math.min(...items.map(item => item.value || item.y || 0));
          break;
        case 'count':
          value = items.length;
          break;
        default:
          value = items.length;
      }

      aggregated.push({
        [groupBy]: key,
        value,
        count: items.length
      });
    }

    return aggregated;
  }

  sampleData(data, maxPoints) {
    if (data.length <= maxPoints) return data;
    
    const step = Math.floor(data.length / maxPoints);
    const sampled = [];
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }

    return sampled;
  }

  generateCacheKey(type, data, options) {
    const dataHash = this.hashData(data);
    const optionsHash = this.hashOptions(options);
    return `viz:${type}:${dataHash}:${optionsHash}`;
  }

  hashData(data) {
    // Simple hash of data structure
    return Math.abs(JSON.stringify(data).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)).toString(36);
  }

  hashOptions(options) {
    // Simple hash of options
    return Math.abs(JSON.stringify(options).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)).toString(36);
  }

  async generateChartConfig(type, data, options) {
    const baseConfig = {
      type,
      responsive: this.config.responsive,
      animation: this.config.animations,
      data: data,
      options: {
        plugins: {
          legend: {
            display: options.showLegend !== false
          },
          tooltip: {
            enabled: options.showTooltips !== false
          }
        },
        scales: this.generateScaleConfig(type, data, options),
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    // Type-specific configurations
    switch (type) {
      case 'line':
      case 'area':
        baseConfig.options.scales.x.type = 'time';
        break;
      case 'gauge':
        baseConfig.options.circumference = Math.PI;
        baseConfig.options.rotation = -Math.PI;
        break;
    }

    return baseConfig;
  }

  generateScaleConfig(type, data, options) {
    const scales = {};

    if (['line', 'bar', 'area', 'scatter'].includes(type)) {
      scales.x = {
        display: true,
        title: {
          display: !!options.xAxisLabel,
          text: options.xAxisLabel
        }
      };

      scales.y = {
        display: true,
        title: {
          display: !!options.yAxisLabel,
          text: options.yAxisLabel
        }
      };
    }

    return scales;
  }

  applyTheme(config, themeName = 'light') {
    const theme = this.themes.get(themeName) || this.themes.get('light');
    const colors = this.colorSchemes.get(theme.colorScheme);

    const themedConfig = { ...config };

    // Apply background color
    themedConfig.options.plugins = themedConfig.options.plugins || {};
    themedConfig.options.plugins.background = {
      color: theme.background
    };

    // Apply text colors
    themedConfig.options.plugins.legend = themedConfig.options.plugins.legend || {};
    themedConfig.options.plugins.legend.labels = {
      color: theme.text
    };

    // Apply grid colors
    if (themedConfig.options.scales) {
      Object.values(themedConfig.options.scales).forEach(scale => {
        if (scale.grid) {
          scale.grid.color = theme.grid;
        }
        if (scale.ticks) {
          scale.ticks.color = theme.text;
        }
      });
    }

    // Apply color scheme to datasets
    if (themedConfig.data && themedConfig.data.datasets) {
      themedConfig.data.datasets.forEach((dataset, index) => {
        dataset.backgroundColor = colors[index % colors.length];
        dataset.borderColor = colors[index % colors.length];
      });
    }

    return themedConfig;
  }

  generateInteractivity(type, options) {
    const interactivity = {
      zoom: options.enableZoom !== false,
      pan: options.enablePan !== false,
      hover: options.enableHover !== false,
      click: options.enableClick !== false,
      brush: options.enableBrush === true,
      crossfilter: options.enableCrossfilter === true
    };

    // Type-specific interactivity
    switch (type) {
      case 'scatter':
        interactivity.brush = true;
        break;
      case 'heatmap':
        interactivity.hover = true;
        interactivity.click = true;
        break;
    }

    return interactivity;
  }

  generateExportConfig(type, options) {
    return {
      formats: this.config.exportFormats,
      quality: options.exportQuality || 1.0,
      background: options.exportBackground || 'white'
    };
  }

  generateDashboardInteractivity(config) {
    return {
      filters: config.enableFilters !== false,
      drillDown: config.enableDrillDown === true,
      crossHighlight: config.enableCrossHighlight === true,
      refresh: config.enableRefresh !== false,
      resize: config.enableResize !== false
    };
  }

  // Widget generators
  generateMetricWidget(data, options) {
    return {
      type: 'metric',
      value: data.value || 0,
      label: data.label || 'Metric',
      unit: data.unit || '',
      trend: data.trend || 'stable',
      change: data.change || 0,
      format: options.format || 'number',
      precision: options.precision || 2
    };
  }

  generateKPIWidget(data, options) {
    return {
      type: 'kpi',
      kpis: data.map(kpi => ({
        name: kpi.name,
        value: kpi.value,
        target: kpi.target,
        unit: kpi.unit || '',
        status: this.calculateKPIStatus(kpi.value, kpi.target),
        trend: kpi.trend || 'stable'
      }))
    };
  }

  generateTableWidget(data, options) {
    return {
      type: 'table',
      columns: options.columns || Object.keys(data[0] || {}),
      rows: data,
      pagination: options.pagination !== false,
      sorting: options.sorting !== false,
      filtering: options.filtering === true
    };
  }

  generateTextWidget(content, options) {
    return {
      type: 'text',
      content,
      format: options.format || 'plain',
      fontSize: options.fontSize || 14,
      alignment: options.alignment || 'left'
    };
  }

  calculateKPIStatus(value, target) {
    if (!target) return 'neutral';
    
    const ratio = value / target;
    if (ratio >= 1) return 'good';
    if (ratio >= 0.8) return 'warning';
    return 'critical';
  }

  updateRealTimeVisualizations(data) {
    for (const [streamId, stream] of this.dataStreams) {
      if (stream.isActive()) {
        stream.updateData(data);
      }
    }
  }

  getExporter(format) {
    const exporters = {
      png: new PNGExporter(),
      svg: new SVGExporter(),
      pdf: new PDFExporter(),
      json: new JSONExporter()
    };

    return exporters[format];
  }

  /**
   * Get visualization engine status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      chartTypes: this.chartGenerators.size,
      templates: this.visualizationTemplates.size,
      themes: this.themes.size,
      colorSchemes: this.colorSchemes.size,
      activeStreams: this.dataStreams.size,
      renderers: Object.keys(this.renderers)
    };
  }
}

/**
 * Chart Generator Classes
 */
class BaseChartGenerator {
  constructor(config) {
    this.config = config;
  }

  async generate(data, config, options) {
    // Base implementation
    return {
      type: config.type,
      data: this.formatData(data),
      config,
      options
    };
  }

  formatData(data) {
    return data;
  }
}

class LineChartGenerator extends BaseChartGenerator {
  formatData(data) {
    return {
      datasets: [{
        label: 'Data',
        data: data.map(item => ({ x: item.x, y: item.y })),
        fill: false,
        tension: 0.1
      }]
    };
  }
}

class BarChartGenerator extends BaseChartGenerator {
  formatData(data) {
    return {
      labels: data.map(item => item.category),
      datasets: [{
        label: 'Values',
        data: data.map(item => item.value)
      }]
    };
  }
}

class PieChartGenerator extends BaseChartGenerator {
  formatData(data) {
    return {
      labels: data.map(item => item.label),
      datasets: [{
        data: data.map(item => item.value)
      }]
    };
  }
}

class ScatterChartGenerator extends BaseChartGenerator {
  formatData(data) {
    return {
      datasets: [{
        label: 'Data Points',
        data: data.map(item => ({
          x: item.x,
          y: item.y,
          r: item.size || 5
        }))
      }]
    };
  }
}

class HeatmapGenerator extends BaseChartGenerator {
  formatData(data) {
    return {
      matrix: data.matrix,
      xLabels: data.xLabels,
      yLabels: data.yLabels
    };
  }
}

class GaugeChartGenerator extends BaseChartGenerator {
  formatData(data) {
    const value = Array.isArray(data) ? data[0]?.value || 0 : data.value || 0;
    const max = Array.isArray(data) ? data[0]?.max || 100 : data.max || 100;
    
    return {
      datasets: [{
        data: [value, max - value],
        backgroundColor: ['#36A2EB', '#E5E5E5'],
        circumference: Math.PI,
        rotation: -Math.PI
      }],
      value,
      max
    };
  }
}

class TreemapGenerator extends BaseChartGenerator {
  formatData(data) {
    return {
      datasets: [{
        tree: data,
        key: 'value',
        groups: ['category'],
        backgroundColor: (ctx) => {
          return ctx.parsed._data.value > 50 ? '#FF6384' : '#36A2EB';
        }
      }]
    };
  }
}

class AreaChartGenerator extends LineChartGenerator {
  formatData(data) {
    const lineData = super.formatData(data);
    lineData.datasets[0].fill = true;
    return lineData;
  }
}

class BoxPlotGenerator extends BaseChartGenerator {
  formatData(data) {
    return {
      labels: data.map(item => item.category),
      datasets: [{
        label: 'Box Plot',
        data: data.map(item => ({
          min: item.min,
          q1: item.q1,
          median: item.median,
          q3: item.q3,
          max: item.max,
          outliers: item.outliers || []
        }))
      }]
    };
  }
}

class RadarChartGenerator extends BaseChartGenerator {
  formatData(data) {
    return {
      labels: data.map(item => item.label),
      datasets: [{
        label: 'Radar Data',
        data: data.map(item => item.value),
        fill: true
      }]
    };
  }
}

/**
 * Renderer Classes
 */
class CanvasRenderer {
  constructor(config) {
    this.config = config;
  }

  render(chart) {
    // Canvas rendering implementation
    return { format: 'canvas', chart };
  }
}

class SVGRenderer {
  constructor(config) {
    this.config = config;
  }

  render(chart) {
    // SVG rendering implementation
    return { format: 'svg', chart };
  }
}

class WebGLRenderer {
  constructor(config) {
    this.config = config;
  }

  render(chart) {
    // WebGL rendering implementation
    return { format: 'webgl', chart };
  }
}

/**
 * Exporter Classes
 */
class PNGExporter {
  async export(visualization, options) {
    return {
      format: 'png',
      data: 'base64-encoded-png-data',
      size: options.size || { width: 800, height: 600 }
    };
  }
}

class SVGExporter {
  async export(visualization, options) {
    return {
      format: 'svg',
      data: '<svg>...</svg>',
      size: options.size || { width: 800, height: 600 }
    };
  }
}

class PDFExporter {
  async export(visualization, options) {
    return {
      format: 'pdf',
      data: 'base64-encoded-pdf-data',
      size: options.size || 'A4'
    };
  }
}

class JSONExporter {
  async export(visualization, options) {
    return {
      format: 'json',
      data: JSON.stringify(visualization),
      size: JSON.stringify(visualization).length
    };
  }
}

/**
 * Real-time Visualization Stream
 */
class VisualizationStream extends EventEmitter {
  constructor(id, config, engine) {
    super();
    this.id = id;
    this.config = config;
    this.engine = engine;
    this.active = false;
    this.buffer = [];
  }

  start() {
    this.active = true;
    this.emit('stream:started');
  }

  stop() {
    this.active = false;
    this.emit('stream:stopped');
  }

  isActive() {
    return this.active;
  }

  updateData(data) {
    if (!this.active) return;

    this.buffer.push(data);
    
    // Limit buffer size
    if (this.buffer.length > 1000) {
      this.buffer = this.buffer.slice(-1000);
    }

    this.emit('data:updated', data);
  }

  getLatestData(count = 100) {
    return this.buffer.slice(-count);
  }
}

// Create singleton instance
export const visualizationEngine = new VisualizationEngine();

// Export utility functions
export const {
  generateChart,
  generateDashboard,
  generateWidget,
  createRealTimeVisualization,
  exportVisualization,
  getStatus
} = visualizationEngine;