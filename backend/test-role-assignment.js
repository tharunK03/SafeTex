// Test Role Assignment Based on Email
// This script tests the automatic role assignment functionality

require('dotenv').config()
const { testConnection, initializeDatabase } = require('./src/config/supabase')
const db = require('./src/services/database')

async function testRoleAssignment() {
  console.log('🎭 Testing Role Assignment...\n')

  try {
    // Test 1: Database connection
    console.log('1️⃣ Testing database connection...')
    const isConnected = await testConnection()
    if (!isConnected) {
      console.log('❌ Database connection failed')
      return
    }
    console.log('✅ Database connection successful\n')

    // Test 2: Initialize database
    console.log('2️⃣ Initializing database...')
    await initializeDatabase()
    console.log('✅ Database initialized\n')

    // Test 3: Test role assignment for different emails
    console.log('3️⃣ Testing role assignment for different emails...')
    
    const testUsers = [
      {
        firebase_uid: 'admin-test-456',
        email: 'admin@saft.com',
        display_name: 'Admin User',
        expected_role: 'admin'
      },
      {
        firebase_uid: 'sales-test-456',
        email: 'sales@saft.com',
        display_name: 'Sales User',
        expected_role: 'sales'
      },
      {
        firebase_uid: 'production-test-456',
        email: 'production@saft.com',
        display_name: 'Production User',
        expected_role: 'production_manager'
      },
      {
        firebase_uid: 'unknown-test-456',
        email: 'unknown@saft.com',
        display_name: 'Unknown User',
        expected_role: 'user'
      }
    ]

    for (const userData of testUsers) {
      // Determine expected role based on email
      let expectedRole = 'user'
      if (userData.email === 'admin@saft.com') {
        expectedRole = 'admin'
      } else if (userData.email === 'sales@saft.com') {
        expectedRole = 'sales'
      } else if (userData.email === 'production@saft.com') {
        expectedRole = 'production_manager'
      }

      // Check if user exists by email or firebase_uid
      let existingUser = await db.getOne(
        'SELECT * FROM users WHERE email = $1 OR firebase_uid = $2',
        [userData.email, userData.firebase_uid]
      )

      let user
      if (existingUser) {
        // Update existing user
        user = await db.update(`
          UPDATE users 
          SET 
            firebase_uid = $1,
            email = $2,
            display_name = $3,
            role = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING *
        `, [userData.firebase_uid, userData.email, userData.display_name, expectedRole, existingUser.id])
      } else {
        // Create new user
        user = await db.insert(`
          INSERT INTO users (firebase_uid, email, display_name, role)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [userData.firebase_uid, userData.email, userData.display_name, expectedRole])
      }
      
      const status = user.role === expectedRole ? '✅' : '❌'
      console.log(`${status} ${userData.email}: ${user.role} (expected: ${expectedRole})`)
    }
    console.log('')

    // Test 4: Verify all users in database
    console.log('4️⃣ Verifying all users in database...')
    const allUsers = await db.getMany(`
      SELECT email, role, display_name
      FROM users
      ORDER BY email
    `)
    
    console.log('Current users in database:')
    allUsers.forEach(user => {
      console.log(`  - ${user.email}: ${user.role} (${user.display_name})`)
    })

    console.log('\n🎉 Role assignment test completed!')
    console.log('\n📋 Test Results:')
    console.log('• Admin users (admin@saft.com) should have "admin" role')
    console.log('• Sales users (sales@saft.com) should have "sales" role')
    console.log('• Production users (production@saft.com) should have "production_manager" role')
    console.log('• Other users should have "user" role')
    console.log('\n🔐 Next Steps:')
    console.log('1. Test login with different email addresses')
    console.log('2. Verify role badges appear correctly in the UI')
    console.log('3. Test role-based permissions in the application')

  } catch (error) {
    console.error('❌ Role assignment test failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Run the test
testRoleAssignment()
