/**
 * SENTIA MANUFACTURING KNOWLEDGE BASE
 * Comprehensive domain knowledge for AI Support Chatbot
 * 
 * This knowledge base provides structured information about Sentia Manufacturing Dashboard
 * to enable intelligent, context-aware customer support and onboarding assistance.
 */

export const SENTIA_KNOWLEDGE_BASE = {
  
  // Company and Platform Overview
  company: {
    name: "Sentia Manufacturing",
    platform: "Sentia Manufacturing Dashboard",
    description: "Enterprise manufacturing management platform with AI-powered analytics and real-time optimization",
    founded: "2023",
    focus: "Manufacturing intelligence, financial optimization, and automated business operations"
  },

  // Core Platform Features
  features: {
    dashboard: {
      name: "World-Class Enterprise Dashboard",
      description: "Real-time manufacturing operations center with AI-powered insights",
      capabilities: [
        "Real-time KPI monitoring",
        "Drag-and-drop widget customization", 
        "Role-based access control",
        "Dark/light theme switching",
        "Responsive mobile interface",
        "Live data streaming via SSE"
      ],
      keyWidgets: [
        "KPI Performance Strip",
        "Demand Forecast Chart", 
        "Working Capital Monitor",
        "Production Status",
        "Quality Control Metrics",
        "Financial Overview"
      ]
    },

    inventory: {
      name: "AI-Powered Inventory Management",
      description: "Intelligent stock optimization with machine learning forecasting",
      capabilities: [
        "Real-time stock level monitoring",
        "Automated reorder point calculations",
        "ABC analysis for inventory prioritization",
        "Safety stock optimization",
        "Supplier performance tracking",
        "Multi-location inventory management"
      ],
      integrations: ["Amazon SP-API", "Shopify", "Unleashed Software", "Xero"],
      algorithms: [
        "Demand forecasting with seasonal adjustment",
        "Economic order quantity (EOQ) optimization", 
        "Lead time variability analysis",
        "Stockout probability calculations"
      ]
    },

    forecasting: {
      name: "Enhanced AI Demand Forecasting",
      description: "Machine learning algorithms for accurate demand prediction",
      capabilities: [
        "Multi-algorithm ensemble forecasting",
        "Seasonal trend analysis",
        "External factor integration",
        "Forecast accuracy tracking",
        "What-if scenario modeling",
        "Automated forecast adjustments"
      ],
      algorithms: [
        "ARIMA (AutoRegressive Integrated Moving Average)",
        "Exponential Smoothing (Holt-Winters)",
        "Neural Networks (LSTM)",
        "Seasonal decomposition",
        "Random Forest regression"
      ],
      accuracyTargets: {
        short_term: "95% accuracy for 1-4 week forecasts",
        medium_term: "85% accuracy for 1-3 month forecasts", 
        long_term: "75% accuracy for 3-12 month forecasts"
      }
    },

    workingCapital: {
      name: "Working Capital Management",
      description: "Comprehensive cash flow optimization and financial planning",
      capabilities: [
        "Real-time cash flow monitoring",
        "AR/AP aging analysis",
        "Cash conversion cycle tracking",
        "Working capital ratio optimization",
        "Payment term optimization",
        "Liquidity forecasting"
      ],
      kpis: [
        "Days Sales Outstanding (DSO)",
        "Days Payable Outstanding (DPO)", 
        "Days Inventory Outstanding (DIO)",
        "Cash Conversion Cycle",
        "Current Ratio",
        "Quick Ratio"
      ],
      integrations: ["Xero", "QuickBooks", "Sage", "Banking APIs"]
    },

    whatIf: {
      name: "What-If Analysis Engine",
      description: "Interactive scenario modeling for strategic decision making",
      capabilities: [
        "Parameter sensitivity analysis",
        "Monte Carlo simulations",
        "Risk assessment modeling",
        "ROI projections",
        "Break-even analysis",
        "Multi-variable impact modeling"
      ],
      scenarios: [
        "Price change impact analysis",
        "Volume adjustment modeling",
        "Cost reduction scenarios", 
        "Market expansion planning",
        "Supply chain disruption response",
        "Seasonal demand variations"
      ]
    },

    production: {
      name: "Production Tracking & Optimization",
      description: "Real-time production monitoring with efficiency optimization",
      capabilities: [
        "Live production status tracking",
        "OEE (Overall Equipment Effectiveness) monitoring",
        "Resource utilization analysis",
        "Bottleneck identification",
        "Capacity planning",
        "Production scheduling optimization"
      ],
      metrics: [
        "Production throughput",
        "Cycle time analysis",
        "Setup time tracking",
        "Equipment downtime",
        "Quality yield rates",
        "Labor productivity"
      ]
    },

    quality: {
      name: "Quality Control Management",
      description: "Comprehensive quality assurance and compliance tracking",
      capabilities: [
        "Real-time quality metrics",
        "Statistical process control",
        "Defect trend analysis", 
        "Supplier quality tracking",
        "Compliance reporting",
        "Root cause analysis"
      ],
      standards: ["ISO 9001", "ISO 14001", "OHSAS 18001", "FDA CFR 21 Part 11"]
    }
  },

  // Integration Ecosystem
  integrations: {
    financial: {
      xero: {
        name: "Xero Accounting Integration",
        description: "Real-time financial data synchronization",
        dataTypes: ["Invoices", "Bills", "Payments", "Bank Transactions", "Chart of Accounts"],
        frequency: "Real-time via webhooks",
        benefits: ["Automated financial reporting", "Cash flow visibility", "AR/AP automation"]
      },
      quickbooks: {
        name: "QuickBooks Integration", 
        description: "Comprehensive accounting data integration",
        dataTypes: ["Financial statements", "Transaction history", "Customer data"],
        frequency: "Hourly sync"
      }
    },

    ecommerce: {
      shopify: {
        name: "Shopify Multi-Store Integration",
        description: "Unified e-commerce data across multiple Shopify stores",
        dataTypes: ["Orders", "Products", "Customers", "Inventory levels", "Sales analytics"],
        frequency: "Real-time via webhooks",
        capabilities: ["Multi-store management", "Inventory sync", "Order fulfillment"]
      },
      amazon: {
        name: "Amazon SP-API Integration",
        description: "Amazon marketplace data and inventory management",
        dataTypes: ["Product listings", "Order management", "Inventory levels", "Financial reports"],
        frequency: "Every 15 minutes",
        capabilities: ["FBA inventory tracking", "Performance metrics", "Advertising data"]
      }
    },

    inventory: {
      unleashed: {
        name: "Unleashed Software Integration",
        description: "Advanced inventory management system integration", 
        dataTypes: ["Stock levels", "Product information", "Supplier data", "Transactions"],
        frequency: "Real-time sync"
      }
    }
  },

  // AI and Machine Learning Capabilities
  aiCapabilities: {
    centralNervousSystem: {
      name: "AI Central Nervous System",
      description: "Multi-LLM orchestration system for manufacturing intelligence",
      providers: [
        {
          name: "Claude 3.5 Sonnet",
          use_cases: ["Complex reasoning", "Business analysis", "Strategic planning"],
          strengths: ["Analytical thinking", "Code generation", "Mathematical modeling"]
        },
        {
          name: "GPT-4 Turbo", 
          use_cases: ["Creative problem solving", "Process optimization", "User support"],
          strengths: ["Versatile reasoning", "Natural conversation", "Multi-domain expertise"]
        },
        {
          name: "Gemini Pro",
          use_cases: ["Data analysis", "Pattern recognition", "Forecasting"],
          strengths: ["Large context windows", "Multi-modal processing", "Factual accuracy"]
        }
      ],
      capabilities: [
        "Intelligent provider selection based on task requirements",
        "Multi-LLM consensus for critical decisions",
        "Real-time decision broadcasting via WebSocket",
        "Vector database semantic memory",
        "Manufacturing-specific prompt engineering"
      ]
    },

    vectorDatabase: {
      name: "Semantic Memory System",
      categories: [
        "Manufacturing processes and best practices",
        "Financial optimization strategies", 
        "Inventory management techniques",
        "Quality control methodologies"
      ],
      capabilities: [
        "Contextual information retrieval",
        "Semantic similarity matching",
        "Knowledge base expansion through interactions",
        "Domain-specific embeddings"
      ]
    }
  },

  // Business Workflows and Best Practices
  workflows: {
    dailyOperations: {
      name: "Daily Operations Workflow",
      steps: [
        "Review overnight production and quality metrics",
        "Check cash flow and working capital status", 
        "Analyze demand forecast updates",
        "Monitor inventory levels and reorder points",
        "Address any exception alerts or bottlenecks",
        "Update production schedules based on demand changes"
      ]
    },

    monthlyPlanning: {
      name: "Monthly Business Planning",
      steps: [
        "Review financial performance vs targets",
        "Update demand forecasts for next 3 months",
        "Analyze working capital efficiency",
        "Plan inventory adjustments for seasonal patterns", 
        "Review supplier performance and negotiations",
        "Update capacity planning and resource allocation"
      ]
    },

    quarterlyReview: {
      name: "Quarterly Strategic Review",
      steps: [
        "Comprehensive financial analysis and reporting",
        "Forecast accuracy assessment and model tuning",
        "Working capital optimization opportunities",
        "Production efficiency improvements",
        "Quality metrics analysis and corrective actions",
        "Strategic planning for next quarter"
      ]
    }
  },

  // Navigation and User Interface
  navigation: {
    mainSections: [
      {
        name: "Overview",
        description: "Main dashboard with KPIs and real-time monitoring",
        pages: ["Dashboard", "Executive Summary"]
      },
      {
        name: "Planning & Analytics", 
        description: "Forecasting, inventory management, production tracking",
        pages: ["Demand Forecasting", "Inventory Management", "Production Tracking", "Quality Control", "AI Analytics"]
      },
      {
        name: "Financial Management",
        description: "Working capital, financial analysis, and reporting",
        pages: ["Working Capital", "What-If Analysis", "Financial Reports", "Cost Analysis"]
      },
      {
        name: "Data Management", 
        description: "Data import, templates, and integrations",
        pages: ["Data Import", "Import Templates", "API Integrations"]
      },
      {
        name: "Administration",
        description: "User management, system configuration",
        pages: ["Admin Panel", "System Config", "User Management", "Audit Logs"]
      }
    ],

    keyboardShortcuts: [
      { shortcut: "G+O", action: "Go to Overview Dashboard" },
      { shortcut: "G+F", action: "Go to Demand Forecasting" },
      { shortcut: "G+I", action: "Go to Inventory Management" },
      { shortcut: "G+P", action: "Go to Production Tracking" },
      { shortcut: "G+Q", action: "Go to Quality Control" },
      { shortcut: "G+W", action: "Go to Working Capital" },
      { shortcut: "G+A", action: "Go to What-If Analysis" },
      { shortcut: "G+R", action: "Go to Financial Reports" },
      { shortcut: "G+D", action: "Go to Data Import" }
    ]
  },

  // Troubleshooting and Support
  troubleshooting: {
    commonIssues: [
      {
        issue: "Data not loading or showing as disconnected",
        solutions: [
          "Check API integration status in Admin Panel",
          "Verify API credentials are correctly configured",
          "Check network connectivity to external services",
          "Review integration logs for specific error messages"
        ]
      },
      {
        issue: "Forecasting accuracy is low", 
        solutions: [
          "Ensure sufficient historical data (minimum 12 months)",
          "Check for data quality issues or gaps",
          "Consider external factors affecting demand",
          "Adjust forecast parameters or algorithms",
          "Review seasonal patterns and adjust accordingly"
        ]
      },
      {
        issue: "Working capital alerts or negative cash flow",
        solutions: [
          "Review accounts receivable aging and collection processes",
          "Analyze payment terms with customers and suppliers", 
          "Consider invoice factoring or line of credit options",
          "Optimize inventory levels to free up cash",
          "Implement more aggressive collection procedures"
        ]
      }
    ]
  },

  // Learning and Onboarding
  onboarding: {
    newUsers: {
      name: "New User Onboarding Journey",
      steps: [
        {
          step: 1,
          title: "Dashboard Overview",
          description: "Familiarize with main dashboard layout and key metrics"
        },
        {
          step: 2, 
          title: "Data Integration Setup",
          description: "Connect your accounting, e-commerce, and inventory systems"
        },
        {
          step: 3,
          title: "Demand Forecasting Configuration", 
          description: "Set up forecasting parameters and historical data import"
        },
        {
          step: 4,
          title: "Working Capital Monitoring",
          description: "Configure financial dashboards and alert thresholds"
        },
        {
          step: 5,
          title: "Production and Quality Setup",
          description: "Establish production tracking and quality metrics"
        }
      ]
    },

    bestPractices: [
      "Start with small data sets to validate integrations",
      "Set up automated alerts for critical business metrics",
      "Regularly review and adjust forecast parameters",
      "Use what-if analysis for major business decisions",
      "Monitor system performance and optimize as needed",
      "Keep integration credentials secure and updated",
      "Regular backup of configuration and custom settings"
    ]
  }
};

