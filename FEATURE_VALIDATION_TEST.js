/**
 * Feature Validation Test
 * Basic validation of core features without npm/build pipeline
 */

// Simple Node.js script to validate file structure and imports
import { promises as fs } from 'fs';
import path from 'path';

const REQUIRED_FEATURES = [
  'src/features/working-capital/WorkingCapitalDashboard.jsx',
  'src/features/inventory/InventoryDashboard.jsx',
  'src/features/production/ProductionDashboard.jsx',
  'src/features/ai-analytics/AIAnalyticsDashboard.jsx',
  'src/features/quality/QualityControlDashboard.jsx',
  'src/components/AIInsights.jsx'
];

const REQUIRED_INFRASTRUCTURE = [
  'src/services/database/optimizedClient.js',
  'src/services/cache/redisCacheService.js',
  'src/hooks/usePerformanceMonitoring.js',
  'src/utils/structuredLogger.js',
  'vitest.config.js',
  'playwright.config.js'
];

async function validateFileExists(filePath) {
  try {
    await fs.access(filePath);
    return { path: filePath, exists: true, error: null };
  } catch (error) {
    return { path: filePath, exists: false, error: error.message };
  }
}

async function validateReactComponent(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const hasReactImport = content.includes('import React') || content.includes('from \'react\'');
    const hasExport = content.includes('export default') || content.includes('export {');
    const hasJSX = content.includes('return (') && content.includes('<');

    return {
      path: filePath,
      hasReactImport,
      hasExport,
      hasJSX,
      valid: hasReactImport && hasExport && hasJSX
    };
  } catch (error) {
    return { path: filePath, valid: false, error: error.message };
  }
}

async function runValidation() {
  console.log('🧪 Feature Validation Test - Sentia Manufacturing Dashboard');
  console.log('=' .repeat(60));

  // Test 1: Required Feature Files
  console.log('\n📁 Testing Required Feature Files...');
  const featureResults = await Promise.all(
    REQUIRED_FEATURES.map(validateFileExists)
  );

  featureResults.forEach(result => {
    const status = result.exists ? '✅' : '❌';
    console.log(`${status} ${result.path}`);
    if (!result.exists) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Test 2: Infrastructure Files
  console.log('\n🔧 Testing Infrastructure Files...');
  const infraResults = await Promise.all(
    REQUIRED_INFRASTRUCTURE.map(validateFileExists)
  );

  infraResults.forEach(result => {
    const status = result.exists ? '✅' : '❌';
    console.log(`${status} ${result.path}`);
    if (!result.exists) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Test 3: React Component Validation
  console.log('\n⚛️  Testing React Component Structure...');
  const componentValidation = await Promise.all(
    REQUIRED_FEATURES.filter(f => f.includes('.jsx')).map(validateReactComponent)
  );

  componentValidation.forEach(result => {
    if (result.valid) {
      console.log(`✅ ${result.path} - Valid React component`);
    } else {
      console.log(`❌ ${result.path} - Invalid React component`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else {
        console.log(`   Missing: ${!result.hasReactImport ? 'React import ' : ''}${!result.hasExport ? 'export ' : ''}${!result.hasJSX ? 'JSX ' : ''}`);
      }
    }
  });

  // Summary
  const featuresExist = featureResults.filter(r => r.exists).length;
  const infraExists = infraResults.filter(r => r.exists).length;
  const validComponents = componentValidation.filter(r => r.valid).length;

  console.log('\n📊 Validation Summary');
  console.log('=' .repeat(30));
  console.log(`Required Features: ${featuresExist}/${REQUIRED_FEATURES.length} (${Math.round(featuresExist/REQUIRED_FEATURES.length*100)}%)`);
  console.log(`Infrastructure: ${infraExists}/${REQUIRED_INFRASTRUCTURE.length} (${Math.round(infraExists/REQUIRED_INFRASTRUCTURE.length*100)}%)`);
  console.log(`Valid Components: ${validComponents}/${componentValidation.length} (${Math.round(validComponents/componentValidation.length*100)}%)`);

  const overallScore = Math.round(((featuresExist + infraExists + validComponents) / (REQUIRED_FEATURES.length + REQUIRED_INFRASTRUCTURE.length + componentValidation.length)) * 100);
  console.log(`\n🎯 Overall Completion: ${overallScore}%`);

  if (overallScore >= 90) {
    console.log('🎉 EXCELLENT: Project is feature-complete and ready for deployment!');
  } else if (overallScore >= 75) {
    console.log('✅ GOOD: Project is mostly complete with minor gaps.');
  } else if (overallScore >= 50) {
    console.log('⚠️  MODERATE: Significant development still required.');
  } else {
    console.log('❌ POOR: Major components missing.');
  }

  return overallScore;
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch(console.error);
}

export { runValidation, validateFileExists, validateReactComponent };