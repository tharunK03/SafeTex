const { getAuth } = require('../config/firebase')

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      })
    }

    const token = authHeader.split('Bearer ')[1]
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token format'
      })
    }

    // Verify the Firebase ID token
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)
    
    // Get user role from database
    const db = require('../services/database')
    const user = await db.getOne(
      'SELECT role FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    )

    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || decodedToken.email,
      picture: decodedToken.picture,
      role: user?.role || 'user' // Get role from database, default to 'user'
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      })
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Token revoked',
        message: 'Your session has been revoked. Please log in again.'
      })
    }
    
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    })
  }
}

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      })
    }

    const userRole = req.user.role
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      })
    }

    next()
  }
}

// Admin only middleware
const requireAdmin = requireRole(['admin'])

// Sales and admin middleware
const requireSales = requireRole(['admin', 'sales'])

// Production and admin middleware
const requireProduction = requireRole(['admin', 'production'])

module.exports = {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireSales,
  requireProduction
} 