import Papa from 'papaparse';
import { z } from 'zod';

class CSVDataImportService {
  constructor() {
    this.supportedDataTypes = [
      'financial_metrics',
      'cash_flow_transactions',
      'receivables_aging',
      'payables_schedule',
      'inventory_data',
      'sales_forecast',
      'expense_budget',
      'customer_data',
      'supplier_data',
      'seasonal_patterns',
      'industry_benchmarks',
      'growth_scenarios'
    ];

    this.validationSchemas = this.initializeValidationSchemas();
    this.csvTemplates = this.initializeCSVTemplates();
  }

  /**
   * Initialize validation schemas for each data type
   */
  initializeValidationSchemas() {
    return {
      financial_metrics: z.object({
        date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
        revenue: z.number().min(0, 'Revenue must be positive'),
        gross_profit: z.number().min(0, 'Gross profit must be positive'),
        operating_expenses: z.number().min(0, 'Operating expenses must be positive'),
        ebitda: z.number(),
        net_income: z.number(),
        cash_balance: z.number().min(0, 'Cash balance must be positive'),
        accounts_receivable: z.number().min(0, 'AR must be positive'),
        accounts_payable: z.number().min(0, 'AP must be positive'),
        inventory: z.number().min(0, 'Inventory must be positive'),
        working_capital: z.number(),
        employee_count: z.number().int().min(1, 'Employee count must be at least 1').optional()
      }),

      cash_flow_transactions: z.object({
        date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
        transaction_id: z.string().min(1, 'Transaction ID required'),
        type: z.enum(['inflow', 'outflow'], 'Type must be inflow or outflow'),
        category: z.enum(['revenue', 'expense', 'receivable_collection', 'payable_payment', 'investment', 'financing'], 'Invalid category'),
        amount: z.number().min(0, 'Amount must be positive'),
        description: z.string().min(1, 'Description required'),
        customer_supplier: z.string().optional(),
        payment_method: z.string().optional(),
        reference: z.string().optional()
      }),

      receivables_aging: z.object({
        customer_id: z.string().min(1, 'Customer ID required'),
        customer_name: z.string().min(1, 'Customer name required'),
        invoice_number: z.string().min(1, 'Invoice number required'),
        invoice_date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid invoice date'),
        due_date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid due date'),
        amount: z.number().min(0, 'Amount must be positive'),
        outstanding_amount: z.number().min(0, 'Outstanding amount must be positive'),
        days_outstanding: z.number().int().min(0, 'Days outstanding must be non-negative'),
        aging_bucket: z.enum(['current', '1-30', '31-60', '61-90', '90+'], 'Invalid aging bucket'),
        payment_terms: z.string().optional(),
        credit_limit: z.number().min(0).optional()
      }),

      payables_schedule: z.object({
        supplier_id: z.string().min(1, 'Supplier ID required'),
        supplier_name: z.string().min(1, 'Supplier name required'),
        invoice_number: z.string().min(1, 'Invoice number required'),
        invoice_date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid invoice date'),
        due_date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid due date'),
        amount: z.number().min(0, 'Amount must be positive'),
        outstanding_amount: z.number().min(0, 'Outstanding amount must be positive'),
        payment_terms: z.string().min(1, 'Payment terms required'),
        priority: z.enum(['high', 'medium', 'low'], 'Invalid priority'),
        category: z.enum(['raw_materials', 'services', 'utilities', 'rent', 'other'], 'Invalid category'),
        early_payment_discount: z.number().min(0).max(100).optional()
      }),

      inventory_data: z.object({
        sku: z.string().min(1, 'SKU required'),
        product_name: z.string().min(1, 'Product name required'),
        category: z.string().min(1, 'Category required'),
        current_stock: z.number().int().min(0, 'Current stock must be non-negative'),
        unit_cost: z.number().min(0, 'Unit cost must be positive'),
        selling_price: z.number().min(0, 'Selling price must be positive'),
        reorder_point: z.number().int().min(0, 'Reorder point must be non-negative'),
        lead_time_days: z.number().int().min(0, 'Lead time must be non-negative'),
        annual_demand: z.number().int().min(0, 'Annual demand must be non-negative'),
        supplier: z.string().optional(),
        last_order_date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid last order date').optional()
      }),

      sales_forecast: z.object({
        period: z.string().min(1, 'Period required (e.g., 2024-Q1, 2024-01)'),
        product_category: z.string().min(1, 'Product category required'),
        forecasted_revenue: z.number().min(0, 'Forecasted revenue must be positive'),
        forecasted_units: z.number().int().min(0, 'Forecasted units must be non-negative'),
        confidence_level: z.enum(['high', 'medium', 'low'], 'Invalid confidence level'),
        seasonality_factor: z.number().min(0, 'Seasonality factor must be positive').optional(),
        growth_rate: z.number().optional(),
        market_conditions: z.string().optional(),
        assumptions: z.string().optional()
      }),

      expense_budget: z.object({
        period: z.string().min(1, 'Period required'),
        expense_category: z.string().min(1, 'Expense category required'),
        budgeted_amount: z.number().min(0, 'Budgeted amount must be positive'),
        actual_amount: z.number().min(0, 'Actual amount must be positive').optional(),
        variance: z.number().optional(),
        payment_timing: z.enum(['monthly', 'quarterly', 'annually', 'one-time'], 'Invalid payment timing'),
        fixed_variable: z.enum(['fixed', 'variable', 'semi-variable'], 'Invalid expense type'),
        department: z.string().optional(),
        approval_required: z.boolean().optional()
      }),

      customer_data: z.object({
        customer_id: z.string().min(1, 'Customer ID required'),
        customer_name: z.string().min(1, 'Customer name required'),
        industry: z.string().min(1, 'Industry required'),
        annual_revenue: z.number().min(0, 'Annual revenue must be positive'),
        credit_rating: z.enum(['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D'], 'Invalid credit rating').optional(),
        payment_terms: z.string().min(1, 'Payment terms required'),
        average_order_value: z.number().min(0, 'AOV must be positive'),
        order_frequency: z.string().min(1, 'Order frequency required'),
        ltv: z.number().min(0, 'LTV must be positive').optional(),
        acquisition_cost: z.number().min(0, 'Acquisition cost must be positive').optional(),
        region: z.string().optional()
      }),

      supplier_data: z.object({
        supplier_id: z.string().min(1, 'Supplier ID required'),
        supplier_name: z.string().min(1, 'Supplier name required'),
        category: z.string().min(1, 'Category required'),
        payment_terms: z.string().min(1, 'Payment terms required'),
        lead_time_days: z.number().int().min(0, 'Lead time must be non-negative'),
        reliability_score: z.number().min(0).max(100, 'Reliability score must be 0-100'),
        annual_spend: z.number().min(0, 'Annual spend must be positive'),
        early_payment_discount: z.number().min(0).max(100).optional(),
        strategic_importance: z.enum(['critical', 'important', 'standard'], 'Invalid strategic importance'),
        backup_supplier: z.string().optional(),
        location: z.string().optional()
      }),

      seasonal_patterns: z.object({
        month: z.number().int().min(1).max(12, 'Month must be 1-12'),
        revenue_multiplier: z.number().min(0, 'Revenue multiplier must be positive'),
        expense_multiplier: z.number().min(0, 'Expense multiplier must be positive'),
        cash_flow_multiplier: z.number().min(0, 'Cash flow multiplier must be positive'),
        inventory_multiplier: z.number().min(0, 'Inventory multiplier must be positive'),
        description: z.string().optional(),
        historical_data_years: z.number().int().min(1, 'Historical years must be at least 1').optional()
      }),

      industry_benchmarks: z.object({
        industry: z.string().min(1, 'Industry required'),
        metric_name: z.string().min(1, 'Metric name required'),
        metric_value: z.number(),
        percentile_25: z.number().optional(),
        percentile_50: z.number().optional(),
        percentile_75: z.number().optional(),
        best_in_class: z.number().optional(),
        unit: z.string().min(1, 'Unit required'),
        data_source: z.string().optional(),
        last_updated: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date').optional()
      }),

      growth_scenarios: z.object({
        scenario_name: z.string().min(1, 'Scenario name required'),
        growth_rate: z.number(),
        timeframe_months: z.number().int().min(1, 'Timeframe must be at least 1 month'),
        revenue_impact: z.number(),
        cost_impact: z.number(),
        working_capital_impact: z.number(),
        funding_required: z.number().min(0, 'Funding required must be positive'),
        probability: z.number().min(0).max(100, 'Probability must be 0-100'),
        key_assumptions: z.string().optional(),
        risk_factors: z.string().optional()
      })
    };
  }

