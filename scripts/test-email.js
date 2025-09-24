#!/usr/bin/env node

/**
 * Email Notification Test Script
 * Tests the Microsoft Graph API email integration
 */

import dotenv from 'dotenv';
import EmailUtils from '../services/email/emailUtils.js';
import { logInfo, logError } from '../services/logger.js';

// Load environment variables
dotenv.config();

async function testEmailNotifications() {
  console.log('🧪 Testing Email Notifications...\n');

  try {
    // Test 1: Configuration Test
    console.log('1️⃣ Testing email configuration...');
    const configTest = await EmailUtils.testEmail();
    console.log('Configuration test result:', configTest);
    
    if (!configTest.success) {
      console.error('❌ Email configuration test failed. Please check your environment variables.');
      return;
    }
    console.log('✅ Email configuration is working\n');

    // Test 2: Admin Notification
    console.log('2️⃣ Testing admin notification...');
    await EmailUtils.notifyAdmin(
      'Email System Test',
      'This is a test notification to verify the email system is working correctly.',
      'info'
    );
    console.log('✅ Admin notification sent\n');

    // Test 3: Data Upload Notification
    console.log('3️⃣ Testing data upload notification...');
    await EmailUtils.notifyDataUpload(
      'Test Data Upload',
      'This is a test data upload notification to verify the system is working.',
      'success'
    );
    console.log('✅ Data upload notification sent\n');

    // Test 4: System Alert
    console.log('4️⃣ Testing system alert...');
    await EmailUtils.alertSystemWarning(
      'Email Test Component',
      'This is a test system warning to verify alert functionality.',
      {
        testType: 'email_integration',
        timestamp: new Date().toISOString()
      }
    );
    console.log('✅ System alert sent\n');

    // Test 5: Data Import Notification
    console.log('5️⃣ Testing data import notification...');
    await EmailUtils.notifyDataImportSuccess(
      'test-data.xlsx',
      100,
      {
        processingTime: '2.5s',
        validRecords: 95,
        errorRecords: 5,
        testMode: true
      }
    );
    console.log('✅ Data import notification sent\n');

    // Test 6: Excel Upload Notification
    console.log('6️⃣ Testing Excel upload notification...');
    await EmailUtils.notifyExcelUpload(
      'sample-data.xlsx',
      250,
      {
        sheets: ['Sales', 'Inventory', 'Products'],
        columns: 15,
        processingTime: '3.2s',
        testMode: true
      }
    );
    console.log('✅ Excel upload notification sent\n');

    // Test 7: Performance Alert
    console.log('7️⃣ Testing performance alert...');
    await EmailUtils.alertPerformance(
      'API Response Time',
      7500,
      5000,
      'ms'
    );
    console.log('✅ Performance alert sent\n');

    // Test 8: User Action Notification
    console.log('8️⃣ Testing user action notification...');
    await EmailUtils.notifyUserAction(
      'Data Export',
      'test-user@example.com',
      {
        exportType: 'Sales Report',
        recordCount: 1000,
        format: 'Excel',
        testMode: true
      }
    );
    console.log('✅ User action notification sent\n');

    // Test 9: Data Quality Alert
    console.log('9️⃣ Testing data quality alert...');
    await EmailUtils.alertDataQuality(
      'Q4_Sales_Data',
      {
        missingValues: 15,
        duplicateRecords: 3,
        invalidDates: 2,
        outliers: 8
      }
    );
    console.log('✅ Data quality alert sent\n');

    // Test 10: Scheduled Report Notification
    console.log('🔟 Testing scheduled report notification...');
    await EmailUtils.notifyScheduledReport(
      'Monthly Financial Summary',
      'success',
      {
        reportPeriod: '2024-01',
        totalRevenue: '$125,000',
        recordCount: 500,
        generatedAt: new Date().toISOString(),
        testMode: true
      }
    );
    console.log('✅ Scheduled report notification sent\n');

    console.log('🎉 All email notification tests completed successfully!');
    console.log('\n📧 Check the following email addresses for test messages:');
    console.log(`   • Admin notifications: ${process.env.ADMIN_EMAIL || 'admin@app.sentiaspirits.com'}`);
    console.log(`   • Data upload notifications: ${process.env.DATA_EMAIL || 'data@app.sentiaspirits.com'}`);

  } catch (error) {
    logError('Email test failed:', error);
    console.error('❌ Email test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testEmailNotifications()
  .then(() => {
    console.log('\n✨ Email notification system is ready for use!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
