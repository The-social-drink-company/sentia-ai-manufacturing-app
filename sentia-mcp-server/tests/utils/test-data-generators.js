/**
 * Test Data Generators for MCP Server Testing
 * Utilities to generate realistic test data for manufacturing scenarios
 */

import { faker } from '@faker-js/faker';

/**
 * Generate manufacturing company data
 */
export function generateManufacturingCompany(overrides = {}) {
  const companyTypes = ['small_manufacturer', 'medium_manufacturer', 'large_manufacturer'];
  const industries = [
    'automotive_components', 'precision_machining', 'industrial_equipment',
    'aerospace_parts', 'medical_devices', 'electronics_manufacturing'
  ];

  const certifications = [
    'ISO 9001:2015', 'AS9100D', 'IATF 16949:2016', 'ISO 14001:2015',
    'OHSAS 18001', 'ISO 27001:2013', 'SOC 2 Type II', 'NADCAP'
  ];

  const capabilities = [
    'CNC_MACHINING', 'SHEET_METAL', 'WELDING', 'ASSEMBLY', 'PAINTING',
    'INJECTION_MOLDING', 'STAMPING', 'TESTING', 'QUALITY_CONTROL'
  ];

  return {
    id: `company-${faker.string.uuid()}`,
    name: faker.company.name() + ' Manufacturing',
    type: faker.helpers.arrayElement(companyTypes),
    employees: faker.number.int({ min: 5, max: 5000 }),
    annual_revenue: faker.number.int({ min: 500000, max: 1000000000 }),
    industry: faker.helpers.arrayElement(industries),
    location: {
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      country: 'US',
      postal_code: faker.location.zipCode()
    },
    certifications: faker.helpers.arrayElements(certifications, { min: 1, max: 4 }),
    capabilities: faker.helpers.arrayElements(capabilities, { min: 2, max: 6 }),
    contact: {
      email: faker.internet.email(),
      phone: faker.phone.number('+1-###-###-####')
    },
    ...overrides
  };
}

/**
 * Generate manufacturing product data
 */
