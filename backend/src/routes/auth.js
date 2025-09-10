const express = require('express')
const { body, validationResult } = require('express-validator')
const { getAuth } = require('../config/firebase')
const { requireAdmin } = require('../middlewares/auth')

const router = express.Router()

// @route   POST /api/auth/login
// @desc    Verify Firebase token and return user info
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required'
      })
    }

    // Verify the Firebase ID token
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(idToken)

    // Get user data from Firestore (you can add additional user data here)
    const userData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || decodedToken.email,
      picture: decodedToken.picture,
      role: decodedToken.role || 'user'
    }

    res.json({
      success: true,
      data: userData
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(401).json({
      success: false,
      error: 'Invalid token'
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