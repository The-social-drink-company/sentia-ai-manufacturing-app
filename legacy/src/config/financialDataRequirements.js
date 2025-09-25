/**
 * SENTIA MANUFACTURING - FINANCIAL DATA REQUIREMENTS
 * NO MOCK DATA - REAL DATA ONLY FROM APIs, CSV IMPORTS, AND LLMs
 *
 * This configuration defines ALL required financial metrics that MUST be
 * populated from real data sources. If data is not available, display 0
 * with a clear message to the user about required data import.
 */

export const FINANCIAL_DATA_REQUIREMENTS = {
  // Core Financial Metrics (REQUIRED)
  coreMetrics: {
    annualRevenue: {
      field: 'annual_revenue_gbp',
      required: true,
      source: ['xero_api', 'csv_import', 'quickbooks_api'],
      defaultValue: 0,
      unit: 'GBP',
      missingDataMessage: 'Annual Revenue data required. Please connect accounting system (Xero/QuickBooks) or import via CSV.',
      validation: {
        min: 0,
        max: 1000000000, // Â£1B max
        type: 'currency'
      }
    },
    grossMargin: {
      field: 'gross_margin_percentage',
      required: true,
      source: ['xero_api', 'csv_import', 'calculated'],
      defaultValue: 0,
      unit: '%',
      missingDataMessage: 'Gross Margin data required. Import P&L statement or connect accounting API.',
      validation: {
        min: 0,
        max: 100,
        type: 'percentage'
      }
    },
    netMargin: {
      field: 'net_margin_percentage',
      required: true,
      source: ['xero_api', 'csv_import', 'calculated'],
      defaultValue: 0,
      unit: '%',
      missingDataMessage: 'Net Margin data required. Import P&L statement or connect accounting API.',
      validation: {
        min: -100,
        max: 100,
        type: 'percentage'
      }
    },
    ebitda: {
      field: 'ebitda_average',
      required: true,
      source: ['xero_api', 'csv_import', 'calculated'],
      defaultValue: 0,
      unit: 'GBP',
      missingDataMessage: 'EBITDA data required. Connect accounting system or import financial statements.',
      calculation: 'revenue - cost_of_goods - operating_expenses + depreciation + amortization',
      validation: {
        type: 'currency'
      }
    }
  },

  // Working Capital Metrics (CRITICAL)
  workingCapitalMetrics: {
    averageDebtorDays: {
      field: 'dso_days',
      required: true,
      source: ['xero_api', 'csv_import', 'calculated'],
      defaultValue: 0,
      unit: 'days',
      missingDataMessage: 'Debtor Days (DSO) required. Import aged receivables report or connect accounting API.',
      calculation: '(accounts_receivable / revenue) * 365',
      validation: {
        min: 0,
        max: 365,
        type: 'integer'
      }
    },
    averageCreditorDays: {
      field: 'dpo_days',
      required: true,
      source: ['xero_api', 'csv_import', 'calculated'],
      defaultValue: 0,
      unit: 'days',
      missingDataMessage: 'Creditor Days (DPO) required. Import aged payables report or connect accounting API.',
      calculation: '(accounts_payable / cost_of_goods) * 365',
      validation: {
        min: 0,
        max: 365,
        type: 'integer'
      }
    },
    currentDebtors: {
      field: 'current_debtors_gbp',
      required: true,
      source: ['xero_api', 'bank_api', 'csv_import'],
      defaultValue: 0,
      unit: 'GBP',
      missingDataMessage: 'Current Debtors balance required. Connect Xero/QuickBooks or import aged receivables CSV.',
      validation: {
        min: 0,
        type: 'currency'
      }
    },
    currentCreditors: {
      field: 'current_creditors_gbp',
      required: true,
      source: ['xero_api', 'bank_api', 'csv_import'],
      defaultValue: 0,
      unit: 'GBP',
      missingDataMessage: 'Current Creditors balance required. Connect Xero/QuickBooks or import aged payables CSV.',
      validation: {
        min: 0,
        type: 'currency'
      }
    }
  },

  // Cash Position Metrics
  cashMetrics: {
    currentCashOnHand: {
      field: 'current_cash_balance',
      required: true,
      source: ['bank_api', 'xero_api', 'csv_import'],
      defaultValue: 0,
      unit: 'GBP',
      missingDataMessage: 'Current Cash balance required. Connect bank API or import bank statement CSV.',
      realTimeUpdate: true,
      validation: {
        min: 0,
        type: 'currency'
      }
    },
    averageBankBalance: {
      field: 'average_bank_balance_gbp',
      required: true,
      source: ['bank_api', 'csv_import', 'calculated'],
      defaultValue: 0,
      unit: 'GBP',
      missingDataMessage: 'Average Bank Balance required. Connect banking API or import 90-day bank statements.',
      calculation: 'sum(daily_balances) / count(days)',
      validation: {
        min: 0,
        type: 'currency'
      }
    }
  },

  // Industry & Benchmarking Data
  benchmarkingData: {
    industry: {
      field: 'industry_classification',
      required: true,
      source: ['user_input', 'companies_house_api', 'llm_classification'],
      defaultValue: '',
      missingDataMessage: 'Industry classification required for benchmarking. Select your industry or import from Companies House.',
      validation: {
        type: 'enum',
        values: ['Manufacturing', 'Retail', 'Services', 'Construction', 'Technology', 'Healthcare', 'Professional Services']
      }
    },
    companyType: {
      field: 'company_type',
      required: true,
      source: ['user_input', 'companies_house_api'],
      defaultValue: '',
      missingDataMessage: 'Company type required. Specify if Listed or SME for accurate benchmarks.',
      validation: {
        type: 'enum',
        values: ['Listed', 'SME', 'Startup', 'Enterprise']
      }
    },
    numberOfEmployees: {
      field: 'employee_count',
      required: true,
      source: ['user_input', 'payroll_api', 'csv_import'],
      defaultValue: 0,
      unit: 'employees',
      missingDataMessage: 'Employee count required for productivity benchmarks. Import from payroll or enter manually.',
      validation: {
        min: 1,
        max: 100000,
        type: 'integer'
      }
    },
    revenuePerEmployee: {
      field: 'revenue_per_employee',
      required: false,
      source: ['calculated', 'llm_benchmark'],
      defaultValue: 0,
      unit: 'GBP',
      calculation: 'annual_revenue_gbp / employee_count',
      benchmarkSource: 'llm_industry_analysis'
    }
  },

  // Inventory Metrics (Conditional)
  inventoryMetrics: {
    usesInventory: {
      field: 'uses_inventory',
      required: true,
      source: ['user_input', 'business_model_detection'],
      defaultValue: null,
      missingDataMessage: 'Please specify if your business uses inventory (products) or is services-only.',
      validation: {
        type: 'boolean'
      }
    },
    inventoryTurnsPerYear: {
      field: 'inventory_turns',
      required: false, // Only if usesInventory = true
      source: ['xero_api', 'csv_import', 'calculated'],
      defaultValue: 0,
      unit: 'turns/year',
      missingDataMessage: 'Inventory turns required for product businesses. Import stock reports or connect inventory system.',
      calculation: 'cost_of_goods_sold / average_inventory',
      conditionalOn: 'uses_inventory === true',
      validation: {
        min: 0,
        max: 365,
        type: 'decimal'
      }
    },
    inventoryModel: {
      field: 'inventory_model',
      required: false,
      source: ['user_input'],
      defaultValue: '',
      missingDataMessage: 'Specify inventory model: Purchased, Manufactured, or Both (Kitting).',
      conditionalOn: 'uses_inventory === true',
      validation: {
        type: 'enum',
        values: ['Purchased', 'Manufactured', 'Both/Kitting']
      }
    }
  },

  // Growth & Scenario Planning (Interactive Sliders)
  scenarioInputs: {
    revenueGrowthRate: {
      field: 'revenue_growth_rate',
      required: false,
      source: ['user_slider_input'],
      defaultValue: 0,
      unit: '%',
      range: {
        min: -50,
        max: 100,
        step: 1
      },
      description: 'Expected revenue growth (positive or negative)',
      impact: 'working_capital_requirement'
    },
    reduceDebtorDaysBy: {
      field: 'dso_reduction_days',
      required: false,
      source: ['user_slider_input'],
      defaultValue: 0,
      unit: 'days',
      range: {
        min: 0,
        max: 30,
        step: 1
      },
      description: 'Get paid faster - reduce debtor days',
      impact: 'cash_unlock_potential'
    },
    extendCreditorDaysBy: {
      field: 'dpo_extension_days',
      required: false,
      source: ['user_slider_input'],
      defaultValue: 0,
      unit: 'days',
      range: {
        min: 0,
        max: 30,
        step: 1
      },
      description: 'Pay suppliers later - extend creditor days',
      impact: 'cash_flow_improvement'
    }
  }
};