export function generateManufacturingProduct(overrides = {}) {
  const categories = [
    'bearings', 'shafts', 'gaskets', 'pumps', 'valves', 'motors',
    'sensors', 'controllers', 'housings', 'brackets'
  ];

  const materials = [
    'stainless_steel', 'carbon_steel', 'aluminum', 'brass', 'titanium',
    'plastic', 'ceramic', 'composite'
  ];

  const productId = `product-${faker.string.uuid()}`;
  const category = faker.helpers.arrayElement(categories);
  const material = faker.helpers.arrayElement(materials);

  const materialCost = faker.number.float({ min: 1, max: 100, fractionDigits: 2 });
  const laborCost = faker.number.float({ min: 0.5, max: 50, fractionDigits: 2 });
  const overheadCost = faker.number.float({ min: 0.25, max: 25, fractionDigits: 2 });
  const totalCost = materialCost + laborCost + overheadCost;

  return {
    id: productId,
    sku: `${category.toUpperCase()}-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
    name: `${faker.commerce.productAdjective()} ${category.replace('_', ' ')} ${faker.commerce.product()}`,
    category: category,
    subcategory: faker.helpers.arrayElement([
      `${category}_standard`, `${category}_precision`, `${category}_heavy_duty`
    ]),
    description: faker.commerce.productDescription(),
    specifications: generateProductSpecifications(category, material),
    cost: {
      material: materialCost,
      labor: laborCost,
      overhead: overheadCost,
      total: parseFloat(totalCost.toFixed(2))
    },
    price: parseFloat((totalCost * faker.number.float({ min: 1.5, max: 3.0 })).toFixed(2)),
    lead_time_days: faker.number.int({ min: 1, max: 90 }),
    minimum_order: faker.number.int({ min: 1, max: 500 }),
    weight_grams: faker.number.int({ min: 10, max: 10000 }),
    ...overrides
  };
}

/**
 * Generate product specifications based on category and material
 */
function generateProductSpecifications(category, material) {
  const baseSpecs = {
    material: material,
    finish: faker.helpers.arrayElement(['raw', 'polished', 'anodized', 'painted', 'plated'])
  };

  switch (category) {
    case 'bearings':
      return {
        ...baseSpecs,
        inner_diameter: `${faker.number.int({ min: 5, max: 100 })}mm`,
        outer_diameter: `${faker.number.int({ min: 10, max: 200 })}mm`,
        width: `${faker.number.int({ min: 3, max: 50 })}mm`,
        precision_grade: faker.helpers.arrayElement(['P0', 'P6', 'P5', 'P4']),
        load_rating: `${faker.number.float({ min: 1, max: 50, fractionDigits: 1 })}kN`
      };

    case 'shafts':
      return {
        ...baseSpecs,
        diameter: `${faker.number.int({ min: 5, max: 100 })}mm`,
        length: `${faker.number.int({ min: 50, max: 2000 })}mm`,
        tolerance: faker.helpers.arrayElement(['h6', 'h7', 'h8', 'h9']),
        surface_finish: `Ra ${faker.number.float({ min: 0.1, max: 3.2, fractionDigits: 1 })}`,
        hardness: `${faker.number.int({ min: 20, max: 60 })}±3 HRC`
      };

    case 'pumps':
      return {
        ...baseSpecs,
        power: `${faker.number.int({ min: 1, max: 500 })}HP`,
        flow_rate: `${faker.number.int({ min: 10, max: 5000 })} GPM`,
        head: `${faker.number.int({ min: 10, max: 1000 })} feet`,
        inlet_size: `${faker.number.int({ min: 1, max: 24 })} inches`,
        outlet_size: `${faker.number.int({ min: 1, max: 20 })} inches`,
        seal_type: faker.helpers.arrayElement(['mechanical', 'packing', 'magnetic'])
      };

    default:
      return {
        ...baseSpecs,
        dimensions: `${faker.number.int({ min: 10, max: 500 })}x${faker.number.int({ min: 10, max: 500 })}x${faker.number.int({ min: 5, max: 200 })}mm`,
        tolerance: `±${faker.number.float({ min: 0.01, max: 1.0, fractionDigits: 2 })}mm`
      };
  }
}

/**
 * Generate manufacturing order data
 */
export function generateManufacturingOrder(overrides = {}) {
  const statuses = ['planning', 'in_production', 'quality_check', 'completed', 'shipped'];
  const priorities = ['low', 'normal', 'high', 'urgent'];

  const orderDate = faker.date.recent({ days: 30 });
  const deliveryDate = faker.date.future({ days: 90, refDate: orderDate });

  const lineItems = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => 
    generateOrderLineItem()
  );

  const totalValue = lineItems.reduce((sum, item) => sum + item.total_price, 0);

  return {
    id: `po-${faker.date.recent().getFullYear()}-${faker.string.numeric(3)}`,
    order_number: `PO-${faker.string.numeric(6)}`,
    customer_id: `customer-${faker.string.uuid()}`,
    customer_name: faker.company.name(),
    status: faker.helpers.arrayElement(statuses),
    priority: faker.helpers.arrayElement(priorities),
    order_date: orderDate.toISOString(),
    requested_delivery: deliveryDate.toISOString(),
    estimated_completion: faker.date.between({ 
      from: orderDate, 
      to: deliveryDate 
    }).toISOString(),
    line_items: lineItems,
    total_value: parseFloat(totalValue.toFixed(2)),
    production_notes: faker.lorem.sentence(),
    quality_requirements: faker.helpers.arrayElement([
      'Standard inspection',
      'PPAP Level 3 documentation required',
      'First article inspection',
      'Statistical process control',
      'Customer witness testing'
    ]),
    ...overrides
  };
}

/**
 * Generate order line item
 */
function generateOrderLineItem() {
  const quantity = faker.number.int({ min: 1, max: 1000 });
  const unitPrice = faker.number.float({ min: 1, max: 10000, fractionDigits: 2 });
  const totalPrice = quantity * unitPrice;

  const productionStatuses = [
    'planning', 'tooling_setup', 'material_prep', 'in_production',
    'quality_check', 'completed', 'shipped'
  ];

  return {
    id: `li-${faker.string.numeric(3)}`,
    product_id: `product-${faker.string.uuid()}`,
    sku: `${faker.string.alpha({ length: 3, casing: 'upper' })-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
    quantity: quantity,
    unit_price: unitPrice,
    total_price: parseFloat(totalPrice.toFixed(2)),
    production_status: faker.helpers.arrayElement(productionStatuses),
    scheduled_start: faker.date.future({ days: 7 }).toISOString(),
    estimated_completion: faker.date.future({ days: 30 }).toISOString()
  };
}

/**
 * Generate inventory data
 */
export function generateInventoryItem(overrides = {}) {
  const materials = [
    'chrome_steel', 'stainless_steel', 'carbon_steel', 'aluminum',
    'brass', 'titanium', 'plastic', 'rubber'
  ];

  const categories = ['raw_materials', 'work_in_progress', 'finished_goods', 'consumables'];
  const locations = [
    'warehouse_a_rack_01', 'warehouse_a_rack_02', 'warehouse_b_section_01',
    'production_floor_station_01', 'quality_lab', 'shipping_dock'
  ];

  const currentStock = faker.number.int({ min: 0, max: 5000 });
  const reorderPoint = faker.number.int({ min: 10, max: 500 });
  const economicOrderQuantity = faker.number.int({ min: 50, max: 1000 });

  return {
    id: `inv-${faker.string.uuid()}`,
    material_code: `${faker.helpers.arrayElement(materials).toUpperCase()}-${faker.string.alphanumeric({ length: 6, casing: 'upper' })}`,
    description: faker.commerce.productDescription(),
    category: faker.helpers.arrayElement(categories),
    grade: faker.helpers.arrayElement(['A', 'B', 'C', 'Premium', 'Standard']),
    specifications: generateMaterialSpecifications(),
    current_stock: {
      quantity: currentStock,
      unit: faker.helpers.arrayElement(['pieces', 'kg', 'meters', 'sheets']),
      weight_kg: faker.number.float({ min: 1, max: 10000, fractionDigits: 2 }),
      location: faker.helpers.arrayElement(locations)
    },
    reorder_point: reorderPoint,
    economic_order_quantity: economicOrderQuantity,
    cost_per_unit: faker.number.float({ min: 0.5, max: 500, fractionDigits: 2 }),
    suppliers: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => 
      generateSupplierInfo()
    ),
    ...overrides
  };
}

