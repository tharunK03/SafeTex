import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { requireAdmin } from '../middlewares/auth.js';
import { createDemoToken, DEMO_USERS } from '../../demo-auth-bypass.js';

const router = express.Router()

// Handle OPTIONS requests for CORS pre-flight
router.options('/login', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.status(200).end()
})

// @route   POST /api/auth/login
// @desc    Login with email and password
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    console.log('🔐 Login attempt:', { email, hasPassword: !!password })
    console.log('🔍 DEMO_USERS available:', Object.keys(DEMO_USERS || {}))

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
    }

    // Check if it's a demo user
    if (DEMO_USERS && DEMO_USERS[email] && DEMO_USERS[email].password === password) {
      console.log('✅ Demo user login detected:', email)
      const demoToken = await createDemoToken(email)
      return res.json({
        success: true,
        data: {
          token: demoToken,
          user: {
            id: `demo-${email}`,
            email: email,
            name: DEMO_USERS[email].name,
            role: DEMO_USERS[email].role,
            emailVerified: true
          }
        }
      })
    }

    // Try Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      })
    }

    res.json({
      success: true,
      data: {
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email,
          role: data.user.user_metadata?.role || 'user',
          emailVerified: data.user.email_confirmed_at ? true : false
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    })
  }
})

// Registration is managed via Supabase; route removed to avoid Firebase dependency

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // This route should be protected by authMiddleware
    // req.user will be set by the middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    res.json({
      success: true,
      data: req.user
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    })
  }
})

export default router;