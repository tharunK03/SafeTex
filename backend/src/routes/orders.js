const express = require('express')
const { body, validationResult } = require('express-validator')
const { supabase } = require('../config/supabase')

const router = express.Router()

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private
router.get('/', async (req, res) => {
  try {
    // First get all orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(name, contact_person, email)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching orders:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch orders'
      })
    }

    // Then get order items for each order
    const transformedOrders = await Promise.all((orders || []).map(async (order) => {
      console.log(`Processing order ${order.order_number} with ID: ${order.id}`)
      
      // Get order items for this order
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          products(name)
        `)
        .eq('order_id', order.id)
      
      console.log(`Order items for ${order.order_number}:`, orderItems)
      
      if (itemsError) {
        console.error('Error fetching order items:', itemsError)
      }

      // Calculate total items and get item details
      const totalItems = orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
      const itemDetails = orderItems?.map(item => ({
        quantity: item.quantity,
        productName: item.products?.name || 'Unknown Product'
      })) || []

      console.log(`Total items for ${order.order_number}: ${totalItems}`)

      return {
        id: order.id,
        orderNumber: order.order_number,
        customerId: order.customer_id,
        customerName: order.customers?.name || 'Unknown Customer',
        status: order.status,
        totalAmount: order.total_amount,
        totalItems: totalItems,
        itemDetails: itemDetails,
        notes: order.notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }
    }))

    res.json({
      success: true,
      data: transformedOrders
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    })
  }
})

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isNumeric().withMessage('Quantity must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const { customerId, items, notes } = req.body
    
    // Generate order number in SAFT-00001 format
    const { data: lastOrder, error: countError } = await supabase
      .from('orders')
      .select('order_number')
      .order('created_at', { ascending: false })
      .limit(1)
    
    let orderNumber = 'SAFT-00001'
    if (lastOrder && lastOrder.length > 0) {
      const lastNumber = lastOrder[0].order_number
      if (lastNumber && lastNumber.startsWith('SAFT-')) {
        const numberPart = parseInt(lastNumber.replace('SAFT-', ''))
        orderNumber = `SAFT-${String(numberPart + 1).padStart(5, '0')}`
      }
    }
    
    // Calculate total amount
    let totalAmount = 0
    for (const item of items) {
      // Get product price from database
      const { data: product } = await supabase
        .from('products')
        .select('unit_price')
        .eq('id', item.productId)
        .single()
      
      if (product) {
        totalAmount += product.unit_price * item.quantity
      }
    }
    
    const orderData = {
      order_number: orderNumber,
      customer_id: customerId,
      status: 'pending',
      total_amount: totalAmount,
      notes: notes || ''
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating order:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create order'
      })
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: 0, // Will be calculated from product
      total_price: 0 // Will be calculated
    }))

    // Get product prices and calculate totals
    for (let i = 0; i < orderItems.length; i++) {
      const { data: product } = await supabase
        .from('products')
        .select('unit_price')
        .eq('id', orderItems[i].product_id)
        .single()
      
      if (product) {
        orderItems[i].unit_price = product.unit_price
        orderItems[i].total_price = product.unit_price * orderItems[i].quantity
      }
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    
    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      return res.status(500).json({
        success: false,
        error: 'Failed to create order items'
      })
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.order_number,
        customerId: order.customer_id,
        status: order.status,
        totalAmount: order.total_amount,
        notes: order.notes
      }
    })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    })
  }
})

// @route   PUT /api/orders/:id
// @desc    Update order
// @access  Private
router.put('/:id', [
  body('status').isIn(['pending', 'in_production', 'completed', 'shipped']).withMessage('Invalid status')
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
    const { status, notes } = req.body
    
    const orderData = {
      status,
      notes: notes || ''
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(orderData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating order:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update order'
      })
    }
    
    res.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.order_number,
        customerId: order.customer_id,
        status: order.status,
        totalAmount: order.total_amount,
        notes: order.notes
      }
    })
  } catch (error) {
    console.error('Error updating order:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    })
  }
})

// @route   DELETE /api/orders/:id
// @desc    Delete order
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting order:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to delete order'
      })
    }
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete order'
    })
  }
})

module.exports = router 