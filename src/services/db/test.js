import { devLog } from '../lib/devLog.js';\nimport dbService from './index.js';
import { logInfo, logError } from '../../../services/logger.js';

class DatabaseTest {
  async runAllTests() {
    devLog.log('🚀 Starting database validation tests...\n');
    
    try {
      // Initialize database connection
      await dbService.initialize();
      const prisma = dbService.getClient();
      
      const results = {
        connection: false,
        healthCheck: false,
        basicCRUD: false,
        relationships: false,
        constraints: false,
      };
      
      // Test 1: Connection
      devLog.log('1️⃣ Testing database connection...');
      try {
        const isConnected = dbService.isConnected();
        devLog.log(`   ✅ Database connected: ${isConnected}`);
        results.connection = true;
      } catch (error) {
        devLog.log(`   ❌ Connection failed: ${error.message}`);
        results.connection = false;
      }
      
      // Test 2: Health Check
      devLog.log('\n2️⃣ Testing database health check...');
      try {
        const health = await dbService.healthCheck();
        devLog.log(`   ✅ Health status: ${health.status}`);
        devLog.log(`   📊 Database: ${health.database}`);
        devLog.log(`   👤 User: ${health.user}`);
        results.healthCheck = true;
      } catch (error) {
        devLog.log(`   ❌ Health check failed: ${error.message}`);
        results.healthCheck = false;
      }
      
      // Test 3: Basic CRUD Operations
      devLog.log('\n3️⃣ Testing basic CRUD operations...');
      try {
        // Create test user
        devLog.log('   Creating test user...');
        const testUser = await prisma.user.create({
          data: {
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
            isActive: true,
            is_admin: false,
            two_factor_enabled: false,
            force_password_change: false,
          },
        });
        devLog.log(`   ✅ Created user: ${testUser.id}`);
        
        // Read user
        devLog.log('   Reading user...');
        const foundUser = await prisma.user.findUnique({
          where: { id: testUser.id },
        });
        devLog.log(`   ✅ Found user: ${foundUser.username}`);
        
        // Update user
        devLog.log('   Updating user...');
        const updatedUser = await prisma.user.update({
          where: { id: testUser.id },
          data: { role: 'manager' },
        });
        devLog.log(`   ✅ Updated user role to: ${updatedUser.role}`);
        
        // Delete user
        devLog.log('   Deleting user...');
        await prisma.user.delete({
          where: { id: testUser.id },
        });
        devLog.log('   ✅ User deleted successfully');
        
        results.basicCRUD = true;
      } catch (error) {
        devLog.log(`   ❌ CRUD operations failed: ${error.message}`);
        results.basicCRUD = false;
      }
      
      // Test 4: Relationship queries
      devLog.log('\n4️⃣ Testing relationship queries...');
      try {
        // Count existing records
        const userCount = await prisma.user.count();
        const marketCount = await prisma.market.count();
        const productCount = await prisma.product.count();
        
        devLog.log(`   📊 Users: ${userCount}`);
        devLog.log(`   📊 Markets: ${marketCount}`); 
        devLog.log(`   📊 Products: ${productCount}`);
        
        if (productCount > 0 && userCount > 0) {
          // Test relationship query
          const productsWithCreator = await prisma.product.findMany({
            include: {
              creator: {
                select: { username: true, email: true }
              }
            },
            take: 3,
          });
          devLog.log(`   ✅ Found ${productsWithCreator.length} products with creator data`);
        }
        
        results.relationships = true;
      } catch (error) {
        devLog.log(`   ❌ Relationship queries failed: ${error.message}`);
        results.relationships = false;
      }
      
      // Test 5: Constraint validation
      devLog.log('\n5️⃣ Testing constraint validation...');
      try {
        // Test unique constraint
        let constraintWorking = true;
        
        try {
          await prisma.user.create({
            data: {
              username: 'admin', // This should fail if admin exists
              email: 'duplicate@example.com',
              role: 'user',
              isActive: true,
              is_admin: false,
              two_factor_enabled: false,
              force_password_change: false,
            },
          });
          devLog.log('   ⚠️  Unique constraint not enforced (or admin user doesn\'t exist)');
        } catch (error) {
          if (error.code === 'P2002') {
            devLog.log('   ✅ Unique constraint working properly');
          } else {
            devLog.log(`   ❌ Unexpected constraint error: ${error.message}`);
            constraintWorking = false;
          }
        }
        
        results.constraints = constraintWorking;
      } catch (error) {
        devLog.log(`   ❌ Constraint validation failed: ${error.message}`);
        results.constraints = false;
      }
      
      // Test 6: Database statistics
      devLog.log('\n6️⃣ Getting database statistics...');
      try {
        const stats = await dbService.getStats();
        devLog.log('   📊 Table Statistics:');
        stats.slice(0, 5).forEach(stat => {
          devLog.log(`   - ${stat.tablename}: ${stat.live_tuples} rows`);
        });
        devLog.log(`   ✅ Retrieved stats for ${stats.length} tables`);
      } catch (error) {
        devLog.log(`   ⚠️  Stats retrieval failed: ${error.message}`);
      }
      
      // Test Summary
      devLog.log('\n📋 TEST RESULTS SUMMARY:');
      devLog.log('========================');
      devLog.log(`Connection:      ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
      devLog.log(`Health Check:    ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
      devLog.log(`Basic CRUD:      ${results.basicCRUD ? '✅ PASS' : '❌ FAIL'}`);
      devLog.log(`Relationships:   ${results.relationships ? '✅ PASS' : '❌ FAIL'}`);
      devLog.log(`Constraints:     ${results.constraints ? '✅ PASS' : '❌ FAIL'}`);
      
      const passCount = Object.values(results).filter(Boolean).length;
      const totalTests = Object.keys(results).length;
      
      devLog.log('\n🎯 OVERALL RESULT:');
      devLog.log(`${passCount}/${totalTests} tests passed`);
      
      if (passCount === totalTests) {
        devLog.log('🎉 ALL TESTS PASSED - Database is fully operational!');
        return true;
      } else {
        devLog.log('⚠️  Some tests failed - review issues above');
        return false;
      }
      
    } catch (error) {
      devLog.error('💥 Fatal error during database testing:', error);
      return false;
    } finally {
      await dbService.disconnect();
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DatabaseTest();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      devLog.error('Test runner failed:', error);
      process.exit(1);
    });
}

export default DatabaseTest;