// API Configuration for Data Sources
export const DATA_SOURCE_APIS = {
  xero: {
    enabled: true,
    endpoints: {
      invoices: '/api/xero/invoices',
      bills: '/api/xero/bills',
      bankStatements: '/api/xero/bank-statements',
      balanceSheet: '/api/xero/balance-sheet',
      profitLoss: '/api/xero/profit-loss'
    }
  },
  quickbooks: {
    enabled: true,
    endpoints: {
      customers: '/api/quickbooks/customers',
      vendors: '/api/quickbooks/vendors',
      cashFlow: '/api/quickbooks/cash-flow',
      financials: '/api/quickbooks/financial-statements'
    }
  },
  bankingApis: {
    openBanking: {
      enabled: true,
      endpoint: '/api/open-banking/accounts'
    },
    plaid: {
      enabled: true,
      endpoint: '/api/plaid/accounts'
    }
  },
  llmBenchmarking: {
    enabled: true,
    endpoint: '/api/mcp/benchmark-research',
    models: ['claude-3.5-sonnet', 'gpt-4-turbo'],
    prompts: {
      industryBenchmarks: 'Provide industry benchmarks for {industry} companies with {revenue} annual revenue',
      cashCycleBenchmarks: 'What are typical DSO, DPO, and DIO metrics for {industry} sector',
      growthFunding: 'Calculate funding requirements for {growthRate}% growth in {industry} sector'
    }
  }
};