/**
 * Generate material specifications
 */
function generateMaterialSpecifications() {
  return {
    tensile_strength: `${faker.number.int({ min: 200, max: 2000 })} MPa`,
    yield_strength: `${faker.number.int({ min: 150, max: 1500 })} MPa`,
    hardness: `${faker.number.int({ min: 100, max: 700 })} HB`,
    density: `${faker.number.float({ min: 1.5, max: 8.5, fractionDigits: 2 })} g/cm³`,
    melting_point: `${faker.number.int({ min: 200, max: 1800 })}°C`
  };
}

/**
 * Generate supplier information
 */
function generateSupplierInfo() {
  return {
    supplier_id: `supplier-${faker.string.uuid()}`,
    lead_time_days: faker.number.int({ min: 1, max: 90 }),
    minimum_order: faker.number.int({ min: 1, max: 1000 }),
    price: faker.number.float({ min: 0.5, max: 500, fractionDigits: 2 })
  };
}

/**
 * Generate quality control data
 */
export function generateQualityRecord(overrides = {}) {
  const inspectors = [
    'qc-inspector-001', 'qc-inspector-002', 'qc-inspector-003',
    'qc-lead-001', 'quality-engineer-001'
  ];

  const characteristics = [
    'diameter', 'length', 'width', 'thickness', 'surface_finish',
    'hardness', 'concentricity', 'roundness', 'flatness'
  ];

  const operations = ['010', '020', '030', '040', '050', '060'];

  const measurements = Array.from({ 
    length: faker.number.int({ min: 1, max: 5 }) 
  }, () => generateMeasurement(characteristics));

  return {
    id: `qr-${faker.string.uuid()}`,
    date: faker.date.recent().toISOString(),
    inspector: faker.helpers.arrayElement(inspectors),
    work_order: `WO-${faker.date.recent().getFullYear()}-${faker.string.numeric(4)}`,
    product_id: `product-${faker.string.uuid()}`,
    lot_number: `LOT-${faker.date.recent().toISOString().split('T')[0].replace(/-/g, '')}-${faker.string.numeric(3)}`,
    operation: faker.helpers.arrayElement(operations),
    sample_size: faker.number.int({ min: 1, max: 10 }),
    measurements: measurements,
    overall_result: faker.helpers.arrayElement(['pass', 'fail']),
    nonconformances: [],
    corrective_actions: [],
    ...overrides
  };
}

