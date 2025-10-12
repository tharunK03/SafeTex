#!/usr/bin/env node

// Test database connection script
// Run this to verify your database connection before deploying

require('dotenv').config()
const { testConnection, pool } = require('./src/config/supabase')

const testDatabaseConnection = async () => {
  console.log('🔍 Testing Database Connection...')
  console.log('================================')
  
  // Check environment variables
  console.log('📋 Environment Variables:')
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('')
  
  // Test connection
  const isConnected = await testConnection()
  
  if (isConnected) {
    console.log('🎉 Database connection test PASSED!')
    console.log('✅ Your database is ready for deployment')
  } else {
    console.log('❌ Database connection test FAILED!')
    console.log('🔧 Please check your environment variables and database settings')
    process.exit(1)
  }
  
  // Test a simple query
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT version()')
    console.log('📊 PostgreSQL Version:', result.rows[0].version.split(' ')[0])
    client.release()
  } catch (error) {
    console.error('❌ Query test failed:', error.message)
  }
  
  // Close the pool
  await pool.end()
  console.log('🔌 Database connection closed')
}

testDatabaseConnection().catch(console.error)

