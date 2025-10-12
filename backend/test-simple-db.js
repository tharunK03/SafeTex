require('dotenv').config()
const { Pool } = require('pg')

// Platform-specific connection pool configuration
const getPoolConfig = () => {
  const baseConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 10000,
    query_timeout: 10000,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 5000
  }

  if (process.env.RENDER) {
    // Render - Force IPv4 and increase timeouts
    return {
      ...baseConfig,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 30000,
      host: process.env.DATABASE_HOST || undefined,
      port: process.env.DATABASE_PORT || undefined,
    }
  }
  
  // Default configuration
  return {
    ...baseConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}

async function testConnection() {
  const pool = new Pool(getPoolConfig())
  try {
    console.log('🔄 Testing database connection...')
    console.log('🔑 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
    
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    console.log('✅ Database connection successful:', result.rows[0])
    client.release()
  } catch (error) {
    console.error('❌ Database connection error:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
  } finally {
    await pool.end().catch(err => console.error('Pool end error:', err))
  }
}

testConnection();