// CSV Import Templates
export const CSV_IMPORT_TEMPLATES = {
  financialMetrics: {
    columns: [
      'Date',
      'Annual Revenue',
      'Gross Margin %',
      'Net Margin %',
      'EBITDA',
      'Cash Balance',
      'Accounts Receivable',
      'Accounts Payable',
      'Inventory Value'
    ],
    sampleRow: [
      '2024-12-01',
      '5000000',
      '35',
      '12',
      '600000',
      '250000',
      '420000',
      '380000',
      '180000'
    ]
  },
  agedReceivables: {
    columns: [
      'Customer',
      'Invoice Number',
      'Invoice Date',
      'Due Date',
      'Amount',
      'Days Outstanding'
    ]
  },
  agedPayables: {
    columns: [
      'Supplier',
      'Bill Number',
      'Bill Date',
      'Due Date',
      'Amount',
      'Days Outstanding'
    ]
  }
};

// Data Validation Rules
export const VALIDATION_RULES = {
  requireRealData: true,
  rejectMockData: true,
  zeroFallback: true,
  userNotification: {
    enabled: true,
    style: 'alert',
    actionButtons: ['Import CSV', 'Connect API', 'Enter Manually']
  }
};

// Financial Algorithms
export const FINANCIAL_ALGORITHMS = {
  cashRunwayDays: {
    formula: 'current_cash / (monthly_burn_rate / 30)',
    inputs: ['current_cash', 'monthly_expenses', 'monthly_revenue']
  },
  workingCapitalRequirement: {
    formula: '(DSO * daily_sales) + inventory - (DPO * daily_cogs)',
    inputs: ['dso_days', 'annual_revenue', 'inventory_value', 'dpo_days', 'cost_of_goods_sold']
  },
  cashConversionCycle: {
    formula: 'DSO + DIO - DPO',
    inputs: ['dso_days', 'dio_days', 'dpo_days']
  },
  fundingRequirement: {
    formula: '(growth_rate * working_capital) + capital_expenditure - retained_earnings',
    inputs: ['revenue_growth_rate', 'working_capital', 'capex_planned', 'profit_retention']
  },
  cashUnlockPotential: {
    formula: '(DSO_reduction * daily_sales) + (inventory_reduction * inventory_value) + (DPO_extension * daily_cogs)',
    inputs: ['dso_reduction_days', 'daily_revenue', 'inventory_optimization', 'dpo_extension_days', 'daily_costs']
  }
};

export default FINANCIAL_DATA_REQUIREMENTS;
