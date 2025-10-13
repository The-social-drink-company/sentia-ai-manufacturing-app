/**
 * Manufacturing Test Data Fixtures
 * Comprehensive test data for manufacturing scenarios
 */

export const manufacturingCompanies = {
  smallManufacturer: {
    id: 'company-small-001',
    name: 'Precision Parts Manufacturing',
    type: 'small_manufacturer',
    employees: 25,
    annual_revenue: 2500000,
    industry: 'precision_machining',
    location: {
      address: '123 Industrial Way',
      city: 'Detroit',
      state: 'MI',
      country: 'US',
      postal_code: '48201'
    },
    certifications: ['ISO 9001:2015', 'AS9100D'],
    capabilities: ['CNC_MACHINING', 'SHEET_METAL', 'ASSEMBLY'],
    contact: {
      email: 'contact@precisionparts.com',
      phone: '+1-313-555-0123'
    }
  },

  mediumManufacturer: {
    id: 'company-medium-001',
    name: 'Advanced Manufacturing Solutions',
    type: 'medium_manufacturer',
    employees: 150,
    annual_revenue: 18000000,
    industry: 'automotive_components',
    location: {
      address: '456 Manufacturing Blvd',
      city: 'Cleveland',
      state: 'OH',
      country: 'US',
      postal_code: '44101'
    },
    certifications: ['ISO 9001:2015', 'IATF 16949:2016', 'ISO 14001:2015'],
    capabilities: ['INJECTION_MOLDING', 'STAMPING', 'WELDING', 'PAINTING', 'ASSEMBLY'],
    contact: {
      email: 'info@advancedmfg.com',
      phone: '+1-216-555-0456'
    }
  },

  largeManufacturer: {
    id: 'company-large-001',
    name: 'Global Manufacturing Corp',
    type: 'large_manufacturer',
    employees: 5000,
    annual_revenue: 850000000,
    industry: 'industrial_equipment',
    location: {
      address: '789 Enterprise Drive',
      city: 'Chicago',
      state: 'IL',
      country: 'US',
      postal_code: '60601'
    },
    certifications: [
      'ISO 9001:2015', 'ISO 14001:2015', 'OHSAS 18001', 
      'ISO 27001:2013', 'SOC 2 Type II'
    ],
    capabilities: [
      'MACHINING', 'FABRICATION', 'WELDING', 'ASSEMBLY',
      'TESTING', 'QUALITY_CONTROL', 'SUPPLY_CHAIN'
    ],
    facilities: [
      { location: 'Chicago, IL', type: 'headquarters', size_sqft: 250000 },
      { location: 'Houston, TX', type: 'manufacturing', size_sqft: 400000 },
      { location: 'Phoenix, AZ', type: 'assembly', size_sqft: 180000 }
    ],
    contact: {
      email: 'corporate@globalmfg.com',
      phone: '+1-312-555-0789'
    }
  }
};

