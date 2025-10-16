import express from 'express'
import { body, validationResult } from 'express-validator'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// @route   GET /api/customers
// @desc    Get all customers
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching customers:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch customers'
      })
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedCustomers = (customers || []).map(customer => ({
      id: customer.id,
      name: customer.name,
      contactPerson: customer.contact_person,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      gstNo: customer.gst_no,
      status: customer.status,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    }))

    res.json({
      success: true,
      data: transformedCustomers
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
// @desc    Create new customer
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('contactPerson').notEmpty().withMessage('Contact person is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('gstNo').notEmpty().withMessage('GST number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const { name, contactPerson, email, phone, address, gstNo } = req.body
    
    const customerData = {
      name,
      contact_person: contactPerson,
      email,
      phone,
      address,
      gst_no: gstNo,
      status: 'active'
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating customer:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create customer',
        code: error.code,
        details: error.details || error.hint
      })
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        contactPerson: customer.contact_person,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        gstNo: customer.gst_no,
        status: customer.status
      }
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
// @desc    Update customer
// @access  Private
router.put('/:id', [
  body('name').notEmpty().withMessage('Name is required'),
  body('contactPerson').notEmpty().withMessage('Contact person is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('gstNo').notEmpty().withMessage('GST number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const { id } = req.params
    const { name, contactPerson, email, phone, address, gstNo } = req.body
    
    const customerData = {
      name,
      contact_person: contactPerson,
      email,
      phone,
      address,
      gst_no: gstNo
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating customer:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update customer',
        code: error.code,
        details: error.details || error.hint
      })
    }
    
    res.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        contactPerson: customer.contact_person,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        gstNo: customer.gst_no,
        status: customer.status
      }
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
// @desc    Delete customer
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting customer:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete customer',
        code: error.code,
        details: error.details || error.hint
      })
    }
    
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

export default router