// Helper functions for knowledge retrieval
export class SentiaKnowledgeRetrieval {
  
  static getFeatureInfo(featureName) {
    const feature = SENTIA_KNOWLEDGE_BASE.features[featureName];
    return feature || null;
  }
  
  static getIntegrationInfo(category, serviceName) {
    const integration = SENTIA_KNOWLEDGE_BASE.integrations[category]?.[serviceName];
    return integration || null;
  }
  
  static getWorkflowInfo(workflowName) {
    const workflow = SENTIA_KNOWLEDGE_BASE.workflows[workflowName];
    return workflow || null;
  }
  
  static searchKnowledge(query) {
    const results = [];
    const searchTerm = query.toLowerCase();
    
    // Search through features
    for (const [key, feature] of Object.entries(SENTIA_KNOWLEDGE_BASE.features)) {
      if (feature.name.toLowerCase().includes(searchTerm) || 
          feature.description.toLowerCase().includes(searchTerm)) {
        results.push({ type: 'feature', key, ...feature });
      }
    }
    
    // Search through integrations
    for (const [category, integrations] of Object.entries(SENTIA_KNOWLEDGE_BASE.integrations)) {
      for (const [key, integration] of Object.entries(integrations)) {
        if (integration.name.toLowerCase().includes(searchTerm) ||
            integration.description.toLowerCase().includes(searchTerm)) {
          results.push({ type: 'integration', category, key, ...integration });
        }
      }
    }
    
    return results;
  }
  
  static getOnboardingSteps() {
    return SENTIA_KNOWLEDGE_BASE.onboarding.newUsers.steps;
  }
  
  static getTroubleshootingHelp(issue) {
    return SENTIA_KNOWLEDGE_BASE.troubleshooting.commonIssues.find(
      item => item.issue.toLowerCase().includes(issue.toLowerCase())
    );
  }
}

export default SENTIA_KNOWLEDGE_BASE;