export const manufacturingProducts = {
  precisionComponents: [
    {
      id: 'product-pc-001',
      sku: 'PC-BEARING-6201',
      name: 'Precision Ball Bearing 6201',
      category: 'bearings',
      subcategory: 'ball_bearings',
      description: 'High precision ball bearing for industrial applications',
      specifications: {
        inner_diameter: '12mm',
        outer_diameter: '32mm',
        width: '10mm',
        material: 'chrome_steel',
        precision_grade: 'P5',
        load_rating: '6.8kN'
      },
      cost: {
        material: 2.50,
        labor: 1.25,
        overhead: 0.75,
        total: 4.50
      },
      price: 8.99,
      lead_time_days: 14,
      minimum_order: 100,
      weight_grams: 45
    },
    {
      id: 'product-pc-002',
      sku: 'PC-SHAFT-SS316-025',
      name: 'Stainless Steel Shaft 316',
      category: 'shafts',
      subcategory: 'round_shafts',
      description: 'Marine grade stainless steel precision shaft',
      specifications: {
        diameter: '25mm',
        length: '150mm',
        material: 'ss316',
        surface_finish: 'Ra 0.8',
        tolerance: 'h6',
        hardness: '28-35 HRC'
      },
      cost: {
        material: 15.00,
        labor: 8.50,
        overhead: 4.25,
        total: 27.75
      },
      price: 55.50,
      lead_time_days: 21,
      minimum_order: 50,
      weight_grams: 365
    }
  ],

  automotiveComponents: [
    {
      id: 'product-ac-001',
      sku: 'AC-GASKET-HEAD-V8',
      name: 'V8 Engine Head Gasket',
      category: 'gaskets',
      subcategory: 'head_gaskets',
      description: 'Multi-layer steel head gasket for V8 engines',
      specifications: {
        engine_type: 'V8',
        bore_diameter: '101.6mm',
        material: 'multi_layer_steel',
        thickness: '1.2mm',
        compression_ratio: '10.5:1'
      },
      cost: {
        material: 25.00,
        labor: 15.00,
        overhead: 8.00,
        tooling: 5.00,
        total: 53.00
      },
      price: 119.99,
      lead_time_days: 28,
      minimum_order: 25,
      weight_grams: 1200,
      oem_numbers: ['12345-ABC-001', '67890-DEF-002']
    },
    {
      id: 'product-ac-002',
      sku: 'AC-BRAKE-PAD-FR',
      name: 'Front Brake Pad Set',
      category: 'brakes',
      subcategory: 'brake_pads',
      description: 'Ceramic brake pads for front axle',
      specifications: {
        material: 'ceramic',
        friction_coefficient: '0.45',
        operating_temp: '50-650°C',
        wear_indicator: true,
        backing_plate: 'steel'
      },
      cost: {
        material: 18.50,
        labor: 12.00,
        overhead: 6.25,
        packaging: 2.25,
        total: 39.00
      },
      price: 89.99,
      lead_time_days: 14,
      minimum_order: 10,
      weight_grams: 2400,
      vehicle_applications: [
        '2018-2023 Honda Accord',
        '2019-2024 Toyota Camry',
        '2020-2024 Nissan Altima'
      ]
    }
  ],

  industrialEquipment: [
    {
      id: 'product-ie-001',
      sku: 'IE-PUMP-CENTRIFUGAL-150',
      name: 'Industrial Centrifugal Pump 150HP',
      category: 'pumps',
      subcategory: 'centrifugal_pumps',
      description: '150HP centrifugal pump for heavy duty applications',
      specifications: {
        power: '150HP',
        flow_rate: '2000 GPM',
        head: '350 feet',
        inlet_size: '12 inches',
        outlet_size: '10 inches',
        material: 'cast_iron',
        seal_type: 'mechanical'
      },
      cost: {
        material: 8500.00,
        labor: 1200.00,
        overhead: 650.00,
        testing: 300.00,
        total: 10650.00
      },
      price: 24999.99,
      lead_time_days: 60,
      minimum_order: 1,
      weight_kg: 485,
      compliance: ['API 610', 'ANSI B73.1', 'ISO 5199']
    }
  ]
};

export const manufacturingOrders = {
  productionOrders: [
    {
      id: 'po-2024-001',
      order_number: 'PO-001234',
      customer_id: 'customer-automotive-001',
      customer_name: 'Detroit Auto Parts Inc',
      status: 'in_production',
      priority: 'high',
      order_date: '2024-10-01T08:00:00Z',
      requested_delivery: '2024-11-15T17:00:00Z',
      estimated_completion: '2024-11-10T12:00:00Z',
      line_items: [
        {
          id: 'li-001',
          product_id: 'product-ac-001',
          sku: 'AC-GASKET-HEAD-V8',
          quantity: 500,
          unit_price: 119.99,
          total_price: 59995.00,
          production_status: 'tooling_setup',
          scheduled_start: '2024-10-15T06:00:00Z',
          estimated_completion: '2024-11-08T16:00:00Z'
        },
        {
          id: 'li-002',
          product_id: 'product-ac-002',
          sku: 'AC-BRAKE-PAD-FR',
          quantity: 200,
          unit_price: 89.99,
          total_price: 17998.00,
          production_status: 'completed',
          completed_date: '2024-10-20T14:30:00Z'
        }
      ],
      total_value: 77993.00,
      production_notes: 'Rush order for Q4 vehicle launches',
      quality_requirements: 'PPAP Level 3 documentation required'
    },
    {
      id: 'po-2024-002',
      order_number: 'PO-001235',
      customer_id: 'customer-industrial-001',
      customer_name: 'Heavy Industries Corp',
      status: 'planning',
      priority: 'normal',
      order_date: '2024-10-05T14:30:00Z',
      requested_delivery: '2024-12-20T10:00:00Z',
      line_items: [
        {
          id: 'li-003',
          product_id: 'product-ie-001',
          sku: 'IE-PUMP-CENTRIFUGAL-150',
          quantity: 3,
          unit_price: 24999.99,
          total_price: 74999.97,
          production_status: 'awaiting_materials',
          material_requirements: [
            { material: 'cast_iron', quantity_kg: 1455, status: 'on_order' },
            { material: 'stainless_steel', quantity_kg: 145, status: 'in_stock' }
          ]
        }
      ],
      total_value: 74999.97,
      engineering_review: 'pending',
      delivery_terms: 'FOB factory'
    }
  ],

  materialOrders: [
    {
      id: 'mo-2024-001',
      supplier_id: 'supplier-steel-001',
      supplier_name: 'Premium Steel Supply',
      order_date: '2024-10-01T09:15:00Z',
      expected_delivery: '2024-10-15T08:00:00Z',
      status: 'shipped',
      tracking_number: 'PSS-98765432',
      items: [
        {
          material: 'chrome_steel',
          grade: 'SAE 52100',
          form: 'bar_stock',
          diameter: '25mm',
          length: '3000mm',
          quantity: 50,
          unit_price: 45.50,
          total_price: 2275.00,
          heat_number: 'H240801-CS25',
          mill_cert: 'PSS-MC-240801-001'
        },
        {
          material: 'stainless_steel',
          grade: 'SS316',
          form: 'round_bar',
          diameter: '30mm',
          length: '6000mm',
          quantity: 20,
          unit_price: 125.75,
          total_price: 2515.00,
          heat_number: 'H240802-SS30',
          mill_cert: 'PSS-MC-240802-001'
        }
      ],
      total_value: 4790.00,
      payment_terms: 'NET 30',
      freight_terms: 'FOB Origin'
    }
  ]
};

