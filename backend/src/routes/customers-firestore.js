const express = require('express')
const { body, validationResult } = require('express-validator')
const db = require('../services/memory-db')

const router = express.Router()

// @route   GET /api/customers
// @desc    Get all customers
// @access  Private
router.get('/', async (req, res) => {
  try {
    const customers = await db.getAllCustomers()
    
    res.json({
      success: true,
      data: customers
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    })
  }
})

// @route   POST /api/customers
// @desc    Create a new customer
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Customer name is required'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const customerData = {
      name: req.body.name,
      contactPerson: req.body.contactPerson || '',
      email: req.body.email,
      phone: req.body.phone || '',
      address: req.body.address || '',
      gstNo: req.body.gstNo || '',
      status: req.body.status || 'active',
      createdBy: req.user?.uid || 'system'
    }

    const customer = await db.createCustomer(customerData)

    res.status(201).json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    })
  }
})

// @route   PUT /api/customers/:id
// @desc    Update a customer
// @access  Private
router.put('/:id', [
  body('name').notEmpty().withMessage('Customer name is required'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const customerId = req.params.id
    const customerData = {
      name: req.body.name,
      contactPerson: req.body.contactPerson || '',
      email: req.body.email,
      phone: req.body.phone || '',
      address: req.body.address || '',
      gstNo: req.body.gstNo || '',
      status: req.body.status || 'active'
    }

    const customer = await db.updateCustomer(customerId, customerData)

    res.json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    })
  }
})

// @route   DELETE /api/customers/:id
// @desc    Delete a customer
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const customerId = req.params.id
    await db.deleteCustomer(customerId)

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

// @route   GET /api/customers/:id
// @desc    Get a single customer
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const customerId = req.params.id
    const customer = await db.getCustomerById(customerId)

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

module.exports = router

