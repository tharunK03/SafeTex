const express = require('express')
const dns = require('dns')
// Prefer IPv4 to avoid ENETUNREACH on hosts without IPv6 (e.g., some PaaS egress)
try { dns.setDefaultResultOrder('ipv4first') } catch (_) {}
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')
require('dotenv').config()

// Initialize Supabase
const { testConnection, initializeDatabase } = require('./config/supabase')

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

// Initialize Supabase Database
const initializeApp = async () => {
  try {
    // Test database connection
    const connected = await testConnection()
    if (!connected) {
      console.error('❌ Database connection failed')
      
      // For Render deployment, try to start the server anyway
      // Database connection will be retried on first request
      if (process.env.RENDER) {
        console.log('⚠️  Starting server in degraded mode - database will be retried on requests')
        return
      } else {
        process.exit(1)
      }
    }

    // Initialize database tables
    await initializeDatabase()
    console.log('✅ Supabase database initialized successfully')
    console.log('📊 Using Supabase PostgreSQL as the database')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    
    // For Render deployment, try to start the server anyway
    if (process.env.RENDER) {
      console.log('⚠️  Starting server in degraded mode - database will be retried on requests')
      return
    } else {
      process.exit(1)
    }
  }
}

// Initialize the application
initializeApp()

// Security middleware
app.use(helmet())

// CORS configuration
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'https://safetexenterprises.vercel.app',
    'http://192.168.29.77:3000',
    'http://localhost:3000'
  ],
  credentials: true
}))

// Rate limiting
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Saft ERP API is running',
    timestamp: new Date().toISOString()
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  })
})

// Error handling middleware
app.use(errorHandler)

// Start server only if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Saft ERP API server running on port ${PORT}`)
    console.log(`📊 Environment: ${process.env.NODE_ENV}`)
    console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  })
}

// Export for Vercel
module.exports = app 