export const manufacturingInventory = {
  rawMaterials: [
    {
      id: 'rm-001',
      material_code: 'STEEL-CS-25MM',
      description: 'Chrome Steel Round Bar 25mm',
      category: 'steel',
      grade: 'SAE 52100',
      specifications: {
        diameter: '25mm',
        length: '3000mm',
        hardness: '187-229 HB',
        carbon_content: '0.98-1.10%'
      },
      current_stock: {
        quantity: 127,
        unit: 'pieces',
        weight_kg: 3810,
        location: 'warehouse_a_rack_15'
      },
      reorder_point: 50,
      economic_order_quantity: 100,
      cost_per_unit: 45.50,
      suppliers: [
        {
          supplier_id: 'supplier-steel-001',
          lead_time_days: 14,
          minimum_order: 25,
          price: 45.50
        },
        {
          supplier_id: 'supplier-steel-002',
          lead_time_days: 21,
          minimum_order: 50,
          price: 43.25
        }
      ],
      quality_requirements: {
        incoming_inspection: true,
        mill_cert_required: true,
        hardness_test: true
      }
    },
    {
      id: 'rm-002',
      material_code: 'ALU-6061-T6-PLATE',
      description: 'Aluminum 6061-T6 Plate',
      category: 'aluminum',
      grade: '6061-T6',
      specifications: {
        thickness: '12mm',
        width: '1000mm',
        length: '2000mm',
        tensile_strength: '310 MPa min',
        yield_strength: '276 MPa min'
      },
      current_stock: {
        quantity: 45,
        unit: 'sheets',
        weight_kg: 1215,
        location: 'warehouse_b_rack_03'
      },
      reorder_point: 20,
      economic_order_quantity: 50,
      cost_per_unit: 125.00,
      suppliers: [
        {
          supplier_id: 'supplier-aluminum-001',
          lead_time_days: 10,
          minimum_order: 10,
          price: 125.00
        }
      ]
    }
  ],

  workinProgress: [
    {
      id: 'wip-001',
      work_order: 'WO-2024-0542',
      product_id: 'product-pc-001',
      sku: 'PC-BEARING-6201',
      operation: 'machining',
      machine_id: 'cnc-001',
      operator: 'operator-123',
      quantity_started: 500,
      quantity_completed: 350,
      quantity_scrapped: 5,
      quantity_remaining: 145,
      start_time: '2024-10-20T06:00:00Z',
      estimated_completion: '2024-10-22T16:00:00Z',
      current_operation: {
        operation_number: '030',
        description: 'Finish grinding',
        setup_time_min: 45,
        cycle_time_min: 2.5,
        completed_pieces: 350
      },
      quality_data: {
        inspections: 3,
        defects_found: 5,
        defect_rate: 0.014,
        spc_data: {
          critical_dimension: {
            target: 12.000,
            tolerance: '±0.005',
            readings: [12.002, 11.998, 12.001, 11.999, 12.003]
          }
        }
      }
    }
  ],

  finishedGoods: [
    {
      id: 'fg-001',
      product_id: 'product-ac-002',
      sku: 'AC-BRAKE-PAD-FR',
      description: 'Front Brake Pad Set',
      lot_number: 'LOT-241020-001',
      manufactured_date: '2024-10-20T00:00:00Z',
      expiry_date: '2027-10-20T00:00:00Z',
      quantity: 250,
      location: 'finished_goods_a_section_12',
      quality_status: 'approved',
      quality_data: {
        certificate_number: 'QC-241020-BP-001',
        inspector: 'qc-inspector-456',
        inspection_date: '2024-10-20T16:30:00Z',
        test_results: {
          friction_coefficient: 0.447,
          wear_rate: '0.12 mm/1000 stops',
          temperature_resistance: 'passed_650C'
        }
      },
      allocated_orders: [
        {
          order_id: 'po-2024-001',
          quantity_allocated: 200
        }
      ],
      available_quantity: 50,
      cost: {
        material: 18.50,
        labor: 12.00,
        overhead: 6.25,
        packaging: 2.25,
        total: 39.00
      }
    }
  ]
};

