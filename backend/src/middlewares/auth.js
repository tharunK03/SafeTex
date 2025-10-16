import { supabase } from '../config/supabase.js';
import { verifyDemoToken, DEMO_USERS } from '../../demo-auth-bypass.js';

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

    // Check if it's a demo token first
    console.log('Token in auth middleware:', token)
    const demoUser = verifyDemoToken(token)
    console.log('Demo user:', demoUser)
    if (demoUser) {
      const demoUserId = `demo-${demoUser.email}`
      req.user = {
        id: demoUserId,
        uid: demoUserId, // For compatibility
        email: demoUser.email,
        emailVerified: true,
        name: demoUser.user_metadata?.full_name || demoUser.email,
        picture: null,
        role: demoUser.user_metadata?.role || 'user'
      }
      return next()
    }

    // Verify the Supabase JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      })
    }

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, display_name')
      .eq('id', user.id)
      .single()

    // Add user info to request object
    req.user = {
      id: user.id,
      uid: user.id, // For compatibility
      email: user.email,
      emailVerified: user.email_confirmed_at ? true : false,
      name: userData?.display_name || user.user_metadata?.full_name || user.email,
      picture: user.user_metadata?.avatar_url,
      role: userData?.role || 'user' // Get role from database, default to 'user'
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    
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

export {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireSales,
  requireProduction
};