/**
 * Generate measurement data
 */
function generateMeasurement(characteristics) {
  const characteristic = faker.helpers.arrayElement(characteristics);
  const target = faker.number.float({ min: 1, max: 100, fractionDigits: 3 });
  const tolerance = faker.number.float({ min: 0.001, max: 1, fractionDigits: 3 });
  
  const values = Array.from({ length: faker.number.int({ min: 3, max: 10 }) }, () => {
    // Generate values mostly within tolerance
    const inTolerance = faker.datatype.boolean({ probability: 0.85 });
    if (inTolerance) {
      return faker.number.float({ 
        min: target - tolerance * 0.8, 
        max: target + tolerance * 0.8, 
        fractionDigits: 3 
      });
    } else {
      return faker.number.float({ 
        min: target - tolerance * 1.5, 
        max: target + tolerance * 1.5, 
        fractionDigits: 3 
      });
    }
  });

  const allInTolerance = values.every(value => 
    Math.abs(value - target) <= tolerance
  );

  return {
    characteristic: characteristic,
    values: values,
    unit: getUnitForCharacteristic(characteristic),
    specification: `${target} ± ${tolerance}`,
    result: allInTolerance ? 'pass' : 'fail'
  };
}

/**
 * Get appropriate unit for measurement characteristic
 */
function getUnitForCharacteristic(characteristic) {
  const dimensionalChars = ['diameter', 'length', 'width', 'thickness'];
  const surfaceChars = ['surface_finish', 'flatness'];
  const materialChars = ['hardness'];

  if (dimensionalChars.includes(characteristic)) {
    return 'mm';
  } else if (surfaceChars.includes(characteristic)) {
    return 'μm';
  } else if (materialChars.includes(characteristic)) {
    return 'HRC';
  } else {
    return 'units';
  }
}

/**
 * Generate work center data
 */
export function generateWorkCenter(overrides = {}) {
  const types = [
    'cnc_machining_center', 'cnc_lathe', 'manual_lathe', 'mill',
    'grinder', 'drill_press', 'assembly_station', 'test_station'
  ];

  const manufacturers = ['Haas', 'Mazak', 'DMG Mori', 'Okuma', 'Fanuc', 'Doosan'];
  const statuses = ['operational', 'maintenance', 'setup', 'idle', 'breakdown'];

  const type = faker.helpers.arrayElement(types);
  const manufacturer = faker.helpers.arrayElement(manufacturers);

  return {
    id: `wc-${type.split('_')[0]}-${faker.string.numeric(3)}`,
    name: `${type.replace('_', ' ')} ${faker.string.numeric(1)}`,
    type: type,
    manufacturer: manufacturer,
    model: `${manufacturer}-${faker.string.alphanumeric({ length: 5, casing: 'upper' })}`,
    year: faker.number.int({ min: 2015, max: 2024 }),
    capabilities: generateWorkCenterCapabilities(type),
    specifications: generateWorkCenterSpecifications(type),
    status: faker.helpers.arrayElement(statuses),
    utilization_target: faker.number.int({ min: 70, max: 95 }),
    current_utilization: faker.number.int({ min: 60, max: 100 }),
    scheduled_maintenance: faker.date.future({ days: 90 }).toISOString(),
    operator_required: faker.datatype.boolean({ probability: 0.7 }),
    hourly_rate: faker.number.float({ min: 50, max: 200, fractionDigits: 2 }),
    ...overrides
  };
}