  /**
   * Initialize CSV templates for each data type
   */
  initializeCSVTemplates() {
    return {
      financial_metrics: {
        filename: 'financial_metrics_template.csv',
        headers: [
          'date', 'revenue', 'gross_profit', 'operating_expenses', 'ebitda', 
          'net_income', 'cash_balance', 'accounts_receivable', 'accounts_payable', 
          'inventory', 'working_capital', 'employee_count'
        ],
        sampleData: [
          ['2024-01-31', '500000', '200000', '150000', '50000', '30000', '100000', '80000', '60000', '120000', '140000', '25'],
          ['2024-02-29', '520000', '210000', '155000', '55000', '35000', '135000', '85000', '65000', '125000', '145000', '25'],
          ['2024-03-31', '480000', '190000', '148000', '42000', '25000', '160000', '75000', '58000', '115000', '132000', '26']
        ],
        description: 'Monthly financial metrics including revenue, expenses, cash position, and working capital components'
      },

      cash_flow_transactions: {
        filename: 'cash_flow_transactions_template.csv',
        headers: [
          'date', 'transaction_id', 'type', 'category', 'amount', 'description', 
          'customer_supplier', 'payment_method', 'reference'
        ],
        sampleData: [
          ['2024-01-15', 'TXN001', 'inflow', 'revenue', '25000', 'Product sales', 'Customer ABC Ltd', 'Bank Transfer', 'INV-001'],
          ['2024-01-16', 'TXN002', 'outflow', 'expense', '5000', 'Raw materials', 'Supplier XYZ', 'Credit Card', 'PO-001'],
          ['2024-01-17', 'TXN003', 'inflow', 'receivable_collection', '15000', 'Invoice payment', 'Customer DEF Ltd', 'Check', 'INV-002']
        ],
        description: 'Individual cash flow transactions for detailed cash flow analysis'
      },

      receivables_aging: {
        filename: 'receivables_aging_template.csv',
        headers: [
          'customer_id', 'customer_name', 'invoice_number', 'invoice_date', 'due_date', 
          'amount', 'outstanding_amount', 'days_outstanding', 'aging_bucket', 
          'payment_terms', 'credit_limit'
        ],
        sampleData: [
          ['CUST001', 'ABC Manufacturing Ltd', 'INV-001', '2024-01-01', '2024-01-31', '10000', '10000', '45', '31-60', 'Net 30', '50000'],
          ['CUST002', 'XYZ Retail Corp', 'INV-002', '2024-01-15', '2024-02-14', '15000', '7500', '20', '1-30', 'Net 30', '75000'],
          ['CUST003', 'DEF Services Ltd', 'INV-003', '2023-12-01', '2023-12-31', '8000', '8000', '75', '61-90', 'Net 30', '25000']
        ],
        description: 'Outstanding receivables with aging analysis for DSO optimization'
      },

      payables_schedule: {
        filename: 'payables_schedule_template.csv',
        headers: [
          'supplier_id', 'supplier_name', 'invoice_number', 'invoice_date', 'due_date', 
          'amount', 'outstanding_amount', 'payment_terms', 'priority', 'category', 
          'early_payment_discount'
        ],
        sampleData: [
          ['SUPP001', 'Raw Materials Inc', 'SUPP-001', '2024-01-01', '2024-02-01', '12000', '12000', 'Net 30', 'high', 'raw_materials', '2'],
          ['SUPP002', 'Office Supplies Ltd', 'SUPP-002', '2024-01-15', '2024-02-15', '3000', '3000', 'Net 30', 'low', 'services', '0'],
          ['SUPP003', 'Utilities Company', 'SUPP-003', '2024-01-20', '2024-02-20', '5000', '5000', 'Net 30', 'medium', 'utilities', '0']
        ],
        description: 'Outstanding payables schedule for DPO optimization and cash flow planning'
      },

      inventory_data: {
        filename: 'inventory_data_template.csv',
        headers: [
          'sku', 'product_name', 'category', 'current_stock', 'unit_cost', 'selling_price', 
          'reorder_point', 'lead_time_days', 'annual_demand', 'supplier', 'last_order_date'
        ],
        sampleData: [
          ['SKU001', 'Product A', 'Category 1', '500', '10.50', '25.00', '100', '14', '2400', 'Supplier ABC', '2024-01-01'],
          ['SKU002', 'Product B', 'Category 1', '250', '15.75', '35.00', '50', '21', '1200', 'Supplier XYZ', '2024-01-10'],
          ['SKU003', 'Product C', 'Category 2', '750', '8.25', '20.00', '150', '7', '3600', 'Supplier ABC', '2024-01-15']
        ],
        description: 'Inventory data for working capital optimization and demand planning'
      },

      sales_forecast: {
        filename: 'sales_forecast_template.csv',
        headers: [
          'period', 'product_category', 'forecasted_revenue', 'forecasted_units', 
          'confidence_level', 'seasonality_factor', 'growth_rate', 'market_conditions', 'assumptions'
        ],
        sampleData: [
          ['2024-Q2', 'Category 1', '600000', '2400', 'high', '1.1', '15', 'Stable', 'Based on historical trends'],
          ['2024-Q3', 'Category 1', '550000', '2200', 'medium', '0.9', '10', 'Declining', 'Summer slowdown expected'],
          ['2024-Q4', 'Category 2', '750000', '3000', 'high', '1.3', '25', 'Growing', 'Holiday season boost']
        ],
        description: 'Sales forecasts for cash flow planning and working capital requirements'
      },

      expense_budget: {
        filename: 'expense_budget_template.csv',
        headers: [
          'period', 'expense_category', 'budgeted_amount', 'actual_amount', 'variance', 
          'payment_timing', 'fixed_variable', 'department', 'approval_required'
        ],
        sampleData: [
          ['2024-Q2', 'Salaries', '150000', '148000', '-2000', 'monthly', 'fixed', 'All', 'false'],
          ['2024-Q2', 'Raw Materials', '200000', '210000', '10000', 'monthly', 'variable', 'Production', 'true'],
          ['2024-Q2', 'Marketing', '50000', '45000', '-5000', 'quarterly', 'semi-variable', 'Marketing', 'true']
        ],
        description: 'Expense budgets and actuals for cash flow forecasting'
      },

      customer_data: {
        filename: 'customer_data_template.csv',
        headers: [
          'customer_id', 'customer_name', 'industry', 'annual_revenue', 'credit_rating', 
          'payment_terms', 'average_order_value', 'order_frequency', 'ltv', 'acquisition_cost', 'region'
        ],
        sampleData: [
          ['CUST001', 'ABC Manufacturing', 'Manufacturing', '5000000', 'A', 'Net 30', '25000', 'Monthly', '300000', '5000', 'UK'],
          ['CUST002', 'XYZ Retail', 'Retail', '2000000', 'BBB', 'Net 45', '15000', 'Bi-weekly', '180000', '3000', 'EU'],
          ['CUST003', 'DEF Services', 'Services', '1000000', 'AA', 'Net 15', '8000', 'Weekly', '120000', '2000', 'US']
        ],
        description: 'Customer data for receivables analysis and credit risk assessment'
      },

      supplier_data: {
        filename: 'supplier_data_template.csv',
        headers: [
          'supplier_id', 'supplier_name', 'category', 'payment_terms', 'lead_time_days', 
          'reliability_score', 'annual_spend', 'early_payment_discount', 'strategic_importance', 
          'backup_supplier', 'location'
        ],
        sampleData: [
          ['SUPP001', 'Raw Materials Inc', 'Raw Materials', 'Net 30', '14', '95', '500000', '2', 'critical', 'SUPP004', 'UK'],
          ['SUPP002', 'Packaging Ltd', 'Packaging', 'Net 45', '7', '88', '150000', '1.5', 'important', 'SUPP005', 'EU'],
          ['SUPP003', 'Logistics Corp', 'Services', 'Net 60', '1', '92', '200000', '0', 'standard', '', 'Global']
        ],
        description: 'Supplier data for payables optimization and supply chain analysis'
      },

      seasonal_patterns: {
        filename: 'seasonal_patterns_template.csv',
        headers: [
          'month', 'revenue_multiplier', 'expense_multiplier', 'cash_flow_multiplier', 
          'inventory_multiplier', 'description', 'historical_data_years'
        ],
        sampleData: [
          ['1', '0.8', '1.0', '0.7', '1.2', 'Post-holiday slowdown', '3'],
          ['2', '0.9', '1.0', '0.8', '1.1', 'Winter period', '3'],
          ['3', '1.1', '1.0', '1.2', '1.0', 'Spring uptick', '3'],
          ['11', '1.3', '1.1', '1.4', '1.3', 'Holiday preparation', '3'],
          ['12', '1.5', '1.2', '1.6', '0.8', 'Holiday peak', '3']
        ],
        description: 'Seasonal patterns for accurate cash flow forecasting'
      },

      industry_benchmarks: {
        filename: 'industry_benchmarks_template.csv',
        headers: [
          'industry', 'metric_name', 'metric_value', 'percentile_25', 'percentile_50', 
          'percentile_75', 'best_in_class', 'unit', 'data_source', 'last_updated'
        ],
        sampleData: [
          ['Manufacturing', 'DSO', '35', '25', '35', '45', '20', 'days', 'Industry Report', '2024-01-01'],
          ['Manufacturing', 'DPO', '40', '30', '40', '50', '55', 'days', 'Industry Report', '2024-01-01'],
          ['Manufacturing', 'Inventory Turns', '8', '6', '8', '12', '15', 'turns/year', 'Industry Report', '2024-01-01']
        ],
        description: 'Industry benchmarks for performance comparison and target setting'
      },

      growth_scenarios: {
        filename: 'growth_scenarios_template.csv',
        headers: [
          'scenario_name', 'growth_rate', 'timeframe_months', 'revenue_impact', 'cost_impact', 
          'working_capital_impact', 'funding_required', 'probability', 'key_assumptions', 'risk_factors'
        ],
        sampleData: [
          ['Conservative Growth', '10', '12', '1000000', '600000', '150000', '200000', '80', 'Market stability', 'Economic downturn'],
          ['Aggressive Growth', '25', '12', '2500000', '1800000', '400000', '600000', '40', 'Market expansion', 'Competition, funding'],
          ['Moderate Growth', '15', '12', '1500000', '1000000', '200000', '300000', '70', 'Steady demand', 'Supply chain issues']
        ],
        description: 'Growth scenarios for strategic planning and funding requirements'
      }
    };
  }

