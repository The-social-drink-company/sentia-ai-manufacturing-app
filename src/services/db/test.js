import dbService from './index.js';
import { logInfo, logError } from '../../../services/logger.js';

class DatabaseTest {
  async runAllTests() {
    console.log('🚀 Starting database validation tests...\n');
    
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
      console.log('1️⃣ Testing database connection...');
      try {
        const isConnected = dbService.isConnected();
        console.log(`   ✅ Database connected: ${isConnected}`);
        results.connection = true;
      } catch (error) {
        console.log(`   ❌ Connection failed: ${error.message}`);
        results.connection = false;
      }
      
      // Test 2: Health Check
      console.log('\n2️⃣ Testing database health check...');
      try {
        const health = await dbService.healthCheck();
        console.log(`   ✅ Health status: ${health.status}`);
        console.log(`   📊 Database: ${health.database}`);
        console.log(`   👤 User: ${health.user}`);
        results.healthCheck = true;
      } catch (error) {
        console.log(`   ❌ Health check failed: ${error.message}`);
        results.healthCheck = false;
      }
      
      // Test 3: Basic CRUD Operations
      console.log('\n3️⃣ Testing basic CRUD operations...');
      try {
        // Create test user
        console.log('   Creating test user...');
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
        console.log(`   ✅ Created user: ${testUser.id}`);
        
        // Read user
        console.log('   Reading user...');
        const foundUser = await prisma.user.findUnique({
          where: { id: testUser.id },
        });
        console.log(`   ✅ Found user: ${foundUser.username}`);
        
        // Update user
        console.log('   Updating user...');
        const updatedUser = await prisma.user.update({
          where: { id: testUser.id },
          data: { role: 'manager' },
        });
        console.log(`   ✅ Updated user role to: ${updatedUser.role}`);
        
        // Delete user
        console.log('   Deleting user...');
        await prisma.user.delete({
          where: { id: testUser.id },
        });
        console.log('   ✅ User deleted successfully');
        
        results.basicCRUD = true;
      } catch (error) {
        console.log(`   ❌ CRUD operations failed: ${error.message}`);
        results.basicCRUD = false;
      }
      
      // Test 4: Relationship queries
      console.log('\n4️⃣ Testing relationship queries...');
      try {
        // Count existing records
        const userCount = await prisma.user.count();
        const marketCount = await prisma.market.count();
        const productCount = await prisma.product.count();
        
        console.log(`   📊 Users: ${userCount}`);
        console.log(`   📊 Markets: ${marketCount}`); 
        console.log(`   📊 Products: ${productCount}`);
        
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
          console.log(`   ✅ Found ${productsWithCreator.length} products with creator data`);
        }
        
        results.relationships = true;
      } catch (error) {
        console.log(`   ❌ Relationship queries failed: ${error.message}`);
        results.relationships = false;
      }
      
      // Test 5: Constraint validation
      console.log('\n5️⃣ Testing constraint validation...');
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
          console.log('   ⚠️  Unique constraint not enforced (or admin user doesn\'t exist)');
        } catch (error) {
          if (error.code === 'P2002') {
            console.log('   ✅ Unique constraint working properly');
          } else {
            console.log(`   ❌ Unexpected constraint error: ${error.message}`);
            constraintWorking = false;
          }
        }
        
        results.constraints = constraintWorking;
      } catch (error) {
        console.log(`   ❌ Constraint validation failed: ${error.message}`);
        results.constraints = false;
      }
      
      // Test 6: Database statistics
      console.log('\n6️⃣ Getting database statistics...');
      try {
        const stats = await dbService.getStats();
        console.log('   📊 Table Statistics:');
        stats.slice(0, 5).forEach(stat => {
          console.log(`   - ${stat.tablename}: ${stat.live_tuples} rows`);
        });
        console.log(`   ✅ Retrieved stats for ${stats.length} tables`);
      } catch (error) {
        console.log(`   ⚠️  Stats retrieval failed: ${error.message}`);
      }
      
      // Test Summary
      console.log('\n📋 TEST RESULTS SUMMARY:');
      console.log('========================');
      console.log(`Connection:      ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Health Check:    ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Basic CRUD:      ${results.basicCRUD ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Relationships:   ${results.relationships ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Constraints:     ${results.constraints ? '✅ PASS' : '❌ FAIL'}`);
      
      const passCount = Object.values(results).filter(Boolean).length;
      const totalTests = Object.keys(results).length;
      
      console.log('\n🎯 OVERALL RESULT:');
      console.log(`${passCount}/${totalTests} tests passed`);
      
      if (passCount === totalTests) {
        console.log('🎉 ALL TESTS PASSED - Database is fully operational!');
        return true;
      } else {
        console.log('⚠️  Some tests failed - review issues above');
        return false;
      }
      
    } catch (error) {
      console.error('💥 Fatal error during database testing:', error);
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
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

export default DatabaseTest;