/**
 * Generate work center capabilities based on type
 */
function generateWorkCenterCapabilities(type) {
  const capabilityMap = {
    'cnc_machining_center': ['milling', 'drilling', 'tapping', 'boring'],
    'cnc_lathe': ['turning', 'drilling', 'threading', 'grooving'],
    'manual_lathe': ['turning', 'drilling', 'threading'],
    'mill': ['milling', 'drilling', 'slotting'],
    'grinder': ['surface_grinding', 'cylindrical_grinding'],
    'drill_press': ['drilling', 'reaming', 'countersinking'],
    'assembly_station': ['assembly', 'torquing', 'testing'],
    'test_station': ['dimensional_inspection', 'functional_testing']
  };

  return capabilityMap[type] || ['general_purpose'];
}

/**
 * Generate work center specifications based on type
 */
function generateWorkCenterSpecifications(type) {
  if (type.includes('machining') || type.includes('mill')) {
    return {
      x_travel: `${faker.number.int({ min: 500, max: 3000 })}mm`,
      y_travel: `${faker.number.int({ min: 400, max: 2000 })}mm`,
      z_travel: `${faker.number.int({ min: 300, max: 1000 })}mm`,
      spindle_speed: `${faker.number.int({ min: 3000, max: 20000 })} RPM`,
      tool_capacity: faker.number.int({ min: 12, max: 120 })
    };
  } else if (type.includes('lathe')) {
    return {
      max_diameter: `${faker.number.int({ min: 200, max: 800 })}mm`,
      max_length: `${faker.number.int({ min: 300, max: 2000 })}mm`,
      spindle_speed: `${faker.number.int({ min: 2000, max: 8000 })} RPM`,
      tool_positions: faker.number.int({ min: 8, max: 24 })
    };
  } else {
    return {
      capacity: `${faker.number.int({ min: 1, max: 20 })} units/hour`,
      precision: `±${faker.number.float({ min: 0.001, max: 0.1, fractionDigits: 3 })}mm`
    };
  }
}

/**
 * Generate realistic API response timing data
 */
export function generateApiResponseTiming(overrides = {}) {
  const baseResponse = {
    start_time: Date.now(),
    network_latency: faker.number.int({ min: 10, max: 500 }),
    processing_time: faker.number.int({ min: 50, max: 2000 }),
    serialization_time: faker.number.int({ min: 1, max: 50 }),
    ...overrides
  };

  baseResponse.end_time = baseResponse.start_time + 
    baseResponse.network_latency + 
    baseResponse.processing_time + 
    baseResponse.serialization_time;

  baseResponse.total_duration = baseResponse.end_time - baseResponse.start_time;

  return baseResponse;
}

/**
 * Generate performance metrics
 */
export function generatePerformanceMetrics(overrides = {}) {
  return {
    cpu_usage: faker.number.float({ min: 0.1, max: 0.95, fractionDigits: 3 }),
    memory_usage: {
      rss: faker.number.int({ min: 50000000, max: 500000000 }), // bytes
      heapUsed: faker.number.int({ min: 30000000, max: 300000000 }),
      heapTotal: faker.number.int({ min: 40000000, max: 400000000 }),
      external: faker.number.int({ min: 1000000, max: 50000000 })
    },
    response_times: {
      p50: faker.number.int({ min: 50, max: 500 }),
      p95: faker.number.int({ min: 200, max: 2000 }),
      p99: faker.number.int({ min: 500, max: 5000 })
    },
    throughput: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    error_rate: faker.number.float({ min: 0, max: 0.05, fractionDigits: 4 }),
    ...overrides
  };
}

// Export all generators
export const testDataGenerators = {
  generateManufacturingCompany,
  generateManufacturingProduct,
  generateManufacturingOrder,
  generateInventoryItem,
  generateQualityRecord,
  generateWorkCenter,
  generateApiResponseTiming,
  generatePerformanceMetrics
};