export const manufacturingWorkCenters = {
  machining: [
    {
      id: 'wc-cnc-001',
      name: 'CNC Machining Center 1',
      type: 'cnc_machining_center',
      manufacturer: 'Haas',
      model: 'VF-3',
      year: 2020,
      capabilities: ['milling', 'drilling', 'tapping'],
      specifications: {
        x_travel: '1016mm',
        y_travel: '508mm',
        z_travel: '635mm',
        spindle_speed: '8100 RPM',
        tool_capacity: 20
      },
      status: 'operational',
      utilization_target: 85,
      current_utilization: 78,
      scheduled_maintenance: '2024-11-15T18:00:00Z',
      operator_required: true,
      hourly_rate: 125.00
    },
    {
      id: 'wc-lathe-001',
      name: 'CNC Lathe 1',
      type: 'cnc_lathe',
      manufacturer: 'Mazak',
      model: 'INTEGREX i-200',
      year: 2019,
      capabilities: ['turning', 'drilling', 'milling'],
      specifications: {
        max_diameter: '365mm',
        max_length: '500mm',
        spindle_speed: '4000 RPM',
        tool_positions: 12
      },
      status: 'maintenance',
      maintenance_type: 'preventive',
      maintenance_start: '2024-10-21T06:00:00Z',
      maintenance_end: '2024-10-21T14:00:00Z',
      hourly_rate: 110.00
    }
  ],

  assembly: [
    {
      id: 'wc-assembly-001',
      name: 'Assembly Line 1',
      type: 'manual_assembly',
      stations: 8,
      takt_time: 450, // seconds
      capacity_per_hour: 8,
      current_production: {
        product: 'AC-BRAKE-PAD-FR',
        target_quantity: 200,
        completed_quantity: 156,
        efficiency: 85.2
      },
      operators: [
        { id: 'op-001', name: 'John Smith', station: 1, shift: 'day' },
        { id: 'op-002', name: 'Maria Garcia', station: 2, shift: 'day' },
        { id: 'op-003', name: 'David Johnson', station: 3, shift: 'day' }
      ],
      quality_checkpoints: [3, 6, 8],
      hourly_rate: 85.00
    }
  ],

  testing: [
    {
      id: 'wc-test-001',
      name: 'Coordinate Measuring Machine',
      type: 'cmm',
      manufacturer: 'Zeiss',
      model: 'CONTURA G2',
      capabilities: ['dimensional_inspection', 'geometric_tolerance'],
      specifications: {
        measuring_range: '700x1000x600mm',
        accuracy: '1.5 + L/300 μm',
        probe_system: 'VAST_XXT'
      },
      status: 'operational',
      queue_length: 3,
      average_inspection_time: 45, // minutes
      calibration_due: '2024-12-01T00:00:00Z'
    }
  ]
};

