import 'dotenv/config';

// Log environment variable loading
console.log('📝 Loading environment variables from .env file...')
console.log('✅ Environment variables loaded successfully')
console.log('ENV variables:', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL?.substring(0, 20) + '...'
})

import express from 'express';
import dns from 'dns';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import os from 'os';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { supabase } from './config/supabase.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Prefer IPv4 to avoid ENETUNREACH on hosts without IPv6
try { dns.setDefaultResultOrder('ipv4first') } catch (_) {}

// Remove redundant dotenv configuration since we already loaded it

// Validate required environment variables
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
const missingEnv = requiredEnv.filter((key) => !process.env[key])
if (missingEnv.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnv.join(', '))
  requiredEnv.forEach((key) => {
    console.error(`${key}:`, process.env[key] ? '✅' : '❌')
  })
  // Do not exit in production on partial config; rely on healthcheck to surface issues
}

// Initialize express app
const app = express()
const PORT = process.env.PORT || 5000

// Trust proxy for Render deployment
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow PDF downloads
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL],
      frameSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      manifestSrc: ["'self'"]
    }
  }
}))

// CORS configuration (explicit headers for proxies)
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Content-Disposition'],
  credentials: true,
  maxAge: 600
}))
app.use((req, res, next) => {
  if (corsOrigin === true) {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range, Content-Disposition')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Structured logging
const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms', {
  skip: () => process.env.NODE_ENV === 'test'
})
app.use(requestLogger)
app.use((req, res, next) => {
  res.on('finish', () => {
    const log = {
      level: 'info',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      host: os.hostname()
    }
    if (res.statusCode >= 500) {
      console.error(JSON.stringify(log))
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify(log))
    } else {
      console.log(JSON.stringify(log))
    }
  })
  next()
})

// Ensure uploads directory exists (configurable)
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)){
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Static file serving
app.use('/uploads', express.static(uploadsDir))
app.use(express.static(path.join(__dirname, '../../frontend/dist')))

// Ensure runtime permissions for tmp directories (Render/containers)
try {
  fs.mkdirSync('/tmp/puppeteer_user_data', { recursive: true, mode: 0o755 })
} catch {}

// Health check endpoint with detailed diagnostics
app.get('/health', async (req, res) => {
  const health = {
    timestamp: new Date(),
    status: 'investigating',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    supabase: {
      status: 'checking',
      url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 8)}...` : 'not_set',
      keyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
      connection: 'checking'
    },
    render: {
      isRender: !!process.env.RENDER,
      region: process.env.RENDER_REGION || 'unknown'
    }
  }

  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (error) {
      health.supabase.status = 'error'
      health.supabase.error = {
        message: error.message,
        hint: error.hint,
        code: error.code
      }
      health.status = 'degraded'
    } else {
      health.supabase.status = 'connected'
      health.supabase.connection = 'successful'
      health.status = 'healthy'
    }
  } catch (error) {
    health.supabase.status = 'error'
    health.supabase.error = {
      message: error.message,
      type: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
    health.status = 'critical'
  }

  // Send appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 :
                    503

  res.status(statusCode).json(health)
})

// Import routes
// Import routes
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers-pg.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import productionRoutes from './routes/production.js';
import rawMaterialRoutes from './routes/raw-materials.js';
import invoiceRoutes from './routes/invoices.js';
import reportRoutes from './routes/reports.js';
import statsRoutes from './routes/stats.js';

// Import middlewares
import { errorHandler } from './middlewares/errorHandler.js';
import { authMiddleware } from './middlewares/auth.js';

// API routes
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
      customers: '/api/customers-pg',
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

app.use('/api/auth', authRoutes)
app.use('/api/users', authMiddleware, userRoutes)
app.use('/api/customers-pg', authMiddleware, customerRoutes)
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
async function startServer() {
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    console.log(`🔄 Starting server on port ${PORT}...`)
    console.log('🔍 Debug: Server initialization started')
    
    // Add request logging middleware
    app.use((req, res, next) => {
      console.log(`📥 ${req.method} ${req.url}`)
      next()
    })

    return new Promise((resolve, reject) => {
      const server = app.listen(PORT, '0.0.0.0', (error) => {
    if (error) {
      console.error('❌ Failed to start server:', error)
      process.exit(1)
    }
    console.log(`🚀 Saft ERP API server running on port ${PORT}`)
    console.log(`📊 Environment: ${process.env.NODE_ENV}`)
    console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`)
    console.log(`🌐 Listening on 0.0.0.0:${PORT}`)
  })

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`)
      process.exit(1)
    }
    console.error('❌ Server error:', error)
    process.exit(1)
  })

  // Handle graceful shutdown
    process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Shutting down gracefully...')
    server.close(() => {
      console.log('✅ Server closed')
      process.exit(0)
    })
  })
  resolve(server);
});
  }
}

startServer()
  .then(() => console.log('✅ Server started successfully'))
  .catch(error => {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  });

export default app;