/**
 * External API Response Fixtures
 * Mock responses for all external service integrations
 */

export const xeroApiResponses = {
  // Financial Reports
  profitAndLossReport: {
    reports: [{
      reportID: 'ProfitAndLoss',
      reportName: 'Profit and Loss',
      reportType: 'ProfitAndLoss',
      reportTitles: [
        'Profit and Loss',
        'Sentia Manufacturing Corp',
        'For the period 1 January 2024 to 31 October 2024'
      ],
      reportDate: '31 October 2024',
      updatedDateUTC: '2024-10-31T10:30:00Z',
      rows: [
        {
          rowType: 'Header',
          cells: [
            { value: 'Account' },
            { value: '31 Oct 24' },
            { value: '31 Oct 23' }
          ]
        },
        {
          rowType: 'Section',
          title: 'Revenue',
          rows: [
            {
              rowType: 'Row',
              cells: [
                { 
                  value: 'Sales Revenue', 
                  attributes: [{ value: '200', id: 'account' }] 
                },
                { 
                  value: '2,450,000.00', 
                  attributes: [{ value: '2450000.00', id: 'value' }] 
                },
                { 
                  value: '2,100,000.00', 
                  attributes: [{ value: '2100000.00', id: 'value' }] 
                }
              ]
            },
            {
              rowType: 'Row',
              cells: [
                { value: 'Other Revenue' },
                { value: '15,000.00' },
                { value: '12,000.00' }
              ]
            }
          ]
        },
        {
          rowType: 'Section',
          title: 'Cost of Goods Sold',
          rows: [
            {
              rowType: 'Row',
              cells: [
                { value: 'Material Costs' },
                { value: '980,000.00' },
                { value: '840,000.00' }
              ]
            },
            {
              rowType: 'Row',
              cells: [
                { value: 'Direct Labor' },
                { value: '490,000.00' },
                { value: '420,000.00' }
              ]
            },
            {
              rowType: 'Row',
              cells: [
                { value: 'Manufacturing Overhead' },
                { value: '245,000.00' },
                { value: '210,000.00' }
              ]
            }
          ]
        },
        {
          rowType: 'SummaryRow',
          cells: [
            { value: 'Gross Profit' },
            { value: '750,000.00' },
            { value: '642,000.00' }
          ]
        }
      ]
    }]
  },

  balanceSheetReport: {
    reports: [{
      reportID: 'BalanceSheet',
      reportName: 'Balance Sheet',
      reportType: 'BalanceSheet',
      reportDate: '31 October 2024',
      rows: [
        {
          rowType: 'Section',
          title: 'Assets',
          rows: [
            {
              rowType: 'Section',
              title: 'Current Assets',
              rows: [
                {
                  rowType: 'Row',
                  cells: [
                    { value: 'Cash and Cash Equivalents' },
                    { value: '145,000.00' }
                  ]
                },
                {
                  rowType: 'Row',
                  cells: [
                    { value: 'Accounts Receivable' },
                    { value: '380,000.00' }
                  ]
                },
                {
                  rowType: 'Row',
                  cells: [
                    { value: 'Inventory' },
                    { value: '520,000.00' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }]
  },

  // Invoices
  invoicesList: {
    invoices: [
      {
        invoiceID: 'inv-2024-001',
        invoiceNumber: 'INV-2024-001',
        type: 'ACCREC',
        status: 'AUTHORISED',
        date: '2024-10-15',
        dueDate: '2024-11-14',
        contact: {
          contactID: 'contact-automotive-001',
          name: 'Detroit Auto Parts Inc'
        },
        lineItems: [
          {
            lineItemID: 'li-001',
            description: 'V8 Engine Head Gaskets - Batch Production',
            quantity: 500,
            unitAmount: 119.99,
            lineAmount: 59995.00,
            accountCode: '200',
            itemCode: 'AC-GASKET-HEAD-V8',
            taxType: 'OUTPUT'
          }
        ],
        subTotal: 59995.00,
        totalTax: 5999.50,
        total: 65994.50,
        amountDue: 65994.50,
        amountPaid: 0.00,
        currencyCode: 'USD',
        reference: 'PO-DAUTO-2024-Q4-001'
      },
      {
        invoiceID: 'inv-2024-002',
        invoiceNumber: 'INV-2024-002',
        type: 'ACCPAY',
        status: 'PAID',
        date: '2024-10-10',
        dueDate: '2024-11-09',
        contact: {
          contactID: 'supplier-steel-001',
          name: 'Premium Steel Supply'
        },
        lineItems: [
          {
            lineItemID: 'li-002',
            description: 'Chrome Steel Bar Stock - SAE 52100',
            quantity: 50,
            unitAmount: 45.50,
            lineAmount: 2275.00,
            accountCode: '630'
          },
          {
            lineItemID: 'li-003',
            description: 'Stainless Steel 316 Round Bar',
            quantity: 20,
            unitAmount: 125.75,
            lineAmount: 2515.00,
            accountCode: '630'
          }
        ],
        subTotal: 4790.00,
        totalTax: 0.00,
        total: 4790.00,
        amountDue: 0.00,
        amountPaid: 4790.00,
        currencyCode: 'USD'
      }
    ]
  },

  // Contacts
  contactsList: {
    contacts: [
      {
        contactID: 'contact-automotive-001',
        name: 'Detroit Auto Parts Inc',
        contactStatus: 'ACTIVE',
        isSupplier: false,
        isCustomer: true,
        emailAddress: 'orders@detroitautoparts.com',
        contactPersons: [
          {
            firstName: 'Sarah',
            lastName: 'Johnson',
            emailAddress: 'sarah.johnson@detroitautoparts.com',
            includeInEmails: true
          }
        ],
        addresses: [
          {
            addressType: 'STREET',
            addressLine1: '1425 Industrial Drive',
            city: 'Detroit',
            region: 'Michigan',
            postalCode: '48201',
            country: 'United States'
          }
        ],
        phones: [
          {
            phoneType: 'DEFAULT',
            phoneNumber: '+1-313-555-0150'
          }
        ]
      }
    ]
  },

  // Authentication responses
  authTokenResponse: {
    access_token: 'mock-xero-access-token-12345',
    token_type: 'Bearer',
    expires_in: 1800,
    refresh_token: 'mock-xero-refresh-token-67890',
    scope: 'accounting.reports.read accounting.transactions'
  },

  tenantsResponse: [
    {
      tenantId: 'tenant-manufacturing-001',
      tenantType: 'ORGANISATION',
      tenantName: 'Sentia Manufacturing Corp',
      organisationCountryCode: 'US',
      baseCurrency: 'USD',
      organisationType: 'COMPANY'
    }
  ]
};

export const shopifyApiResponses = {
  // Orders
  ordersList: {
    orders: [
      {
        id: 450789469,
        order_number: 1002,
        name: '#1002',
        email: 'procurement@heavyindustries.com',
        created_at: '2024-10-20T14:30:00-04:00',
        updated_at: '2024-10-20T14:30:00-04:00',
        total_price: '74999.97',
        subtotal_price: '74999.97',
        total_tax: '7499.997',
        currency: 'USD',
        financial_status: 'pending',
        fulfillment_status: 'unfulfilled',
        customer: {
          id: 207119551,
          email: 'procurement@heavyindustries.com',
          first_name: 'Michael',
          last_name: 'Rodriguez',
          phone: '+1-713-555-0200'
        },
        billing_address: {
          first_name: 'Michael',
          last_name: 'Rodriguez',
          company: 'Heavy Industries Corp',
          address1: '5500 Industrial Blvd',
          city: 'Houston',
          province: 'Texas',
          country: 'United States',
          zip: '77032'
        },
        shipping_address: {
          first_name: 'Michael',
          last_name: 'Rodriguez',
          company: 'Heavy Industries Corp - Facility 3',
          address1: '5500 Industrial Blvd, Dock 7',
          city: 'Houston',
          province: 'Texas',
          country: 'United States',
          zip: '77032'
        },
        line_items: [
          {
            id: 466157049,
            product_id: 632910392,
            variant_id: 39072856,
            title: 'Industrial Centrifugal Pump 150HP',
            quantity: 3,
            price: '24999.99',
            sku: 'IE-PUMP-CENTRIFUGAL-150',
            vendor: 'Sentia Manufacturing',
            fulfillable_quantity: 3,
            fulfillment_status: null,
            properties: [
              {
                name: 'Special Requirements',
                value: 'ANSI flange connections, 316SS impeller'
              },
              {
                name: 'Installation Service',
                value: 'Required - Houston facility'
              }
            ]
          }
        ],
        note: 'Rush order for Q1 2025 plant expansion project',
        tags: 'industrial, high-value, rush-order'
      },
      {
        id: 450789470,
        order_number: 1003,
        name: '#1003',
        email: 'purchasing@precisionmfg.com',
        created_at: '2024-10-21T09:15:00-04:00',
        total_price: '4495.00',
        currency: 'USD',
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        line_items: [
          {
            id: 466157050,
            title: 'Precision Ball Bearing Set - Mixed Sizes',
            quantity: 500,
            price: '8.99',
            sku: 'PC-BEARING-MIX-001'
          }
        ]
      }
    ]
  },

  // Products
  productsList: {
    products: [
      {
        id: 632910392,
        title: 'Industrial Centrifugal Pump 150HP',
        body_html: '<p>Heavy-duty centrifugal pump designed for industrial applications requiring high flow rates and reliability.</p>',
        vendor: 'Sentia Manufacturing',
        product_type: 'Industrial Equipment',
        created_at: '2024-08-15T10:00:00-04:00',
        handle: 'industrial-centrifugal-pump-150hp',
        status: 'active',
        tags: 'industrial, pump, centrifugal, 150hp, heavy-duty',
        variants: [
          {
            id: 39072856,
            product_id: 632910392,
            title: 'Default Title',
            price: '24999.99',
            sku: 'IE-PUMP-CENTRIFUGAL-150',
            position: 1,
            inventory_policy: 'deny',
            fulfillment_service: 'manual',
            inventory_management: 'shopify',
            option1: 'Default Title',
            created_at: '2024-08-15T10:00:00-04:00',
            updated_at: '2024-10-15T14:30:00-04:00',
            weight: 485.0,
            weight_unit: 'kg',
            inventory_quantity: 8
          }
        ],
        options: [
          {
            id: 594680422,
            product_id: 632910392,
            name: 'Title',
            position: 1,
            values: ['Default Title']
          }
        ],
        images: []
      }
    ]
  },

  // Customers
  customersList: {
    customers: [
      {
        id: 207119551,
        email: 'procurement@heavyindustries.com',
        accepts_marketing: true,
        created_at: '2024-06-01T00:00:00-04:00',
        updated_at: '2024-10-20T14:30:00-04:00',
        first_name: 'Michael',
        last_name: 'Rodriguez',
        orders_count: 5,
        state: 'enabled',
        total_spent: '187499.85',
        last_order_id: 450789469,
        note: 'Key industrial customer - quarterly bulk orders',
        verified_email: true,
        multipass_identifier: null,
        tax_exempt: false,
        phone: '+1-713-555-0200',
        tags: 'industrial, bulk-buyer, net-30',
        addresses: [
          {
            id: 207119551,
            customer_id: 207119551,
            first_name: 'Michael',
            last_name: 'Rodriguez',
            company: 'Heavy Industries Corp',
            address1: '5500 Industrial Blvd',
            address2: '',
            city: 'Houston',
            province: 'Texas',
            country: 'United States',
            zip: '77032',
            phone: '+1-713-555-0200',
            name: 'Michael Rodriguez',
            province_code: 'TX',
            country_code: 'US',
            country_name: 'United States',
            default: true
          }
        ]
      }
    ]
  },

  // Inventory
  inventoryLevels: {
    inventory_levels: [
      {
        inventory_item_id: 39072856,
        location_id: 905684977,
        available: 8,
        updated_at: '2024-10-21T10:00:00-04:00'
      },
      {
        inventory_item_id: 39072857,
        location_id: 905684977,
        available: 450,
        updated_at: '2024-10-21T10:00:00-04:00'
      }
    ]
  },

  // Authentication
  accessTokenResponse: {
    access_token: 'shpat_mock_token_12345abcdef',
    scope: 'read_orders,write_orders,read_products,write_products'
  }
};

export const amazonApiResponses = {
  // FBA Inventory
  inventorySummaries: {
    inventorySummaries: [
      {
        asin: 'B08K2QJ5YZ',
        fnSku: 'MFG-PUMP-150HP-001',
        sellerSku: 'IE-PUMP-CENTRIFUGAL-150',
        condition: 'NewItem',
        inventoryDetails: {
          fulfillableQuantity: 8,
          inboundWorkingQuantity: 4,
          inboundShippedQuantity: 0,
          inboundReceivingQuantity: 0,
          reservedQuantity: {
            totalReservedQuantity: 2,
            pendingCustomerOrderQuantity: 2,
            pendingTransshipmentQuantity: 0,
            fcProcessingQuantity: 0
          },
          unfulfillableQuantity: {
            totalUnfulfillableQuantity: 0,
            customerDamagedQuantity: 0,
            warehouseDamagedQuantity: 0,
            distributorDamagedQuantity: 0,
            carrierDamagedQuantity: 0,
            defectiveQuantity: 0,
            expiredQuantity: 0
          }
        },
        lastUpdatedTime: '2024-10-21T15:30:00Z'
      },
      {
        asin: 'B08K2QJ6YZ',
        fnSku: 'MFG-BEARING-6201-001',
        sellerSku: 'PC-BEARING-6201',
        condition: 'NewItem',
        inventoryDetails: {
          fulfillableQuantity: 2450,
          inboundWorkingQuantity: 1000,
          inboundShippedQuantity: 500,
          inboundReceivingQuantity: 200,
          reservedQuantity: {
            totalReservedQuantity: 250,
            pendingCustomerOrderQuantity: 200,
            pendingTransshipmentQuantity: 50
          },
          unfulfillableQuantity: {
            totalUnfulfillableQuantity: 15,
            customerDamagedQuantity: 8,
            warehouseDamagedQuantity: 7
          }
        },
        lastUpdatedTime: '2024-10-21T15:30:00Z'
      }
    ],
    pagination: {
      nextToken: 'next-page-token-example'
    }
  },

  // Orders
  ordersList: {
    orders: [
      {
        amazonOrderId: 'AMZ-ORDER-123456789',
        sellerOrderId: 'SENTIA-2024-001',
        purchaseDate: '2024-10-20T18:45:00Z',
        lastUpdateDate: '2024-10-20T19:15:00Z',
        orderStatus: 'Shipped',
        fulfillmentChannel: 'MFN',
        salesChannel: 'Amazon.com',
        orderChannel: 'Online',
        shipServiceLevel: 'Standard',
        orderTotal: {
          currencyCode: 'USD',
          amount: '26999.98'
        },
        numberOfItemsShipped: 1,
        numberOfItemsUnshipped: 0,
        paymentExecutionDetail: [
          {
            payment: {
              currencyCode: 'USD',
              amount: '26999.98'
            },
            paymentMethod: 'Other'
          }
        ],
        paymentMethod: 'Other',
        paymentMethodDetails: ['Standard'],
        marketplaceId: 'ATVPDKIKX0DER',
        shipmentServiceLevelCategory: 'Standard',
        orderType: 'StandardOrder',
        earliestShipDate: '2024-10-21T00:00:00Z',
        latestShipDate: '2024-10-23T23:59:59Z',
        earliestDeliveryDate: '2024-10-25T00:00:00Z',
        latestDeliveryDate: '2024-10-28T23:59:59Z',
        isBusinessOrder: true,
        isPrime: false,
        isPremiumOrder: false,
        isGlobalExpressEnabled: false,
        replacedOrderId: null,
        isReplacementOrder: false,
        promiseResponseDueDate: '2024-10-21T12:00:00Z',
        isEstimatedShipDateSet: false
      }
    ]
  },

  // Order Items
  orderItems: {
    orderItems: [
      {
        asin: 'B08K2QJ5YZ',
        sellerSku: 'IE-PUMP-CENTRIFUGAL-150',
        orderItemId: 'AMZ-ITEM-987654321',
        title: 'Industrial Centrifugal Pump 150HP - High Efficiency',
        quantityOrdered: 1,
        quantityShipped: 1,
        productInfo: {
          numberOfItems: 1
        },
        pointsGranted: {
          pointsNumber: 0
        },
        itemPrice: {
          currencyCode: 'USD',
          amount: '24999.99'
        },
        shippingPrice: {
          currencyCode: 'USD',
          amount: '1999.99'
        },
        itemTax: {
          currencyCode: 'USD',
          amount: '0.00'
        },
        shippingTax: {
          currencyCode: 'USD',
          amount: '0.00'
        },
        shippingDiscount: {
          currencyCode: 'USD',
          amount: '0.00'
        },
        promotionDiscount: {
          currencyCode: 'USD',
          amount: '0.00'
        },
        conditionNote: '',
        conditionId: 'New',
        conditionSubtypeId: 'New',
        scheduledDeliveryStartDate: '',
        scheduledDeliveryEndDate: '',
        priceDesignation: 'BusinessPrice',
        taxCollection: {
          model: 'MarketplaceFacilitator',
          responsibleParty: 'Amazon Services, Inc.'
        },
        serialNumberRequired: false,
        isTransparency: false
      }
    ]
  },

  // SP-API Authentication
  authTokenResponse: {
    access_token: 'mock-amazon-access-token-xyz789',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-amazon-refresh-token-abc123'
  }
};

export const anthropicApiResponses = {
  // Claude API responses
  textGeneration: {
    id: 'msg_01ABC123DEF456',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'Based on the manufacturing data provided, I can see several key insights:\n\n1. **Production Efficiency**: Your current production line is operating at 85.2% efficiency, which is above industry average but has room for improvement.\n\n2. **Quality Metrics**: The defect rate of 1.4% for precision bearings is excellent and well within tolerance.\n\n3. **Inventory Optimization**: You have strong inventory turnover for high-demand items like brake pads, but may want to optimize stock levels for lower-velocity industrial equipment.\n\n4. **Financial Performance**: With a gross margin of 30.5%, your manufacturing operation shows healthy profitability.\n\nWould you like me to dive deeper into any of these areas or provide specific recommendations for improvement?'
      }
    ],
    model: 'claude-3-sonnet-20240229',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 1250,
      output_tokens: 185
    }
  },

  financialAnalysis: {
    id: 'msg_01XYZ789ABC456',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'Financial Analysis Summary for Sentia Manufacturing:\n\n**Revenue Growth**: 16.7% YoY increase in sales revenue ($2.45M vs $2.1M)\n\n**Cost Structure Analysis**:\n- Material costs: 40% of revenue (industry benchmark: 35-45%)\n- Direct labor: 20% of revenue (efficient for precision manufacturing)\n- Manufacturing overhead: 10% of revenue (well-controlled)\n\n**Profitability Metrics**:\n- Gross profit margin: 30.5% (strong for manufacturing sector)\n- Working capital: $1.045M (healthy liquidity position)\n\n**Key Recommendations**:\n1. Investigate material cost optimization opportunities\n2. Consider automation to reduce labor dependency\n3. Evaluate pricing strategy for premium products\n4. Monitor cash conversion cycle for working capital efficiency\n\n**Risk Factors**:\n- Heavy dependence on automotive sector (diversification opportunity)\n- Rising material costs impacting margins\n- Capacity constraints limiting growth potential'
      }
    ],
    model: 'claude-3-sonnet-20240229',
    usage: {
      input_tokens: 2100,
      output_tokens: 245
    }
  }
};

export const openaiApiResponses = {
  // ChatGPT/GPT-4 responses
  chatCompletion: {
    id: 'chatcmpl-ABC123DEF456GHI789',
    object: 'chat.completion',
    created: 1697723200,
    model: 'gpt-4-turbo-preview',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'Manufacturing Data Analysis:\n\n**Operational KPIs**:\n✓ Overall Equipment Effectiveness (OEE): 78% (Target: 85%)\n✓ On-time Delivery: 96.5% (Excellent performance)\n✓ First Pass Yield: 98.6% (High quality standards)\n✓ Inventory Turnover: 12.3x annually (Efficient inventory management)\n\n**Performance Insights**:\n1. CNC machining centers showing 78% utilization - opportunity for 7% improvement\n2. Assembly line efficiency at 85.2% - near optimal performance\n3. Quality defect rate under 2% across all product lines\n\n**Predictive Maintenance Alerts**:\n- CNC Lathe 1: Scheduled maintenance due 11/15/2024\n- Grinding equipment showing minor vibration increase\n\n**Recommendations**:\n- Implement predictive analytics for equipment optimization\n- Consider lean manufacturing principles for setup time reduction\n- Evaluate supplier performance for material quality consistency'
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 1850,
      completion_tokens: 198,
      total_tokens: 2048
    }
  },

  dataAnalysis: {
    id: 'chatcmpl-XYZ789ABC123DEF456',
    object: 'chat.completion',
    created: 1697723800,
    model: 'gpt-4-turbo-preview',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'Production Forecast Analysis:\n\n**Q4 2024 Production Projections**:\n- Precision Bearings: 25,000 units (↑15% vs Q3)\n- Automotive Components: 12,500 units (↑8% vs Q3)\n- Industrial Equipment: 45 units (↑25% vs Q3)\n\n**Capacity Planning**:\n- Current capacity utilization: 82%\n- Peak demand periods: Weeks 45-48 (automotive rush)\n- Bottleneck analysis: Assembly operations at 95% capacity\n\n**Material Requirements**:\n- Chrome steel: 15,000 kg (ensure 3-week lead time)\n- Stainless steel 316: 8,500 kg\n- Aluminum 6061: 12,000 kg\n\n**Risk Mitigation**:\n- Diversify supplier base for critical materials\n- Cross-train operators for flexibility\n- Implement buffer inventory for high-demand periods\n\n**Financial Impact**:\n- Projected Q4 revenue: $3.2M\n- Expected gross margin: 31.2%\n- CAPEX requirements: $450K for capacity expansion'
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 2200,
      completion_tokens: 287,
      total_tokens: 2487
    }
  }
};

export const unleashedApiResponses = {
  // Products
  productsList: {
    items: [
      {
        guid: 'product-guid-001',
        productCode: 'IE-PUMP-CENTRIFUGAL-150',
        productDescription: 'Industrial Centrifugal Pump 150HP',
        productGroup: {
          guid: 'group-guid-001',
          groupName: 'Industrial Equipment'
        },
        productFamily: {
          guid: 'family-guid-001',
          familyName: 'Pumps'
        },
        unitOfMeasure: {
          guid: 'uom-guid-001',
          unitName: 'Each'
        },
        unitPrice: 24999.99,
        isComponent: false,
        isObsoleted: false,
        lastModifiedOn: '2024-10-21T10:30:00Z',
        height: 1.2,
        width: 0.8,
        depth: 1.5,
        weight: 485.0,
        minimumSalePrice: 22000.00,
        averageCost: 18750.00,
        sellPriceTier1: 24999.99,
        sellPriceTier2: 23749.99,
        sellPriceTier3: 22499.99,
        isSerialized: true,
        isAssembledProduct: true,
        assemblyInstructions: 'Requires certified technician for assembly',
        productAttachments: []
      },
      {
        guid: 'product-guid-002',
        productCode: 'PC-BEARING-6201',
        productDescription: 'Precision Ball Bearing 6201',
        productGroup: {
          guid: 'group-guid-002',
          groupName: 'Precision Components'
        },
        unitPrice: 8.99,
        averageCost: 4.50,
        minimumOrderQuantity: 100,
        stockOnHand: 2450.0,
        availableStock: 2200.0,
        allocatedStock: 250.0,
        onOrder: 1000.0,
        reorderPoint: 500.0,
        isSerialized: false
      }
    ]
  },

  // Sales Orders
  salesOrdersList: {
    items: [
      {
        guid: 'so-guid-001',
        orderNumber: 'SO-2024-001',
        orderDate: '2024-10-20T00:00:00Z',
        requiredDate: '2024-11-15T00:00:00Z',
        customer: {
          guid: 'customer-guid-001',
          customerCode: 'DETROIT-AUTO-001',
          customerName: 'Detroit Auto Parts Inc'
        },
        currency: {
          guid: 'currency-guid-usd',
          currencyCode: 'USD'
        },
        orderStatus: 'Parked',
        subtotal: 59995.00,
        taxTotal: 5999.50,
        total: 65994.50,
        salesOrderLines: [
          {
            guid: 'sol-guid-001',
            lineNumber: 1,
            product: {
              guid: 'product-guid-003',
              productCode: 'AC-GASKET-HEAD-V8'
            },
            orderQuantity: 500.0,
            unitPrice: 119.99,
            lineTotal: 59995.00,
            taxRate: 10.0,
            lineDescription: 'V8 Engine Head Gaskets - Production Run'
          }
        ],
        warehouse: {
          guid: 'warehouse-guid-001',
          warehouseName: 'Main Manufacturing Facility'
        }
      }
    ]
  },

  // Purchase Orders
  purchaseOrdersList: {
    items: [
      {
        guid: 'po-guid-001',
        orderNumber: 'PO-2024-MAT-001',
        orderDate: '2024-10-01T00:00:00Z',
        requiredDate: '2024-10-15T00:00:00Z',
        supplier: {
          guid: 'supplier-guid-001',
          supplierCode: 'STEEL-PREM-001',
          supplierName: 'Premium Steel Supply'
        },
        orderStatus: 'Placed',
        subtotal: 4790.00,
        total: 4790.00,
        purchaseOrderLines: [
          {
            guid: 'pol-guid-001',
            lineNumber: 1,
            product: {
              guid: 'product-guid-raw-001',
              productCode: 'RAW-STEEL-CS-25MM'
            },
            orderQuantity: 50.0,
            unitPrice: 45.50,
            lineTotal: 2275.00,
            receivedQuantity: 50.0,
            lineDescription: 'Chrome Steel Round Bar 25mm - SAE 52100'
          },
          {
            guid: 'pol-guid-002',
            lineNumber: 2,
            product: {
              guid: 'product-guid-raw-002',
              productCode: 'RAW-SS316-30MM'
            },
            orderQuantity: 20.0,
            unitPrice: 125.75,
            lineTotal: 2515.00,
            receivedQuantity: 20.0,
            lineDescription: 'Stainless Steel 316 Round Bar 30mm'
          }
        ]
      }
    ]
  },

  // Stock on Hand
  stockOnHandList: {
    items: [
      {
        guid: 'soh-guid-001',
        product: {
          guid: 'product-guid-001',
          productCode: 'IE-PUMP-CENTRIFUGAL-150',
          productDescription: 'Industrial Centrifugal Pump 150HP'
        },
        warehouse: {
          guid: 'warehouse-guid-001',
          warehouseName: 'Main Manufacturing Facility'
        },
        qtyOnHand: 8.0,
        availableQty: 6.0,
        allocatedQty: 2.0,
        onOrder: 4.0,
        averageCost: 18750.00,
        lastCost: 19250.00,
        lastModifiedOn: '2024-10-21T15:30:00Z'
      },
      {
        guid: 'soh-guid-002',
        product: {
          guid: 'product-guid-002',
          productCode: 'PC-BEARING-6201'
        },
        warehouse: {
          guid: 'warehouse-guid-001',
          warehouseName: 'Main Manufacturing Facility'
        },
        qtyOnHand: 2450.0,
        availableQty: 2200.0,
        allocatedQty: 250.0,
        onOrder: 1000.0,
        averageCost: 4.50,
        lastCost: 4.65
      }
    ]
  },

  // Customers
  customersList: {
    items: [
      {
        guid: 'customer-guid-001',
        customerCode: 'DETROIT-AUTO-001',
        customerName: 'Detroit Auto Parts Inc',
        companyName: 'Detroit Auto Parts Inc',
        contactFirstName: 'Sarah',
        contactLastName: 'Johnson',
        customerType: 'Business',
        isActive: true,
        currency: {
          guid: 'currency-guid-usd',
          currencyCode: 'USD'
        },
        paymentTerm: {
          guid: 'payment-term-guid-001',
          paymentTermDescription: 'NET 30'
        },
        taxGroup: {
          guid: 'tax-group-guid-001',
          groupName: 'Standard Rate'
        },
        addresses: [
          {
            guid: 'address-guid-001',
            addressType: 'Shipping',
            addressName: 'Main Facility',
            streetAddress: '1425 Industrial Drive',
            city: 'Detroit',
            region: 'Michigan',
            postalCode: '48201',
            country: 'United States'
          }
        ],
        phoneNumber: '+1-313-555-0150',
        emailAddress: 'orders@detroitautoparts.com',
        website: 'https://www.detroitautoparts.com'
      }
    ]
  },

  // Authentication
  authTokenResponse: {
    access_token: 'mock-unleashed-token-abc123def456',
    token_type: 'Bearer',
    expires_in: 3600
  }
};

// Error responses for testing error handling
export const errorResponses = {
  unauthorized: {
    error: 'Unauthorized',
    error_description: 'The access token is invalid or expired',
    status: 401
  },

  rateLimited: {
    error: 'Rate Limit Exceeded',
    message: 'API rate limit exceeded. Please try again later.',
    status: 429,
    headers: {
      'Retry-After': '60',
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': '1697724200'
    }
  },

  serverError: {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred on the server',
    status: 500
  },

  badRequest: {
    error: 'Bad Request',
    message: 'Invalid request parameters',
    status: 400,
    details: {
      field: 'date',
      message: 'Date format must be YYYY-MM-DD'
    }
  },

  notFound: {
    error: 'Not Found',
    message: 'The requested resource was not found',
    status: 404
  }
};

// Export all API response fixtures
export const apiResponseFixtures = {
  xero: xeroApiResponses,
  shopify: shopifyApiResponses,
  amazon: amazonApiResponses,
  anthropic: anthropicApiResponses,
  openai: openaiApiResponses,
  unleashed: unleashedApiResponses,
  errors: errorResponses
};