const { createClient } = require('@supabase/supabase-js')
const { Pool } = require('pg')

// Force IPv4 for better connectivity on some platforms
const dns = require('dns')
try { 
  dns.setDefaultResultOrder('ipv4first') 
} catch (_) {}

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const databaseUrl = process.env.DATABASE_URL

if (!supabaseUrl || !supabaseKey || !databaseUrl) {
  console.error('❌ Missing required environment variables:')
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌')
  console.error('DATABASE_URL:', databaseUrl ? '✅' : '❌')
  process.exit(1)
}

// Supabase client for real-time features and auth
const supabase = createClient(supabaseUrl, supabaseKey)

// Platform-specific connection pool configuration
const getPoolConfig = () => {
  const baseConfig = {
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 10000, // 10 seconds
    query_timeout: 10000,     // 10 seconds
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 5000
  }

  // Platform detection
  if (process.env.VERCEL) {
    // Vercel serverless
    return {
      ...baseConfig,
      max: 1,
      idleTimeoutMillis: 0,
    }
  } else if (process.env.RENDER) {
    // Render - Force IPv4 and increase timeouts
    return {
      ...baseConfig,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 30000,
      host: process.env.DATABASE_HOST || undefined,
      port: process.env.DATABASE_PORT || undefined,
    }
  } else {
    // Default (local development)
    return {
      ...baseConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  }
}

// Initialize the connection pool
const pool = new Pool(getPoolConfig())

// Test database connection
const testConnection = async () => {
  try {
    console.log('🔄 Testing database connection...')
    console.log('🔑 Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'))
    console.log('🌐 Supabase URL:', supabaseUrl)
    
    const client = await pool.connect()
    try {
      const result = await client.query('SELECT NOW()')
      console.log('✅ Database connection successful:', result.rows[0])
      return true
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('❌ Database connection error:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    return false
  }
}

module.exports = {
  supabase,
  pool,
  testConnection
}