const { createClient } = require('@supabase/supabase-js')
const { Pool } = require('pg')

// Force IPv4 for better connectivity on some platforms
const dns = require('dns')
try { 
  dns.setDefaultResultOrder('ipv4first') 
} catch (_) {}

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL?.trim()
const supabaseKey = process.env.SUPABASE_ANON_KEY?.trim()
const databaseUrl = process.env.DATABASE_URL?.trim()

console.log('🔄 Checking Supabase configuration...')
console.log('Environment:', process.env.NODE_ENV)

// Validate URL format
let isValidUrl = false
try {
  new URL(supabaseUrl)
  isValidUrl = true
} catch (e) {
  console.error('❌ Invalid Supabase URL format')
}

// Validate API key format (should be a JWT-like string)
const isValidKey = typeof supabaseKey === 'string' && 
                  supabaseKey.split('.').length === 3 && 
                  supabaseKey.length > 50

console.log('Validation results:', {
  SUPABASE_URL: {
    present: !!supabaseUrl,
    length: supabaseUrl?.length,
    validFormat: isValidUrl,
    value: supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : undefined
  },
  SUPABASE_KEY: {
    present: !!supabaseKey,
    length: supabaseKey?.length,
    validFormat: isValidKey,
    preview: supabaseKey ? `${supabaseKey.substring(0, 5)}...${supabaseKey.substring(supabaseKey.length - 5)}` : undefined
  },
  DATABASE_URL: {
    present: !!databaseUrl,
    length: databaseUrl?.length
  }
})

if (!isValidUrl || !isValidKey || !databaseUrl) {
  console.error('❌ Invalid configuration:')
  if (!isValidUrl) console.error('- Supabase URL is not a valid URL')
  if (!isValidKey) console.error('- Supabase key is not in correct format')
  if (!databaseUrl) console.error('- Database URL is missing')
  
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️ Production environment detected. Service may not work correctly!')
  } else {
    process.exit(1)
  }
}

// Supabase client for real-time features and auth
console.log('🔄 Initializing Supabase client...')

// Create Supabase client with error handling
let supabase
try {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  })
  
  // Test the connection
  ;(async () => {
    try {
      const { data, error } = await supabase.from('products').select('id').limit(1)
      if (error) throw error
      console.log('✅ Supabase connection test successful')
    } catch (error) {
      console.error('❌ Supabase connection test failed:', {
        message: error.message,
        hint: error.hint,
        details: error.details
      })
    }
  })()
  
  console.log('✅ Supabase client initialized')
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', {
    message: error.message,
    name: error.name,
    stack: error.stack
  })
  throw error
}

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

// Export supabase client for use in other files
module.exports = { supabase, pool }

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