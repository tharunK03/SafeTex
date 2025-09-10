// Test PostgreSQL Connection and Operations
// Run this script to test your Supabase PostgreSQL setup

require('dotenv').config()
const { testConnection, initializeDatabase } = require('./src/config/supabase')
const db = require('./src/services/database')

async function testPostgreSQL() {
  console.log('🧪 Testing PostgreSQL Setup...\n')

  try {
    // Test 1: Connection
    console.log('1️⃣ Testing database connection...')
    const isConnected = await testConnection()
    if (!isConnected) {
      console.log('❌ Database connection failed')
      return
    }
    console.log('✅ Database connection successful\n')

    // Test 2: Initialize tables
    console.log('2️⃣ Initializing database tables...')
    await initializeDatabase()
    console.log('✅ Database tables initialized\n')

    // Test 3: Test basic operations
    console.log('3️⃣ Testing basic database operations...')
    
    // Test insert
    const testUser = await db.insert(`
      INSERT INTO users (firebase_uid, email, display_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (firebase_uid) DO NOTHING
      RETURNING *
    `, ['test-uid-123', 'test@example.com', 'Test User', 'admin'])
    
    if (testUser) {
      console.log('✅ Insert operation successful')
      
      // Test select
      const user = await db.getOne(
        'SELECT * FROM users WHERE firebase_uid = $1',
        ['test-uid-123']
      )
      if (user) {
        console.log('✅ Select operation successful')
        
        // Test update
        const updatedUser = await db.update(`
          UPDATE users 
          SET display_name = $1, updated_at = CURRENT_TIMESTAMP
          WHERE firebase_uid = $2
          RETURNING *
        `, ['Updated Test User', 'test-uid-123'])
        
        if (updatedUser) {
          console.log('✅ Update operation successful')
        }
      }
    }

    // Test 4: Test customer operations
    console.log('\n4️⃣ Testing customer operations...')
    
    if (testUser) {
      const testCustomer = await db.insert(`
        INSERT INTO customers (name, contact_person, email, phone, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, ['Test Customer', 'John Doe', 'customer@test.com', '+1234567890', testUser.id])
      
      if (testCustomer) {
        console.log('✅ Customer insert successful')
        
        // Test join query
        const customers = await db.getMany(`
          SELECT 
            c.*,
            u.display_name as created_by_name
          FROM customers c
          LEFT JOIN users u ON c.created_by = u.id
          WHERE c.status = 'active'
        `)
        
        if (customers.length > 0) {
          console.log('✅ Customer join query successful')
          console.log(`📊 Found ${customers.length} customers`)
        }
      }
    }

    console.log('\n🎉 All PostgreSQL tests passed!')
    console.log('\n📋 Next steps:')
    console.log('1. Update your frontend to use the new PostgreSQL endpoints')
    console.log('2. Test the /api/customers-pg endpoints')
    console.log('3. Migrate your existing data from Firestore to PostgreSQL')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Run the test
testPostgreSQL()










