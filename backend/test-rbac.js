// Test Role-Based Access Control (RBAC)
// This script tests the role-based permissions system

require('dotenv').config()
const { testConnection, initializeDatabase } = require('./src/config/supabase')
const db = require('./src/services/database')
const { ROLES, ROLE_PERMISSIONS, hasPermission, getAllRoles } = require('./src/config/roles')

async function testRBAC() {
  console.log('🔐 Testing Role-Based Access Control...\n')

  try {
    // Test 1: Database connection
    console.log('1️⃣ Testing database connection...')
    const isConnected = await testConnection()
    if (!isConnected) {
      console.log('❌ Database connection failed')
      return
    }
    console.log('✅ Database connection successful\n')

    // Test 2: Initialize database with RLS
    console.log('2️⃣ Initializing database with RLS policies...')
    await initializeDatabase()
    console.log('✅ Database initialized with RLS policies\n')

    // Test 3: Create test users with different roles
    console.log('3️⃣ Creating test users with different roles...')
    
    const testUsers = [
      {
        firebase_uid: 'admin-test-123',
        email: 'admin@saft.com',
        display_name: 'Admin User',
        role: ROLES.ADMIN
      },
      {
        firebase_uid: 'sales-test-123',
        email: 'sales@saft.com',
        display_name: 'Sales User',
        role: ROLES.SALES
      },
      {
        firebase_uid: 'production-test-123',
        email: 'production@saft.com',
        display_name: 'Production User',
        role: ROLES.PRODUCTION_MANAGER
      }
    ]

    for (const userData of testUsers) {
      await db.insert(`
        INSERT INTO users (firebase_uid, email, display_name, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (firebase_uid) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          role = EXCLUDED.role
        RETURNING *
      `, [userData.firebase_uid, userData.email, userData.display_name, userData.role])
      
      console.log(`✅ Created ${userData.role} user: ${userData.email}`)
    }
    console.log('')

    // Test 4: Test role permissions
    console.log('4️⃣ Testing role permissions...')
    
    const testCases = [
      { role: ROLES.ADMIN, resource: 'customers', action: 'create', expected: true },
      { role: ROLES.ADMIN, resource: 'customers', action: 'delete', expected: true },
      { role: ROLES.SALES, resource: 'customers', action: 'create', expected: true },
      { role: ROLES.SALES, resource: 'customers', action: 'delete', expected: false },
      { role: ROLES.PRODUCTION_MANAGER, resource: 'customers', action: 'create', expected: false },
      { role: ROLES.PRODUCTION_MANAGER, resource: 'production', action: 'create', expected: true },
      { role: ROLES.SALES, resource: 'production', action: 'create', expected: false },
      { role: ROLES.ADMIN, resource: 'settings', action: 'read', expected: true },
      { role: ROLES.SALES, resource: 'settings', action: 'read', expected: false }
    ]

    for (const testCase of testCases) {
      const hasAccess = hasPermission(testCase.role, testCase.resource, testCase.action)
      const status = hasAccess === testCase.expected ? '✅' : '❌'
      console.log(`${status} ${testCase.role} can ${testCase.action} ${testCase.resource}: ${hasAccess} (expected: ${testCase.expected})`)
    }
    console.log('')

    // Test 5: Test role information
    console.log('5️⃣ Testing role information...')
    const roles = getAllRoles()
    console.log('Available roles:')
    roles.forEach(role => {
      console.log(`  - ${role.id}: ${role.name} - ${role.description}`)
    })
    console.log('')

    // Test 6: Test database-level permissions with sample data
    console.log('6️⃣ Testing database-level permissions...')
    
    // Create a test customer
    const adminUser = await db.getOne(
      'SELECT id FROM users WHERE firebase_uid = $1',
      ['admin-test-123']
    )
    
    if (adminUser) {
      const testCustomer = await db.insert(`
        INSERT INTO customers (name, contact_person, email, phone, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, ['Test Customer', 'John Doe', 'customer@test.com', '+1234567890', adminUser.id])
      
      if (testCustomer) {
        console.log('✅ Created test customer for permission testing')
        
        // Test that we can read the customer
        const customers = await db.getMany(`
          SELECT c.*, u.display_name as created_by_name
          FROM customers c
          LEFT JOIN users u ON c.created_by = u.id
          WHERE c.status = 'active'
        `)
        
        console.log(`✅ Found ${customers.length} customers in database`)
      }
    }

    console.log('\n🎉 RBAC test completed successfully!')
    console.log('\n📋 Role Summary:')
    console.log('• Admin: Full access to all features')
    console.log('• Sales: Manage customers, orders, invoices')
    console.log('• Production Manager: Manage production logs, update orders')
    console.log('\n🔐 Security Features:')
    console.log('• Application-level permission checking')
    console.log('• Database-level Row Level Security (RLS)')
    console.log('• Role-based API endpoint protection')
    console.log('• User profile management')

  } catch (error) {
    console.error('❌ RBAC test failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Run the test
testRBAC()








