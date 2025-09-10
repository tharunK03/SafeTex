const express = require('express')
const { body, validationResult } = require('express-validator')
const db = require('../services/database')
const { requirePermission, requireRole, ROLES, getAllRoles } = require('../config/roles')

const router = express.Router()

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', requireRole([ROLES.ADMIN]), async (req, res) => {
  try {
    const users = await db.getMany(`
      SELECT 
        id,
        firebase_uid,
        email,
        display_name,
        role,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `)

    res.json({
      success: true,
      data: users,
      count: users.length
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    })
  }
})

// @route   GET /api/users/me
// @desc    Get current user profile (create if doesn't exist)
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const firebase_uid = req.user.uid
    const firebase_email = req.user.email
    const firebase_display_name = req.user.name

    // Try to get existing user
    let user = await db.getOne(`
      SELECT 
        id,
        firebase_uid,
        email,
        display_name,
        role,
        created_at,
        updated_at
      FROM users
      WHERE firebase_uid = $1
    `, [firebase_uid])

    // If user doesn't exist, check if there's a user with the same email
    if (!user) {
      console.log(`User not found with firebase_uid: ${firebase_uid}`)
      
      // Check if there's an existing user with the same email
      const existingUserByEmail = await db.getOne(
        'SELECT * FROM users WHERE email = $1',
        [firebase_email]
      )
      
      if (existingUserByEmail) {
        // Update the existing user with the new firebase_uid
        console.log(`Found existing user with email ${firebase_email}, updating firebase_uid`)
        user = await db.update(`
          UPDATE users 
          SET firebase_uid = $1, updated_at = CURRENT_TIMESTAMP
          WHERE email = $2
          RETURNING *
        `, [firebase_uid, firebase_email])
        
        console.log(`Updated existing user with role: ${user.role}`)
      } else {
        // Create new user with role based on email
        console.log(`Creating new user: ${firebase_email} with firebase_uid: ${firebase_uid}`)
        
        // Determine default role based on email (for testing purposes)
        let defaultRole = 'user'
        if (firebase_email === 'admin@saft.com') {
          defaultRole = 'admin'
        } else if (firebase_email === 'sales@saft.com') {
          defaultRole = 'sales'
        } else if (firebase_email === 'production@saft.com') {
          defaultRole = 'production_manager'
        }

        user = await db.insert(`
          INSERT INTO users (firebase_uid, email, display_name, role)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [firebase_uid, firebase_email, firebase_display_name, defaultRole])

        console.log(`Created new user with role: ${defaultRole}`)
      }
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error fetching/creating user profile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    })
  }
})

// @route   POST /api/users
// @desc    Create new user (admin only)
// @access  Private (Admin)
router.post('/', requireRole([ROLES.ADMIN]), [
  body('firebase_uid').notEmpty().withMessage('Firebase UID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('display_name').optional().isLength({ min: 2 }).withMessage('Display name must be at least 2 characters'),
  body('role').isIn(['admin', 'sales', 'production_manager']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { firebase_uid, email, display_name, role } = req.body

    // Check if user already exists
    const existingUser = await db.getOne(
      'SELECT id FROM users WHERE firebase_uid = $1 OR email = $2',
      [firebase_uid, email]
    )

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this Firebase UID or email'
      })
    }

    // Create new user
    const newUser = await db.insert(`
      INSERT INTO users (firebase_uid, email, display_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [firebase_uid, email, display_name, role])

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    })
  } catch (error) {
    console.error('Error creating user:', error)
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'User with this email or Firebase UID already exists'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    })
  }
})

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private (Admin)
router.put('/:id', requireRole([ROLES.ADMIN]), [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('display_name').optional().isLength({ min: 2 }).withMessage('Display name must be at least 2 characters'),
  body('role').optional().isIn(['admin', 'sales', 'production_manager']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const { id } = req.params
    const { email, display_name, role } = req.body

    // Check if user exists
    const existingUser = await db.getOne(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Update user
    const updatedUser = await db.update(`
      UPDATE users 
      SET 
        email = COALESCE($1, email),
        display_name = COALESCE($2, display_name),
        role = COALESCE($3, role),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [email, display_name, role, id])

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    })
  }
})

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', [
  body('display_name').optional().isLength({ min: 2 }).withMessage('Display name must be at least 2 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      })
    }

    const firebase_uid = req.user.uid
    const { display_name } = req.body

    // Update user profile
    const updatedUser = await db.update(`
      UPDATE users 
      SET 
        display_name = COALESCE($1, display_name),
        updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid = $2
      RETURNING *
    `, [display_name, firebase_uid])

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      })
    }

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    })
  }
})

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/:id', requireRole([ROLES.ADMIN]), async (req, res) => {
  try {
    const { id } = req.params

    // Check if user exists
    const existingUser = await db.getOne(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Prevent admin from deleting themselves
    if (existingUser.firebase_uid === req.user.uid) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      })
    }

    // Delete user
    await db.delete(
      'DELETE FROM users WHERE id = $1',
      [id]
    )

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    })
  }
})

// @route   GET /api/users/roles
// @desc    Get all available roles
// @access  Private
router.get('/roles', async (req, res) => {
  try {
    const roles = getAllRoles()
    
    res.json({
      success: true,
      data: roles
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles'
    })
  }
})

module.exports = router
