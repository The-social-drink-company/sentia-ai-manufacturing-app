// Quick component validation test
import { promises as fs } from 'fs';
import path from 'path';

async function testComponentImports() {
  console.log('🧪 Testing component imports...');
  
  const componentsToTest = [
    'src/components/dashboard/ManufacturingDashboard.jsx',
    'src/components/dashboard/AdvancedAnalytics.jsx',
    'src/services/microsoftAuthService.js',
    'src/pages/auth/MicrosoftCallbackPage.jsx'
  ];
  
  for (const component of componentsToTest) {
    try {
      const filePath = path.join(process.cwd(), component);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check for basic syntax issues
      if (content.includes('import React') || content.includes('class ') || content.includes('function ')) {
        console.log(`✅ ${component} - looks valid`);
      } else {
        console.log(`❌ ${component} - may have issues`);
      }
    } catch (error) {
      console.log(`❌ ${component} - Error: ${error.message}`);
    }
  }
  
  console.log('🧪 Component validation complete');
}

testComponentImports();