  /**
   * Generate and download CSV template
   */
  generateCSVTemplate(dataType) {
    if (!this.csvTemplates[dataType]) {
      throw new Error(`Unsupported data type: ${dataType}`);
    }

    const template = this.csvTemplates[dataType];
    const csvContent = Papa.unparse({
      fields: template.headers,
      data: template.sampleData
    });

    return {
      filename: template.filename,
      content: csvContent,
      description: template.description,
      mimeType: 'text/csv'
    };
  }

  /**
   * Validate and parse CSV file
   */
  async validateAndParseCSV(file, dataType) {
    return new Promise((resolve, reject) => {
      if (!this.validationSchemas[dataType]) {
        reject(new Error(`Unsupported data type: ${dataType}`));
        return;
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_'),
        complete: (results) => {
          try {
            const validationSchema = z.array(this.validationSchemas[dataType]);
            const validatedData = validationSchema.parse(results.data);
            
            resolve({
              success: true,
              data: validatedData,
              rowCount: validatedData.length,
              errors: [],
              warnings: this.generateDataQualityWarnings(validatedData, dataType)
            });
          } catch (error) {
            const validationErrors = this.parseValidationErrors(error, results.data);
            resolve({
              success: false,
              data: [],
              rowCount: results.data.length,
              errors: validationErrors,
              warnings: []
            });
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Parse validation errors into user-friendly format
   */
  parseValidationErrors(error, data) {
    const errors = [];
    
    if (error.errors) {
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        const rowIndex = parseInt(path.split('.')[0]) + 1; // +1 for header row
        const field = path.split('.')[1];
        
        errors.push({
          row: rowIndex,
          field: field,
          value: err.received,
          message: err.message,
          code: err.code
        });
      });
    }

    return errors;
  }

  /**
   * Generate data quality warnings
   */
  generateDataQualityWarnings(data, dataType) {
    const warnings = [];

    // Check for missing optional fields that could improve analysis
    if (dataType === 'financial_metrics') {
      const missingEmployeeCount = data.filter(row => !row.employee_count).length;
      if (missingEmployeeCount > 0) {
        warnings.push({
          type: 'missing_optional_data',
          message: `${missingEmployeeCount} rows missing employee count - this data improves revenue per employee analysis`,
          impact: 'medium',
          suggestion: 'Consider adding employee count data for better benchmarking'
        });
      }
    }

    if (dataType === 'receivables_aging') {
      const missingCreditLimits = data.filter(row => !row.credit_limit).length;
      if (missingCreditLimits > 0) {
        warnings.push({
          type: 'missing_optional_data',
          message: `${missingCreditLimits} customers missing credit limits - this affects risk analysis`,
          impact: 'medium',
          suggestion: 'Add credit limits for better credit risk assessment'
        });
      }
    }

    // Check for data consistency issues
    if (dataType === 'cash_flow_transactions') {
      const futureTransactions = data.filter(row => new Date(row.date) > new Date()).length;
      if (futureTransactions > 0) {
        warnings.push({
          type: 'data_consistency',
          message: `${futureTransactions} transactions have future dates`,
          impact: 'high',
          suggestion: 'Verify transaction dates are correct'
        });
      }
    }

    return warnings;
  }

  /**
   * Identify missing data requirements
   */
  identifyMissingDataRequirements(availableDataTypes, analysisType = 'comprehensive') {
    const requirements = {
      comprehensive: [
        'financial_metrics',
        'cash_flow_transactions',
        'receivables_aging',
        'payables_schedule',
        'inventory_data'
      ],
      cash_flow_analysis: [
        'financial_metrics',
        'cash_flow_transactions',
        'receivables_aging',
        'payables_schedule'
      ],
      working_capital_optimization: [
        'financial_metrics',
        'receivables_aging',
        'payables_schedule',
        'inventory_data'
      ],
      growth_planning: [
        'financial_metrics',
        'sales_forecast',
        'expense_budget',
        'growth_scenarios'
      ],
      benchmarking: [
        'financial_metrics',
        'industry_benchmarks',
        'customer_data',
        'supplier_data'
      ]
    };

    const requiredDataTypes = requirements[analysisType] || requirements.comprehensive;
    const missingDataTypes = requiredDataTypes.filter(type => !availableDataTypes.includes(type));

    return {
      required: requiredDataTypes,
      available: availableDataTypes,
      missing: missingDataTypes,
      completeness: ((requiredDataTypes.length - missingDataTypes.length) / requiredDataTypes.length) * 100,
      recommendations: this.generateDataRecommendations(missingDataTypes, analysisType)
    };
  }

  /**
   * Generate recommendations for missing data
   */
  generateDataRecommendations(missingDataTypes, analysisType) {
    const recommendations = [];

    missingDataTypes.forEach(dataType => {
      const recommendation = {
        dataType,
        priority: this.getDataTypePriority(dataType, analysisType),
        impact: this.getDataTypeImpact(dataType, analysisType),
        description: this.getDataTypeDescription(dataType),
        sources: this.getDataTypeSources(dataType),
        template: this.csvTemplates[dataType]?.filename
      };
      recommendations.push(recommendation);
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get data type priority for analysis
   */
  getDataTypePriority(dataType, analysisType) {
    const priorities = {
      comprehensive: {
        financial_metrics: 'critical',
        cash_flow_transactions: 'high',
        receivables_aging: 'high',
        payables_schedule: 'high',
        inventory_data: 'medium',
        sales_forecast: 'medium',
        expense_budget: 'medium',
        customer_data: 'low',
        supplier_data: 'low',
        seasonal_patterns: 'low',
        industry_benchmarks: 'low',
        growth_scenarios: 'low'
      },
      cash_flow_analysis: {
        financial_metrics: 'critical',
        cash_flow_transactions: 'critical',
        receivables_aging: 'high',
        payables_schedule: 'high'
      },
      working_capital_optimization: {
        financial_metrics: 'critical',
        receivables_aging: 'critical',
        payables_schedule: 'critical',
        inventory_data: 'high'
      }
    };

    return priorities[analysisType]?.[dataType] || 'medium';
  }

  /**
   * Get data type impact description
   */
  getDataTypeImpact(dataType, analysisType) {
    const impacts = {
      financial_metrics: 'Essential for all financial analysis and benchmarking',
      cash_flow_transactions: 'Critical for accurate cash flow forecasting and trend analysis',
      receivables_aging: 'Required for DSO optimization and credit risk assessment',
      payables_schedule: 'Needed for DPO optimization and cash flow timing',
      inventory_data: 'Important for working capital optimization and demand planning',
      sales_forecast: 'Enables growth planning and funding requirement calculations',
      expense_budget: 'Supports cash flow forecasting and variance analysis',
      customer_data: 'Enhances receivables analysis and credit risk assessment',
      supplier_data: 'Improves payables optimization and supply chain analysis',
      seasonal_patterns: 'Increases forecast accuracy for seasonal businesses',
      industry_benchmarks: 'Provides context for performance evaluation',
      growth_scenarios: 'Essential for strategic planning and funding decisions'
    };

    return impacts[dataType] || 'Provides additional context for analysis';
  }

  /**
   * Get data type description
   */
  getDataTypeDescription(dataType) {
    return this.csvTemplates[dataType]?.description || 'Additional data for enhanced analysis';
  }

  /**
   * Get potential data sources
   */
  getDataTypeSources(dataType) {
    const sources = {
      financial_metrics: ['Accounting system', 'ERP system', 'Financial statements', 'Management reports'],
      cash_flow_transactions: ['Bank statements', 'Accounting system', 'Payment processors'],
      receivables_aging: ['Accounting system', 'CRM system', 'Invoicing software'],
      payables_schedule: ['Accounting system', 'ERP system', 'Supplier portals'],
      inventory_data: ['Inventory management system', 'ERP system', 'Warehouse management'],
      sales_forecast: ['CRM system', 'Sales team', 'Market research', 'Historical data'],
      expense_budget: ['Budgeting software', 'Financial planning system', 'Department budgets'],
      customer_data: ['CRM system', 'Sales database', 'Customer service system'],
      supplier_data: ['Procurement system', 'ERP system', 'Supplier database'],
      seasonal_patterns: ['Historical sales data', 'Industry reports', 'Market analysis'],
      industry_benchmarks: ['Industry associations', 'Market research', 'Financial databases'],
      growth_scenarios: ['Strategic planning', 'Market analysis', 'Financial modeling']
    };

    return sources[dataType] || ['Manual entry', 'External sources'];
  }

  /**
   * Generate user prompts for missing data
   */
  generateUserPrompts(missingDataRequirements) {
    const prompts = [];

    missingDataRequirements.recommendations.forEach(rec => {
      if (rec.priority === 'critical' || rec.priority === 'high') {
        prompts.push({
          type: 'data_required',
          priority: rec.priority,
          title: `${rec.dataType.replace(/_/g, ' ').toUpperCase()} Data Required`,
          message: `To provide accurate ${rec.dataType.replace(/_/g, ' ')} analysis, we need additional data.`,
          description: rec.description,
          impact: rec.impact,
          actions: [
            {
              type: 'download_template',
              label: 'Download CSV Template',
              filename: rec.template
            },
            {
              type: 'upload_data',
              label: 'Upload Data File',
              acceptedFormats: ['.csv']
            },
            {
              type: 'skip',
              label: 'Skip for Now',
              warning: 'Analysis accuracy will be reduced'
            }
          ],
          sources: rec.sources
        });
      }
    });

    return prompts;
  }

  /**
   * Get all available CSV templates
   */
  getAllTemplates() {
    return Object.keys(this.csvTemplates).map(dataType => ({
      dataType,
      filename: this.csvTemplates[dataType].filename,
      description: this.csvTemplates[dataType].description,
      headers: this.csvTemplates[dataType].headers,
      sampleRowCount: this.csvTemplates[dataType].sampleData.length
    }));
  }

  /**
   * Validate data completeness for specific analysis
   */
  validateDataCompleteness(availableData, analysisType) {
    const requirements = this.identifyMissingDataRequirements(
      Object.keys(availableData), 
      analysisType
    );

    const completenessScore = requirements.completeness;
    let analysisQuality = 'poor';
    
    if (completenessScore >= 90) analysisQuality = 'excellent';
    else if (completenessScore >= 75) analysisQuality = 'good';
    else if (completenessScore >= 50) analysisQuality = 'fair';

    return {
      completenessScore,
      analysisQuality,
      canProceed: completenessScore >= 50,
      requirements,
      recommendations: requirements.recommendations.filter(r => 
        r.priority === 'critical' || r.priority === 'high'
      )
    };
  }
}

export default CSVDataImportService;

