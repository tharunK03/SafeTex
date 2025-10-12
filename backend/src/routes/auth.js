const express = require('express')
const { body, validationResult } = require('express-validator')
const { supabase } = require('../config/supabase')
const { requireAdmin } = require('../middlewares/auth')
const { createDemoToken, DEMO_USERS } = require('../../demo-auth-bypass')

const router = express.Router()

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

// @route   POST /api/auth/register
// @desc    Create new user (admin only)
// @access  Private (Admin)
router.post('/register', 
  requireAdmin,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'sales', 'production']).withMessage('Invalid role')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array()[0].msg
        })
      }

      const { email, password, role, name } = req.body

      // Create user in Firebase Auth
      const auth = getAuth()
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: false
      })

      // Set custom claims for role
      await auth.setCustomUserClaims(userRecord.uid, { role })

      // Create user document in Firestore
      const db = require('../config/firebase').getFirestore()
      await db.collection('users').doc(userRecord.uid).set({
        email,
        name: name || email,
        role,
        createdAt: new Date(),
        createdBy: req.user.uid
      })

      res.status(201).json({
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName,
          role
        }
      })
    } catch (error) {
      console.error('Registration error:', error)
      
      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      })
    }
  }
)

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

module.exports = router 