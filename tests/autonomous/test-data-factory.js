/**
 * Test Data Factory - Enterprise-Grade Realistic Test Data Generation
 * Generates comprehensive test data for manufacturing, financial, and business scenarios
 * with configurable complexity and edge cases for thorough testing
 */

import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';

// Configure faker for manufacturing/business context
faker.locale = 'en_US';
faker.seed(12345); // Reproducible test data

class TestDataFactory {
  constructor() {
    this.scenarios = {
      manufacturing: ['normal_operation', 'high_load', 'maintenance_mode', 'quality_issues', 'emergency_stop'],
      financial: ['steady_growth', 'seasonal_decline', 'rapid_expansion', 'cash_flow_issues', 'market_volatility'],
      users: ['admin_workflows', 'manager_operations', 'operator_tasks', 'viewer_access', 'multi_role_scenarios']
    };

    this.products = [
      { name: 'GABA Red 500ml', sku: 'GAB-R-500', category: 'Beverages', unitCost: 12.50, sellingPrice: 24.99 },
      { name: 'GABA Clear 500ml', sku: 'GAB-C-500', category: 'Beverages', unitCost: 11.80, sellingPrice: 22.99 },
      { name: 'GABA Red 250ml', sku: 'GAB-R-250', category: 'Beverages', unitCost: 8.20, sellingPrice: 16.99 },
      { name: 'GABA Clear 250ml', sku: 'GAB-C-250', category: 'Beverages', unitCost: 7.90, sellingPrice: 15.99 },
      { name: 'GABA Premium Mix', sku: 'GAB-PM-750', category: 'Premium', unitCost: 18.75, sellingPrice: 39.99 }
    ];

    this.productionLines = [
      { id: 'LINE-A', name: 'GABA Red Production', capacity: 2500, efficiency: 96.3 },
      { id: 'LINE-B', name: 'GABA Clear Production', capacity: 2300, efficiency: 92.1 },
      { id: 'LINE-C', name: 'Packaging Line', capacity: 1800, efficiency: 94.5 },
      { id: 'LINE-D', name: 'Quality Control Station', capacity: 500, efficiency: 98.8 }
    ];

    this.qualityTests = [
      { name: 'pH Analysis', category: 'chemical', duration: 30, passRate: 0.97, spec: '6.5-7.2' },
      { name: 'Microbiological Count', category: 'microbiological', duration: 240, passRate: 0.99, spec: '<100 CFU/ml' },
      { name: 'Alcohol Content', category: 'chemical', duration: 45, passRate: 0.95, spec: '12.0-12.5%' },
      { name: 'Viscosity Test', category: 'physical', duration: 15, passRate: 0.98, spec: '1.2-1.8 cP' },
      { name: 'Color Consistency', category: 'physical', duration: 10, passRate: 0.94, spec: 'L*45-55' },
      { name: 'Taste Panel', category: 'sensory', duration: 60, passRate: 0.92, spec: 'Score >8.0' }
    ];

    this.suppliers = [
      { name: 'Premium Ingredients Ltd', category: 'Raw Materials', reliability: 0.95, leadTime: 7 },
      { name: 'Botanical Extracts Co', category: 'Active Compounds', reliability: 0.98, leadTime: 14 },
      { name: 'Packaging Solutions Inc', category: 'Packaging', reliability: 0.92, leadTime: 5 },
      { name: 'Quality Labels Pro', category: 'Labels', reliability: 0.97, leadTime: 3 }
    ];
  }

  // Generate comprehensive user test data
  generateUserData(scenario = 'normal', count = 10) {
    const users = [];
    const roles = ['admin', 'manager', 'operator', 'viewer'];
    const departments = ['Production', 'Quality', 'Finance', 'IT', 'Management'];

    for (let i = 0; i < count; i++) {
      const role = this.weightedChoice(roles, [0.1, 0.2, 0.5, 0.2]);
      const user = {
        id: `user_${faker.string.uuid()}`,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        role,
        department: faker.helpers.arrayElement(departments),
        isActive: Math.random() > 0.05, // 95% active users
        lastLogin: faker.date.recent({ days: 30 }),
        createdAt: faker.date.past({ years: 2 }),
        permissions: this.generatePermissions(role),
        preferences: {
          theme: faker.helpers.arrayElement(['light', 'dark']),
          notifications: Math.random() > 0.3,
          dashboardLayout: faker.helpers.arrayElement(['compact', 'detailed', 'custom'])
        },
        // Authentication test data
        authTokens: this.generateAuthTokens(),
        sessionData: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
          loginAttempts: Math.floor(Math.random() * 3),
          lockoutUntil: null
        }
      };

      // Add scenario-specific modifications
      if (scenario === 'security_testing') {
        user.authTokens.expired = true;
        user.sessionData.loginAttempts = Math.floor(Math.random() * 5) + 3;
      }

      users.push(user);
    }

