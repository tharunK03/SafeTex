import express from 'express'
import { body, validationResult } from 'express-validator'
import db from '../services/memory-db.js'

const router = express.Router()

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private
router.get('/', async (req, res) => {
  try {
    const orders = await db.getAllOrders()
    
    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const orderItems = await db.getOrderItemsByOrderId(order.id)
        return {
          ...order,
          items: orderItems
        }
      })
    )
    
    res.json({
      success: true,
      data: ordersWithItems
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
// @desc    Create a new order
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

    // Generate unique order number
    const orderNumber = await db.generateOrderNumber()

    // Calculate total amount
    let totalAmount = 0
    for (const item of items) {
      const product = await db.getProductById(item.productId)
      if (product) {
        totalAmount += product.unitPrice * item.quantity
      }
    }

    const orderData = {
      orderNumber,
      customerId,
      status: 'pending',
      totalAmount,
      notes: notes || '',
      createdBy: req.user?.uid || 'system'
    }

    const order = await db.createOrder(orderData)

    // Create order items
    const orderItems = []
    for (const item of items) {
      const product = await db.getProductById(item.productId)
      if (product) {
        const orderItemData = {
          orderId: order.id,
          productId: item.productId,
          productName: product.name,
          quantity: parseInt(item.quantity),
          unitPrice: product.unitPrice,
          totalPrice: product.unitPrice * item.quantity
        }
        const orderItem = await db.createOrderItem(orderItemData)
        orderItems.push(orderItem)
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...order,
        items: orderItems
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
// @desc    Update an order
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const orderId = req.params.id
    const orderData = {
      status: req.body.status,
      notes: req.body.notes || ''
    }

    const order = await db.updateOrder(orderId, orderData)

    res.json({
      success: true,
      data: order
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
// @desc    Delete an order
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const orderId = req.params.id
    
    // Delete order items first
    const orderItems = await db.getOrderItemsByOrderId(orderId)
    for (const item of orderItems) {
      await db.deleteOrderItem(item.id)
    }
    
    // Delete the order
    await db.deleteOrder(orderId)

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

// @route   GET /api/orders/:id
// @desc    Get a single order
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id
    const order = await db.getOrderById(orderId)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      })
    }

    // Get order items
    const orderItems = await db.getOrderItemsByOrderId(orderId)

    res.json({
      success: true,
      data: {
        ...order,
        items: orderItems
      }
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    })
  }
})

export default router

