const express = require('express')
const dns = require('dns')
// Prefer IPv4 to avoid ENETUNREACH on hosts without IPv6 (e.g., some PaaS egress)
try { dns.setDefaultResultOrder('ipv4first') } catch (_) {}
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')
const dotenv = require('dotenv')

// Configure dotenv (only in development)
if (process.env.NODE_ENV !== 'production') {
  const dotenvResult = dotenv.config()
  if (dotenvResult.error) {
    console.warn('⚠️ No .env file found. Using environment variables.')
  }
}

// In production, we use Render's environment variables directly
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'DATABASE_URL']
const missingEnv = requiredEnv.filter((key) => !process.env[key])
if (missingEnv.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnv.join(', '))
  requiredEnv.forEach((key) => {
    console.error(`${key}:`, process.env[key] ? '✅' : '❌')
  })
  process.exit(1)
}

console.log('✅ Environment variables loaded from:', path.resolve(process.cwd(), '.env'))
console.log('Environment vars:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? '✅' : '❌',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅' : '❌',
  DATABASE_URL: process.env.DATABASE_URL ? '✅' : '❌'
})

// Initialize Supabase
const { testConnection } = require('./config/supabase')

// Debug environment variables
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
  SUPABASE_KEY_SET: !!process.env.SUPABASE_ANON_KEY,
  SUPABASE_URL_LENGTH: process.env.SUPABASE_URL?.length,
  SUPABASE_KEY_LENGTH: process.env.SUPABASE_ANON_KEY?.length,
})

// Import routes
const authRoutes = require('./routes/auth')
const customerRoutes = require('./routes/customers-pg')
const userRoutes = require('./routes/users')
const productRoutes = require('./routes/products')
const orderRoutes = require('./routes/orders')
const productionRoutes = require('./routes/production')
const rawMaterialRoutes = require('./routes/raw-materials')
const invoiceRoutes = require('./routes/invoices')
const reportRoutes = require('./routes/reports')
const statsRoutes = require('./routes/stats')

// Import middleware
const { errorHandler } = require('./middlewares/errorHandler')
const { authMiddleware } = require('./middlewares/auth')

const app = express()
const PORT = process.env.PORT || 5000

// Trust proxy - required for Render deployment
app.set('trust proxy', 1)

// Initialize Supabase Database and start server
const initializeApp = async () => {
  try {
    console.log('🔄 Starting database initialization...')
    
    // Test database connection
    const connected = await testConnection()
    if (!connected) {
      console.error('❌ Database connection failed')
      
      // For Render deployment, try to start the server anyway
      // Database connection will be retried on first request
      if (process.env.RENDER) {
        console.log('⚠️  Starting server in degraded mode - database will be retried on requests')
      } else {
        process.exit(1)
      }
    }

    console.log('✅ Supabase database connection successful')
    console.log('📊 Using Supabase PostgreSQL as the database')

    // Security middleware
    app.use(helmet())

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Increase preflight cache to 10 minutes
}))    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    })
    app.use('/api/', limiter)

    // Logging middleware
    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev'))
    }

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // Static file serving for PDFs
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

    // Serve static files for frontend
    app.use(express.static(path.join(__dirname, '../../frontend/dist')))

    // API routes handler for root path
    app.get('/', (req, res) => {
      res.status(200).json({
        name: 'Saft ERP API',
        version: '1.0.0',
        description: 'Backend API for Saft ERP System',
        docs: '/api-docs',
        health: '/health',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          customers: '/api/customers',
          products: '/api/products',
          orders: '/api/orders',
          production: '/api/production',
          rawMaterials: '/api/raw-materials',
          invoices: '/api/invoices',
          reports: '/api/reports',
          stats: '/api/stats'
        }
      })
    })

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'OK', 
        message: 'Saft ERP API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        render: process.env.RENDER ? 'true' : 'false'
      })
    })

    // API routes
    app.use('/api/auth', authRoutes)
    app.use('/api/users', authMiddleware, userRoutes)
    app.use('/api/customers', authMiddleware, customerRoutes)
    app.use('/api/products', authMiddleware, productRoutes)
    app.use('/api/orders', authMiddleware, orderRoutes)
    app.use('/api/production', authMiddleware, productionRoutes)
    app.use('/api/raw-materials', authMiddleware, rawMaterialRoutes)
    app.use('/api/invoices', authMiddleware, invoiceRoutes)
    app.use('/api/reports', authMiddleware, reportRoutes)
    app.use('/api/stats', authMiddleware, statsRoutes)

    // Handle frontend routes
    app.get('*', (req, res) => {
      if (req.url.startsWith('/api')) {
        return res.status(404).json({ 
          error: 'Route not found',
          message: `Cannot ${req.method} ${req.originalUrl}`
        })
      }
      res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'))
    })

    // Error handling middleware
    app.use(errorHandler)

    // Start server
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      return new Promise((resolve, reject) => {
        const server = app.listen(PORT, '0.0.0.0', () => {
          console.log(`🚀 Saft ERP API server running on port ${PORT}`)
          console.log(`📊 Environment: ${process.env.NODE_ENV}`)
          console.log(`🔗 Health check: http://localhost:${PORT}/health`)
          console.log('📝 Registered routes:')
          console.log('  - POST /api/auth/login')
          app._router.stack.forEach((r) => {
            if (r.route && r.route.path) {
              console.log(`  - ${Object.keys(r.route.methods).join(',')} ${r.route.path}`)
            }
          })
          resolve(server)
        })

        // Handle server errors
        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use`)
            console.error('Please try the following:')
            console.error(`1. Kill any process using port ${PORT}:`)
            console.error(`   $ lsof -i :${PORT}`)
            console.error(`   $ kill -9 <PID>`)
            console.error('2. Or use a different port:')
            console.error('   $ PORT=5001 node src/index.js')
          } else {
            console.error('❌ Server error:', error)
          }
          reject(error)
        })

        // Handle process termination
        process.on('SIGTERM', () => {
          console.log('🛑 SIGTERM received. Shutting down gracefully...')
          server.close(() => {
            console.log('✅ Server closed')
            process.exit(0)
          })
        })

        process.on('SIGINT', () => {
          console.log('🛑 SIGINT received. Shutting down gracefully...')
          server.close(() => {
            console.log('✅ Server closed')
            process.exit(0)
          })
        })
      })
    }

    return app
  } catch (error) {
    console.error('❌ Application initialization failed:', error)
    process.exit(1)
  }
}

// Initialize the application
console.log('🚀 Starting Saft ERP API server...')
initializeApp().then(() => {
  console.log('✅ Server initialization complete')
}).catch(error => {
  console.error('❌ Server initialization failed:', error)
  process.exit(1)
})

// Export for Vercel
module.exports = app