export const manufacturingQualityData = {
  inspectionPlans: [
    {
      id: 'ip-001',
      product_id: 'product-pc-001',
      sku: 'PC-BEARING-6201',
      revision: 'Rev C',
      checkpoints: [
        {
          operation: '010',
          description: 'Incoming material inspection',
          characteristics: [
            {
              name: 'Material hardness',
              specification: '187-229 HB',
              method: 'Brinell hardness test',
              frequency: 'per_lot',
              sample_size: 3
            }
          ]
        },
        {
          operation: '030',
          description: 'Finish grinding inspection',
          characteristics: [
            {
              name: 'Inner diameter',
              specification: '12.000 ± 0.005mm',
              method: 'CMM measurement',
              frequency: 'every_50_pieces',
              sample_size: 5
            },
            {
              name: 'Surface finish',
              specification: 'Ra 0.8 max',
              method: 'Surface roughness tester',
              frequency: 'every_100_pieces',
              sample_size: 3
            }
          ]
        }
      ]
    }
  ],

  qualityRecords: [
    {
      id: 'qr-001',
      date: '2024-10-20T14:30:00Z',
      inspector: 'qc-inspector-456',
      work_order: 'WO-2024-0542',
      product_id: 'product-pc-001',
      lot_number: 'LOT-241020-002',
      operation: '030',
      sample_size: 5,
      measurements: [
        {
          characteristic: 'Inner diameter',
          values: [12.002, 11.998, 12.001, 11.999, 12.003],
          unit: 'mm',
          specification: '12.000 ± 0.005',
          result: 'pass'
        },
        {
          characteristic: 'Surface finish',
          values: [0.6, 0.7, 0.5],
          unit: 'Ra μm',
          specification: '0.8 max',
          result: 'pass'
        }
      ],
      overall_result: 'pass',
      nonconformances: [],
      corrective_actions: []
    },
    {
      id: 'qr-002',
      date: '2024-10-20T16:45:00Z',
      inspector: 'qc-inspector-789',
      work_order: 'WO-2024-0543',
      product_id: 'product-pc-001',
      lot_number: 'LOT-241020-003',
      operation: '030',
      sample_size: 5,
      measurements: [
        {
          characteristic: 'Inner diameter',
          values: [12.007, 12.008, 12.006, 12.009, 12.007],
          unit: 'mm',
          specification: '12.000 ± 0.005',
          result: 'fail'
        }
      ],
      overall_result: 'fail',
      nonconformances: [
        {
          id: 'nc-001',
          description: 'Inner diameter out of tolerance',
          root_cause: 'Grinding wheel wear',
          corrective_action: 'Replace grinding wheel, re-qualify setup'
        }
      ]
    }
  ]
};

export const manufacturingSuppliers = {
  tier1: [
    {
      id: 'supplier-steel-001',
      name: 'Premium Steel Supply',
      type: 'material_supplier',
      category: 'metals',
      rating: 'A',
      certifications: ['ISO 9001:2015', 'AS9100D'],
      contact: {
        email: 'orders@premiumsteel.com',
        phone: '+1-412-555-0100',
        address: {
          street: '789 Steel Mill Road',
          city: 'Pittsburgh',
          state: 'PA',
          postal_code: '15201',
          country: 'US'
        }
      },
      capabilities: ['steel_processing', 'heat_treatment', 'testing'],
      materials_supplied: ['chrome_steel', 'carbon_steel', 'alloy_steel'],
      payment_terms: 'NET 30',
      lead_times: {
        standard: 14,
        expedited: 7
      },
      quality_metrics: {
        on_time_delivery: 96.5,
        quality_rating: 98.2,
        responsiveness: 95.0
      }
    },
    {
      id: 'supplier-aluminum-001',
      name: 'Lightweight Metals Corp',
      type: 'material_supplier',
      category: 'non_ferrous',
      rating: 'A',
      certifications: ['ISO 9001:2015', 'NADCAP'],
      materials_supplied: ['aluminum_6061', 'aluminum_7075', 'titanium'],
      lead_times: {
        standard: 10,
        expedited: 5
      },
      quality_metrics: {
        on_time_delivery: 94.8,
        quality_rating: 97.5,
        responsiveness: 92.3
      }
    }
  ],

  tier2: [
    {
      id: 'supplier-tooling-001',
      name: 'Precision Tooling Solutions',
      type: 'tooling_supplier',
      category: 'cutting_tools',
      rating: 'B+',
      tools_supplied: ['end_mills', 'drills', 'inserts', 'holders'],
      lead_times: {
        standard: 21,
        expedited: 14
      }
    }
  ]
};

// Export all fixtures as a single object for easy importing
export const manufacturingFixtures = {
  companies: manufacturingCompanies,
  products: manufacturingProducts,
  orders: manufacturingOrders,
  inventory: manufacturingInventory,
  workCenters: manufacturingWorkCenters,
  quality: manufacturingQualityData,
  suppliers: manufacturingSuppliers
};