const express = require('express')
const { body, validationResult } = require('express-validator')
const db = require('../services/database')
const { requirePermission, requireRole, ROLES } = require('../config/roles')

const router = express.Router()

// @route   GET /api/customers-pg
// @desc    Get all customers from PostgreSQL
// @access  Private
router.get('/', requirePermission('customers', 'read'), async (req, res) => {
  try {
    const customers = await db.getMany(`
      SELECT 
        c.*,
        u.display_name as created_by_name
      FROM customers c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.status = 'active'
      ORDER BY c.created_at DESC
    `)

    res.json({
      success: true,
      data: customers,
      count: customers.length
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    })
  }
})

// @route   POST /api/customers-pg
// @desc    Create a new customer
// @access  Private
router.post('/', requirePermission('customers', 'create'), [
  body('name').notEmpty().withMessage('Customer name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
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

    const { name, contact_person, email, phone, address, gst_no } = req.body
    const created_by = req.user.uid // From auth middleware

    // Get user ID from Firebase UID
    const user = await db.getOne(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [created_by]
    )

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      })
    }

    // Insert new customer
    const newCustomer = await db.insert(`
      INSERT INTO customers (
        name, contact_person, email, phone, address, gst_no, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, contact_person, email, phone, address, gst_no, user.id])

    res.status(201).json({
      success: true,
      data: newCustomer,
      message: 'Customer created successfully'
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'Customer with this email already exists'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    })
  }
})

// @route   GET /api/customers-pg/:id
// @desc    Get customer by ID
// @access  Private
router.get('/:id', requirePermission('customers', 'read'), async (req, res) => {
  try {
    const { id } = req.params

    const customer = await db.getOne(`
      SELECT 
        c.*,
        u.display_name as created_by_name
      FROM customers c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1 AND c.status = 'active'
    `, [id])

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }

    res.json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer'
    })
  }
})

// @route   PUT /api/customers-pg/:id
// @desc    Update customer
// @access  Private
router.put('/:id', requirePermission('customers', 'update'), [
  body('name').optional().notEmpty().withMessage('Customer name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
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
    const { name, contact_person, email, phone, address, gst_no } = req.body

    // Check if customer exists
    const existingCustomer = await db.getOne(
      'SELECT * FROM customers WHERE id = $1 AND status = $2',
      [id, 'active']
    )

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }

    // Update customer
    const updatedCustomer = await db.update(`
      UPDATE customers 
      SET 
        name = COALESCE($1, name),
        contact_person = COALESCE($2, contact_person),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        gst_no = COALESCE($6, gst_no),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [name, contact_person, email, phone, address, gst_no, id])

    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully'
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'Customer with this email already exists'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    })
  }
})

// @route   DELETE /api/customers-pg/:id
// @desc    Delete customer (soft delete)
// @access  Private
router.delete('/:id', requirePermission('customers', 'delete'), async (req, res) => {
  try {
    const { id } = req.params

    // Check if customer exists
    const existingCustomer = await db.getOne(
      'SELECT * FROM customers WHERE id = $1 AND status = $2',
      [id, 'active']
    )

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      })
    }

    // Soft delete customer
    await db.update(`
      UPDATE customers 
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id])

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer'
    })
  }
})

module.exports = router