    return users;
  }

  generatePermissions(role) {
    const allPermissions = [
      'dashboard:view', 'dashboard:edit',
      'production:view', 'production:control', 'production:reports',
      'quality:view', 'quality:test', 'quality:approve',
      'inventory:view', 'inventory:adjust', 'inventory:purchase',
      'finance:view', 'finance:edit', 'finance:reports',
      'admin:users', 'admin:system', 'admin:config'
    ];

    const rolePermissions = {
      admin: allPermissions,
      manager: allPermissions.filter(p => !p.startsWith('admin:')),
      operator: allPermissions.filter(p => !p.includes('edit') && !p.includes('admin')),
      viewer: allPermissions.filter(p => p.includes('view'))
    };

    return rolePermissions[role] || [];
  }

  generateAuthTokens() {
    return {
      accessToken: faker.string.uuid(),
      refreshToken: faker.string.uuid(),
      expiresAt: faker.date.future(),
      expired: false,
      scope: 'full_access'
    };
  }

  // Generate realistic manufacturing production data
  generateProductionData(scenario = 'normal_operation', days = 30, recordsPerDay = 24) {
    const productionRecords = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let day = 0; day < days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      // Apply scenario modifiers
      const scenarioModifiers = this.getProductionScenarioModifiers(scenario, day);

      for (let hour = 0; hour < recordsPerDay; hour++) {
        const recordTime = new Date(currentDate);
        recordTime.setHours(hour);

        for (const line of this.productionLines) {
          const baseEfficiency = line.efficiency * scenarioModifiers.efficiency;
          const efficiency = this.addVariation(baseEfficiency, 5);
          
          const baseOutput = (line.capacity / 24) * scenarioModifiers.output;
          const actualOutput = Math.floor(baseOutput * (efficiency / 100));
          
          const record = {
            id: `prod_${faker.string.uuid()}`,
            timestamp: recordTime.toISOString(),
            date: recordTime.toISOString().split('T')[0],
            time: recordTime.toTimeString().split(' ')[0],
            lineId: line.id,
            lineName: line.name,
            product: faker.helpers.arrayElement(this.products).name,
            targetQuantity: Math.floor(line.capacity / 24),
            actualQuantity: actualOutput,
            efficiency: Math.round(efficiency * 100) / 100,
            qualityRate: this.addVariation(scenarioModifiers.quality * 100, 2),
            downtime: Math.max(0, Math.floor(Math.random() * scenarioModifiers.downtime)),
            downtimeReason: this.getDowntimeReason(scenarioModifiers.downtime),
            operatorId: `OP_${Math.floor(Math.random() * 10) + 1}`,
            shift: Math.floor(hour / 8) + 1,
            temperature: this.addVariation(50, 3), // Celsius
            pressure: this.addVariation(2.5, 0.2), // Bar
            batchId: `B${currentDate.getFullYear()}_${String(day * 24 + hour).padStart(4, '0')}`,
            notes: this.generateProductionNotes(efficiency, scenarioModifiers),
            // Calculated fields
            utilizationRate: (actualOutput / (line.capacity / 24)) * 100,
            rejectRate: Math.max(0, (100 - scenarioModifiers.quality * 100) + Math.random() * 2),
            energyConsumption: actualOutput * 0.15 * (2 - efficiency / 100), // kWh per unit
            maintenanceFlag: Math.random() < 0.02, // 2% chance
            alertLevel: this.getAlertLevel(efficiency, scenarioModifiers.quality * 100)
          };

          productionRecords.push(record);
        }
      }
    }

    return productionRecords;
  }

  getProductionScenarioModifiers(scenario, dayIndex) {
    const modifiers = {
      efficiency: 1,
      output: 1,
      quality: 1,
      downtime: 5 // base downtime minutes per hour
    };

    switch (scenario) {
      case 'high_load':
        modifiers.efficiency = 0.85;
        modifiers.output = 1.2;
        modifiers.quality = 0.95;
        modifiers.downtime = 15;
        break;
      
      case 'maintenance_mode':
        if (dayIndex % 7 === 0) { // Weekly maintenance
          modifiers.efficiency = 0.3;
          modifiers.output = 0.4;
          modifiers.quality = 1.0;
          modifiers.downtime = 120;
        }
        break;
      
      case 'quality_issues':
        modifiers.efficiency = 0.92;
        modifiers.output = 0.9;
        modifiers.quality = 0.85;
        modifiers.downtime = 25;
        break;
      
      case 'emergency_stop':
        if (dayIndex === Math.floor(Math.random() * 30)) { // Random day
          modifiers.efficiency = 0;
          modifiers.output = 0;
          modifiers.quality = 0;
          modifiers.downtime = 480; // 8 hours
        }
        break;
    }

    return modifiers;
  }

  getDowntimeReason(downtimeMinutes) {
    if (downtimeMinutes === 0) return null;
    
    const reasons = [
      'Routine cleaning', 'Material changeover', 'Quality inspection',
      'Minor adjustment', 'Operator break', 'Equipment calibration',
      'Line jam clearance', 'Temperature adjustment', 'Preventive maintenance'
    ];
    
    if (downtimeMinutes > 60) {
      return faker.helpers.arrayElement([
        'Planned maintenance', 'Equipment repair', 'Major cleaning',
        'System update', 'Safety inspection', 'Line reconfiguration'
      ]);
    }
    
    return faker.helpers.arrayElement(reasons);
  }

  generateProductionNotes(efficiency, modifiers) {
    if (efficiency < 80) return 'Performance below target - investigating';
    if (modifiers.quality < 0.9) return 'Quality parameters under review';
    if (modifiers.downtime > 30) return 'Extended maintenance required';
    if (Math.random() < 0.1) return faker.helpers.arrayElement([
      'Smooth operation', 'All systems nominal', 'Good shift performance',
      'Targets met', 'No issues reported'
    ]);
    return '';
  }

  getAlertLevel(efficiency, qualityRate) {
    if (efficiency < 75 || qualityRate < 85) return 'high';
    if (efficiency < 85 || qualityRate < 95) return 'medium';
    return 'low';
  }

  // Generate comprehensive quality control test data
  generateQualityData(scenario = 'normal', days = 30, testsPerDay = 50) {
    const qualityRecords = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let day = 0; day < days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      const scenarioModifiers = this.getQualityScenarioModifiers(scenario, day);

      for (let test = 0; test < testsPerDay; test++) {
        const testTime = new Date(currentDate);
        testTime.setHours(Math.floor(Math.random() * 24));
        testTime.setMinutes(Math.floor(Math.random() * 60));

        const selectedTest = faker.helpers.arrayElement(this.qualityTests);
        const product = faker.helpers.arrayElement(this.products);
        
        // Determine test result based on scenario
        const basePassRate = selectedTest.passRate * scenarioModifiers.passRate;
        const testPassed = Math.random() < basePassRate;
        
        const record = {
          id: `qc_${faker.string.uuid()}`,
          timestamp: testTime.toISOString(),
          date: testTime.toISOString().split('T')[0],
          testName: selectedTest.name,
          category: selectedTest.category,
          batchId: `B${currentDate.getFullYear()}_${String(day * 24 + Math.floor(Math.random() * 24)).padStart(4, '0')}`,
          product: product.name,
          sku: product.sku,
          status: testPassed ? 'passed' : 'failed',
          result: this.generateTestResult(selectedTest, testPassed),
          specification: selectedTest.spec,
          technician: this.generateTechnicianName(),
          equipmentId: `QC_${selectedTest.category.toUpperCase()}_${Math.floor(Math.random() * 5) + 1}`,
          duration: this.addVariation(selectedTest.duration, 10), // minutes
          priority: this.getTestPriority(selectedTest.category, testPassed),
          retestRequired: !testPassed && Math.random() < 0.3,
          notes: this.generateQualityNotes(testPassed, selectedTest),
          // Additional fields for comprehensive testing
          sampleSize: Math.floor(Math.random() * 10) + 1,
          testMethod: this.getTestMethod(selectedTest.category),
          certificationRequired: selectedTest.category === 'microbiological',
          costPerTest: this.getTestCost(selectedTest.category),
          alertGenerated: !testPassed,
          followUpAction: !testPassed ? this.getFollowUpAction(selectedTest.category) : null,
          reviewedBy: testPassed ? null : this.generateManagerName(),
          calibrationDate: faker.date.recent({ days: 90 }),
          environmentalConditions: {
            temperature: this.addVariation(22, 2),
            humidity: this.addVariation(45, 5),
            pressure: this.addVariation(1013.25, 5)
          }
        };

        qualityRecords.push(record);
      }
    }

    return qualityRecords;
  }

  getQualityScenarioModifiers(scenario, dayIndex) {
    let passRate = 1.0;

    switch (scenario) {
      case 'quality_issues':
        passRate = 0.75; // Increased failure rate
        break;
      case 'equipment_problems':
        if (dayIndex % 5 === 0) passRate = 0.60; // Equipment issues every 5 days
        break;
      case 'new_batch':
        if (dayIndex < 3) passRate = 0.80; // Lower pass rate for new batches
        break;
      case 'audit_mode':
        passRate = 0.98; // Higher scrutiny
        break;
    }

    return { passRate };
  }

  generateTestResult(test, passed) {
    const { name, spec } = test;
    
    if (!passed) {
      // Generate out-of-spec results
      switch (name) {
        case 'pH Analysis':
          return Math.random() < 0.5 ? '6.2' : '7.5'; // Outside 6.5-7.2 range
        case 'Alcohol Content':
          return Math.random() < 0.5 ? '11.7%' : '12.8%'; // Outside 12.0-12.5% range
        case 'Microbiological Count':
          return `${Math.floor(Math.random() * 200) + 100} CFU/ml`; // Above 100
        default:
          return 'Out of specification';
      }
    }

    // Generate in-spec results
    switch (name) {
      case 'pH Analysis':
        return (Math.random() * 0.7 + 6.5).toFixed(1); // 6.5-7.2
      case 'Alcohol Content':
        return (Math.random() * 0.5 + 12.0).toFixed(1) + '%'; // 12.0-12.5%
      case 'Microbiological Count':
        return `${Math.floor(Math.random() * 50)} CFU/ml`; // Under 100
      case 'Viscosity Test':
        return (Math.random() * 0.6 + 1.2).toFixed(2) + ' cP'; // 1.2-1.8
      case 'Color Consistency':
        return `L*${Math.floor(Math.random() * 10) + 45}`; // L*45-55
      case 'Taste Panel':
        return `Score: ${(Math.random() * 2 + 8).toFixed(1)}`; // >8.0
      default:
        return 'Within specification';
    }
  }

  async generateTechnicianName() {
    try {
      // Try to get real personnel data from the personnel service
      const personnel = await this.getPersonnelData('technician');
      if (personnel && personnel.length > 0) {
        const person = faker.helpers.arrayElement(personnel);
        return person.display_name || person.full_name || `${person.first_name} ${person.last_name}`;
      }
    } catch (error) {
      console.warn('Failed to fetch real personnel, using fallback');
    }
    
    // Fallback to realistic but clearly generated names
    return `${faker.person.firstName()} ${faker.person.lastName()}`;
  }

  async generateManagerName() {
    try {
      // Try to get real personnel data from the personnel service
      const personnel = await this.getPersonnelData('manager');
      if (personnel && personnel.length > 0) {
        const person = faker.helpers.arrayElement(personnel);
        return person.display_name || person.full_name || `${person.first_name} ${person.last_name}`;
      }
    } catch (error) {
      console.warn('Failed to fetch real personnel, using fallback');
    }
    
    // Fallback to realistic but clearly generated names
    return `${faker.person.firstName()} ${faker.person.lastName()}`;
  }

  // Helper method to fetch personnel data
  async getPersonnelData(roleType) {
    try {
      // Resolve absolute API base URL for Node environment
      const apiBase = process.env.API_BASE_URL
        || process.env.VITE_API_BASE_URL
        || (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api` : 'http://localhost:3000/api');

      // Build URL safely using URL + searchParams
      const url = new URL('personnel', apiBase.endsWith('/') ? apiBase : `${apiBase}/`);
      if (roleType === 'manager') {
        url.searchParams.append('role', 'manager');
        url.searchParams.append('role', 'admin');
      } else if (roleType === 'technician') {
        url.searchParams.append('role', 'operator');
        url.searchParams.append('role', 'manager');
      }

      const response = await fetch(url.toString());
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
    } catch (error) {
      console.warn('Error fetching personnel data:', error);
    }
    return [];
  }

  getTestPriority(category, passed) {
    if (!passed) {
      if (category === 'microbiological') return 'urgent';
      if (category === 'chemical') return 'high';
      return 'medium';
    }
    return 'normal';
  }

  getTestMethod(category) {
    const methods = {
      chemical: ['HPLC', 'GC-MS', 'Titration', 'UV-Vis Spectroscopy'],
      microbiological: ['Plate Count', 'PCR', 'ATP Bioluminescence', 'Flow Cytometry'],
      physical: ['Rheometer', 'Colorimeter', 'Texture Analyzer', 'Densitometer'],
      sensory: ['Triangle Test', 'Descriptive Analysis', '9-Point Hedonic Scale']
    };
    return faker.helpers.arrayElement(methods[category] || ['Standard Method']);
  }

  getTestCost(category) {
    const costs = {
      chemical: Math.random() * 50 + 25, // $25-75
      microbiological: Math.random() * 100 + 50, // $50-150
      physical: Math.random() * 30 + 15, // $15-45
      sensory: Math.random() * 80 + 40 // $40-120
    };
    return Math.round(costs[category] || 35);
  }

  getFollowUpAction(category) {
    const actions = {
      chemical: ['Retest batch', 'Adjust formulation', 'Check equipment calibration'],
      microbiological: ['Quarantine batch', 'Environmental monitoring', 'Deep sanitization'],
      physical: ['Equipment maintenance', 'Process adjustment', 'Raw material check'],
      sensory: ['Panel retesting', 'Ingredient review', 'Process optimization']
    };
    return faker.helpers.arrayElement(actions[category] || ['General investigation']);
  }

  generateQualityNotes(passed, test) {
    if (passed) {
      if (Math.random() < 0.2) {
        return faker.helpers.arrayElement([
          'Test completed without issues',
          'Results within normal range',
          'Good reproducibility',
          'Equipment performing well'
        ]);
      }
      return '';
    }

    return faker.helpers.arrayElement([
      `${test.name} failed - investigating root cause`,
      'Sample preparation may be compromised',
      'Equipment recalibration recommended',
      'Process parameters need adjustment',
      'Raw material quality concern',
      'Environmental conditions may have influenced results'
    ]);
  }

  // Generate realistic inventory data
  generateInventoryData(scenario = 'normal', itemCount = 100) {
    const inventoryItems = [];
    const categories = ['Raw Materials', 'Packaging', 'Finished Goods', 'Consumables', 'Spare Parts'];
    const warehouses = ['Main Warehouse', 'Production Floor', 'Quality Lab', 'Packaging Area', 'Shipping Dock'];

    for (let i = 0; i < itemCount; i++) {
      const category = faker.helpers.arrayElement(categories);
      const item = {
        id: `inv_${faker.string.uuid()}`,
        sku: faker.commerce.product().replace(/\s+/g, '-').toUpperCase() + `-${faker.datatype.number({ min: 100, max: 999 })}`,
        name: this.generateInventoryItemName(category),
        category,
        description: faker.commerce.productDescription(),
        currentStock: this.generateStockLevel(scenario, category),
        minimumStock: Math.floor(Math.random() * 50) + 10,
        maximumStock: Math.floor(Math.random() * 500) + 200,
        reorderPoint: Math.floor(Math.random() * 100) + 25,
        unitCost: parseFloat(faker.commerce.price(1, 100, 2)),
        supplier: faker.helpers.arrayElement(this.suppliers).name,
        location: faker.helpers.arrayElement(warehouses),
        lastUpdated: faker.date.recent({ days: 7 }),
        lastOrdered: faker.date.past({ months: 2 }),
        expirationDate: this.getExpirationDate(category),
        batchNumber: `BATCH_${faker.datatype.number({ min: 1000, max: 9999 })}`,
        qualityStatus: this.getQualityStatus(scenario),
        unitOfMeasure: this.getUnitOfMeasure(category),
        // Movement tracking
        movementHistory: this.generateMovementHistory(7), // Last 7 days
        // Forecasting data
        averageDailyUsage: Math.random() * 10 + 1,
        leadTime: Math.floor(Math.random() * 14) + 1, // Days
        seasonalityFactor: Math.random() * 0.5 + 0.75, // 0.75-1.25
        // Financial data
        totalValue: 0, // Calculated below
        turnoverRate: Math.random() * 12 + 1, // Times per year
        carryingCost: Math.random() * 0.25 + 0.15 // 15-40% of value per year
      };

      item.totalValue = item.currentStock * item.unitCost;
      inventoryItems.push(item);
    }

    return inventoryItems;
  }

  generateInventoryItemName(category) {
    const names = {
      'Raw Materials': [
        'GABA Powder', 'Natural Flavoring Extract', 'Citric Acid', 'Purified Water',
        'Sugar Substitute', 'Preservative E200', 'Vitamin C', 'Natural Coloring'
      ],
      'Packaging': [
        '500ml Glass Bottle', '250ml Glass Bottle', 'Bottle Cap', 'Product Label',
        'Shrink Wrap', 'Cardboard Box 12-pack', 'Pallet Wood', 'Shipping Label'
      ],
      'Finished Goods': this.products.map(p => p.name),
      'Consumables': [
        'Cleaning Solution', 'Sanitizer', 'Filter Cartridge', 'pH Test Strips',
        'Sampling Containers', 'Safety Gloves', 'Hair Nets', 'Lab Coats'
      ],
      'Spare Parts': [
        'Pump Seal Kit', 'Conveyor Belt', 'Temperature Sensor', 'Flow Meter',
        'Valve Assembly', 'Motor Coupling', 'Filter Housing', 'Safety Switch'
      ]
    };
    return faker.helpers.arrayElement(names[category]);
  }

  generateStockLevel(scenario, category) {
    let baseStock = Math.floor(Math.random() * 1000) + 50;

    if (scenario === 'low_stock') {
      baseStock = Math.floor(Math.random() * 30) + 1; // Very low
    } else if (scenario === 'overstock') {
      baseStock = Math.floor(Math.random() * 2000) + 1000; // High
    } else if (scenario === 'stockout') {
      if (Math.random() < 0.1) baseStock = 0; // 10% chance of stockout
    }

    return baseStock;
  }

  getExpirationDate(category) {
    if (['Raw Materials', 'Finished Goods'].includes(category)) {
      return faker.date.future({ years: 2 });
    }
    return null; // Non-perishable items
  }

  getQualityStatus(scenario) {
    const statuses = ['approved', 'quarantine', 'rejected', 'pending'];
    const weights = scenario === 'quality_issues' ? [0.7, 0.15, 0.1, 0.05] : [0.9, 0.05, 0.02, 0.03];
    return this.weightedChoice(statuses, weights);
  }

  getUnitOfMeasure(category) {
    const units = {
      'Raw Materials': ['kg', 'L', 'g', 'mL'],
      'Packaging': ['pcs', 'cases', 'rolls', 'sheets'],
      'Finished Goods': ['bottles', 'cases', 'pallets'],
      'Consumables': ['pcs', 'boxes', 'L', 'kg'],
      'Spare Parts': ['pcs', 'sets', 'meters', 'units']
    };
    return faker.helpers.arrayElement(units[category]);
  }

  generateMovementHistory(days) {
    const movements = [];
    const types = ['receipt', 'issue', 'transfer', 'adjustment', 'return'];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      if (Math.random() < 0.3) { // 30% chance of movement per day
        movements.push({
          date: date.toISOString(),
          type: faker.helpers.arrayElement(types),
          quantity: Math.floor(Math.random() * 100) + 1,
          reason: faker.lorem.sentence(),
          user: `user_${Math.floor(Math.random() * 10) + 1}`
        });
      }
    }

    return movements.reverse(); // Chronological order
  }

  // Generate realistic financial data
  generateFinancialData(scenario = 'steady_growth', months = 12) {
    const financialRecords = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const accounts = [
      { code: '1000', name: 'Cash & Cash Equivalents', type: 'Asset', category: 'Current Assets' },
      { code: '1200', name: 'Accounts Receivable', type: 'Asset', category: 'Current Assets' },
      { code: '1300', name: 'Inventory', type: 'Asset', category: 'Current Assets' },
      { code: '1500', name: 'Property Plant Equipment', type: 'Asset', category: 'Fixed Assets' },
      { code: '2000', name: 'Accounts Payable', type: 'Liability', category: 'Current Liabilities' },
      { code: '2100', name: 'Short Term Loans', type: 'Liability', category: 'Current Liabilities' },
      { code: '3000', name: 'Equity', type: 'Equity', category: 'Shareholders Equity' },
      { code: '4000', name: 'Revenue', type: 'Revenue', category: 'Operating Revenue' },
      { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', category: 'Cost of Sales' },
      { code: '6000', name: 'Operating Expenses', type: 'Expense', category: 'Operating Expenses' }
    ];

    for (let month = 0; month < months; month++) {
      const recordDate = new Date(startDate);
      recordDate.setMonth(startDate.getMonth() + month);

      const scenarioModifiers = this.getFinancialScenarioModifiers(scenario, month);

      for (const account of accounts) {
        const baseAmount = this.getBaseFinancialAmount(account);
        const amount = baseAmount * scenarioModifiers[account.type.toLowerCase()] * (1 + Math.random() * 0.1 - 0.05);

        const record = {
          id: `fin_${faker.string.uuid()}`,
          date: recordDate.toISOString().split('T')[0],
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          category: account.category,
          amount: Math.round(amount),
          currency: 'USD',
          period: `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`,
          // Additional financial metrics
          budgetAmount: amount * (1 + Math.random() * 0.2 - 0.1), // +/- 10% variance
          variance: 0, // Calculated below
          ytdAmount: 0, // Year to date - calculated below
          priorYearAmount: amount * (0.9 + Math.random() * 0.2), // Growth baseline
          // Cash flow classification
          cashFlowCategory: this.getCashFlowCategory(account.type),
          // Analysis flags
          outlierFlag: Math.random() < 0.05, // 5% chance of outlier
          notes: this.generateFinancialNotes(account, scenarioModifiers),
          source: faker.helpers.arrayElement(['Manual Entry', 'System Import', 'Bank Feed', 'Journal Entry']),
          createdBy: faker.helpers.arrayElement(['Finance Team', 'Accountant', 'CFO', 'System'])
        };

        record.variance = record.amount - record.budgetAmount;
        financialRecords.push(record);
      }
    }

    // Calculate YTD amounts
    this.calculateYTDAmounts(financialRecords);

    return financialRecords;
  }

  getFinancialScenarioModifiers(scenario, monthIndex) {
    const modifiers = { asset: 1, liability: 1, equity: 1, revenue: 1, expense: 1 };

    switch (scenario) {
      case 'steady_growth':
        const growthFactor = 1 + (monthIndex * 0.02); // 2% monthly growth
        modifiers.revenue = growthFactor;
        modifiers.asset = growthFactor * 0.8;
        modifiers.expense = growthFactor * 0.9;
        break;

      case 'seasonal_decline':
        const seasonFactor = Math.sin(monthIndex * Math.PI / 6) * 0.3 + 0.8; // Seasonal pattern
        modifiers.revenue = seasonFactor;
        modifiers.expense = 0.95; // Fixed costs remain
        break;

      case 'rapid_expansion':
        modifiers.revenue = 1 + monthIndex * 0.05; // 5% monthly growth
        modifiers.asset = 1 + monthIndex * 0.04;
        modifiers.expense = 1 + monthIndex * 0.06; // Higher expense growth
        modifiers.liability = 1 + monthIndex * 0.03; // Increased borrowing
        break;

      case 'cash_flow_issues':
        modifiers.revenue = 0.85; // 15% revenue decline
        modifiers.expense = 1.1; // 10% expense increase
        modifiers.liability = 1.2; // 20% more debt
        break;

      case 'market_volatility':
        const volatility = Math.random() * 0.6 + 0.7; // 70-130% range
        Object.keys(modifiers).forEach(key => {
          modifiers[key] = volatility;
        });
        break;
    }

    return modifiers;
  }

  getBaseFinancialAmount(account) {
    const baseAmounts = {
      '1000': 500000,  // Cash
      '1200': 750000,  // AR
      '1300': 400000,  // Inventory
      '1500': 2000000, // PPE
      '2000': 300000,  // AP
      '2100': 200000,  // Loans
      '3000': 1500000, // Equity
      '4000': 1200000, // Revenue
      '5000': 600000,  // COGS
      '6000': 400000   // OpEx
    };
    return baseAmounts[account.code] || 100000;
  }

  getCashFlowCategory(accountType) {
    const categories = {
      Asset: 'Operating',
      Liability: 'Financing',
      Revenue: 'Operating',
      Expense: 'Operating',
      Equity: 'Financing'
    };
    return categories[accountType] || 'Operating';
  }

  generateFinancialNotes(account, modifiers) {
    if (Math.random() < 0.1) { // 10% chance of notes
      const notes = [
        `${account.name} shows expected trend`,
        'Monthly variance within acceptable range',
        'Performance aligned with budget',
        'Seasonal adjustment applied',
        'Growth target achieved'
      ];
      return faker.helpers.arrayElement(notes);
    }
    return '';
  }

  calculateYTDAmounts(records) {
    const ytdMap = new Map();

    records.sort((a, b) => new Date(a.date) - new Date(b.date));

    records.forEach(record => {
      const key = `${record.accountCode}_${record.date.split('-')[0]}`;
      const ytdAmount = (ytdMap.get(key) || 0) + record.amount;
      ytdMap.set(key, ytdAmount);
      record.ytdAmount = ytdAmount;
    });
  }

  // Generate API integration test data
  generateAPITestData(scenario = 'normal') {
    return {
      shopify: this.generateShopifyData(scenario),
      xero: this.generateXeroData(scenario),
      clerk: this.generateClerkData(scenario)
    };
  }

  generateShopifyData(scenario) {
    const products = this.products.map(p => ({
      id: faker.datatype.number({ min: 1000000, max: 9999999 }),
      title: p.name,
      handle: p.name.toLowerCase().replace(/\s+/g, '-'),
      product_type: p.category,
      vendor: 'Sentia Spirits',
      status: 'active',
      variants: [{
        id: faker.datatype.number({ min: 10000000, max: 99999999 }),
        sku: p.sku,
        price: p.sellingPrice.toString(),
        inventory_quantity: Math.floor(Math.random() * 1000) + 100
      }]
    }));

    const orders = [];
    for (let i = 0; i < 50; i++) {
      const order = {
        id: faker.datatype.number({ min: 1000, max: 9999 }),
        order_number: faker.datatype.number({ min: 1000, max: 9999 }),
        email: faker.internet.email(),
        created_at: faker.date.recent({ days: 30 }).toISOString(),
        total_price: faker.commerce.price(20, 200, 2),
        currency: 'USD',
        financial_status: faker.helpers.arrayElement(['paid', 'pending', 'refunded']),
        fulfillment_status: faker.helpers.arrayElement(['fulfilled', 'partial', 'unfulfilled']),
        line_items: [{
          id: faker.datatype.number({ min: 1000000, max: 9999999 }),
          product_id: faker.helpers.arrayElement(products).id,
          quantity: Math.floor(Math.random() * 5) + 1,
          price: faker.commerce.price(15, 50, 2)
        }],
        customer: {
          id: faker.datatype.number({ min: 1000000, max: 9999999 }),
          email: faker.internet.email(),
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName()
        }
      };
      orders.push(order);
    }

    return { products, orders };
  }

  generateXeroData(scenario) {
    const balanceSheet = {
      Reports: [{
        ReportID: 'BalanceSheet',
        ReportName: 'Balance Sheet',
        ReportDate: new Date().toISOString().split('T')[0],
        Rows: [
          {
            RowType: 'Section',
            Title: 'Assets',
            Rows: [
              { RowType: 'Row', Cells: [{ Value: 'Current Assets' }, { Value: '1,250,000' }] },
              { RowType: 'Row', Cells: [{ Value: 'Fixed Assets' }, { Value: '2,000,000' }] }
            ]
          },
          {
            RowType: 'Section',
            Title: 'Liabilities',
            Rows: [
              { RowType: 'Row', Cells: [{ Value: 'Current Liabilities' }, { Value: '500,000' }] },
              { RowType: 'Row', Cells: [{ Value: 'Long Term Liabilities' }, { Value: '800,000' }] }
            ]
          }
        ]
      }]
    };

    const profitLoss = {
      Reports: [{
        ReportID: 'ProfitAndLoss',
        ReportName: 'Profit and Loss',
        ReportDate: new Date().toISOString().split('T')[0],
        Rows: [
          { RowType: 'Row', Cells: [{ Value: 'Revenue' }, { Value: '1,200,000' }] },
          { RowType: 'Row', Cells: [{ Value: 'Cost of Sales' }, { Value: '600,000' }] },
          { RowType: 'Row', Cells: [{ Value: 'Gross Profit' }, { Value: '600,000' }] },
          { RowType: 'Row', Cells: [{ Value: 'Operating Expenses' }, { Value: '400,000' }] },
          { RowType: 'Row', Cells: [{ Value: 'Net Profit' }, { Value: '200,000' }] }
        ]
      }]
    };

    return { balanceSheet, profitLoss };
  }

  generateClerkData(scenario) {
    return {
      users: this.generateUserData(scenario, 20),
      sessions: Array.from({ length: 10 }, () => ({
        id: `sess_${faker.string.uuid()}`,
        userId: `user_${faker.string.uuid()}`,
        status: 'active',
        lastActiveAt: faker.date.recent({ hours: 24 }),
        expireAt: faker.date.future({ days: 7 })
      }))
    };
  }

  // Utility functions
  addVariation(baseValue, percentVariation) {
    const variation = (Math.random() - 0.5) * 2 * (percentVariation / 100);
    return baseValue * (1 + variation);
  }

  weightedChoice(choices, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < choices.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return choices[i];
      }
    }
    
    return choices[choices.length - 1];
  }

  // Generate comprehensive test scenario
  generateCompleteTestScenario(scenarioName = 'comprehensive') {
    console.log(`Generating comprehensive test scenario: ${scenarioName}`);

    const scenario = {
      name: scenarioName,
      description: `Complete test data set for ${scenarioName} testing scenario`,
      generatedAt: new Date().toISOString(),
      users: this.generateUserData('normal', 20),
      production: this.generateProductionData('normal_operation', 30, 24),
      quality: this.generateQualityData('normal', 30, 50),
      inventory: this.generateInventoryData('normal', 100),
      financial: this.generateFinancialData('steady_growth', 12),
      api: this.generateAPITestData('normal'),
      // Test configuration
      testConfig: {
        baseURL: 'http://127.0.0.1:3000',
        apiURL: 'http://127.0.0.1:5000/api',
        testDuration: '60 minutes',
        expectedLoadTime: 3000,
        maxResponseTime: 500,
        minPassRate: 0.95
      },
      // Edge cases and stress scenarios
      edgeCases: this.generateEdgeCases(),
      // Performance baselines
      performanceBaselines: {
        pageLoadTime: 2500, // ms
        apiResponseTime: 200, // ms
        databaseQueryTime: 50, // ms
        concurrentUsers: 100,
        throughput: '1000 requests/minute'
      }
    };

    return scenario;
  }

  generateEdgeCases() {
    return {
      emptyData: {
        production: [],
        quality: [],
        inventory: [],
        users: []
      },
      invalidData: {
        malformedDates: ['invalid-date', '2024-13-45', ''],
        nullValues: [null, undefined, ''],
        sqlInjection: ["'; DROP TABLE users; --", "' OR 1=1 --"],
        xssAttempts: ["<script>alert('xss')</script>", "javascript:alert('xss')"],
        oversizePayloads: 'x'.repeat(10000),
        invalidNumbers: ['not-a-number', Infinity, -Infinity, NaN]
      },
      boundaryConditions: {
        maxValues: {
          quantity: Number.MAX_SAFE_INTEGER,
          efficiency: 100.001,
          negativeValues: -999999
        },
        stringLimits: {
          longString: 'a'.repeat(1000),
          emptyString: '',
          unicodeString: '测试数据🚀'
        }
      },
      concurrencyScenarios: {
        simultaneousLogins: 50,
        concurrentDataUploads: 10,
        parallelReports: 20
      }
    };
  }

  // Save generated test data to files
  saveTestDataToFiles(scenario, outputDir = 'tests/autonomous/data') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = {
      'users.json': scenario.users,
      'production.json': scenario.production,
      'quality.json': scenario.quality,
      'inventory.json': scenario.inventory,
      'financial.json': scenario.financial,
      'api-integration.json': scenario.api,
      'edge-cases.json': scenario.edgeCases,
      'complete-scenario.json': scenario
    };

    Object.entries(files).forEach(([filename, data]) => {
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✅ Test data saved: ${filePath}`);
    });

    // Generate test summary
    const summary = {
      scenarioName: scenario.name,
      generatedAt: scenario.generatedAt,
      recordCounts: {
        users: scenario.users.length,
        production: scenario.production.length,
        quality: scenario.quality.length,
        inventory: scenario.inventory.length,
        financial: scenario.financial.length,
        shopifyProducts: scenario.api.shopify.products.length,
        shopifyOrders: scenario.api.shopify.orders.length
      },
      estimatedTestDuration: scenario.testConfig.testDuration,
      dataSize: this.calculateDataSize(scenario)
    };

    fs.writeFileSync(
      path.join(outputDir, 'test-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    return summary;
  }

  calculateDataSize(scenario) {
    const json = JSON.stringify(scenario);
    const sizeInBytes = Buffer.byteLength(json, 'utf8');
    const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
    return `${sizeInMB} MB`;
  }
}

export default TestDataFactory;
export { TestDataFactory };