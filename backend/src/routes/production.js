import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';

const router = express.Router()

// @route   GET /api/production
// @desc    Get all production logs
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { data: productionLogs, error } = await supabase
      .from('production_logs')
      .select(`
        *,
        orders(order_number, customers(name))
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching production logs:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch production logs'
      })
    }

    // Transform data to camelCase for frontend
    const transformedLogs = productionLogs.map(log => ({
      id: log.id,
      orderId: log.order_id,
      orderNumber: log.orders?.order_number || 'Unknown',
      customerName: log.orders?.customers?.name || 'Unknown',
      date: log.created_at ? new Date(log.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      producedQty: log.quantity_produced,
      notes: log.notes,
      createdAt: log.created_at,
      updatedAt: log.updated_at
    }))

    res.json({
      success: true,
      data: transformedLogs
    })
  } catch (error) {
    console.error('Error fetching production logs:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production logs'
    })
  }
})

// @route   POST /api/production
// @desc    Create new production log
// @access  Private
router.post('/', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('producedQty').isNumeric().withMessage('Produced quantity must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const { orderId, producedQty, notes } = req.body
    
    // First, get the order details to find the product
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(product_id, quantity)
      `)
      .eq('id', orderId)
      .single()
    
    if (orderError) {
      console.error('Error fetching order:', orderError)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch order details'
      })
    }

    // Check material availability for each product in the order
    const materialChecks = []
    for (const item of order.order_items) {
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('production_material_requirements')
        .select(`
          quantity_required,
          unit,
          raw_materials(id, name, current_stock, unit, min_stock_level)
        `)
        .eq('product_id', item.product_id)

      if (availabilityError) {
        console.error('Error checking material availability:', availabilityError)
        continue
      }

      if (availabilityData && availabilityData.length > 0) {
        const requiredQty = parseFloat(availabilityData[0].quantity_required) * parseInt(producedQty)
        const availableQty = parseFloat(availabilityData[0].raw_materials.current_stock)
        const canProduce = availableQty >= requiredQty

        materialChecks.push({
          productId: item.product_id,
          materialName: availabilityData[0].raw_materials.name,
          requiredQuantity: requiredQty,
          availableQuantity: availableQty,
          unit: availabilityData[0].unit,
          canProduce,
          shortfall: canProduce ? 0 : requiredQty - availableQty
        })
      }
    }

    // Check if all materials are available
    const canProduceOverall = materialChecks.length === 0 || materialChecks.every(check => check.canProduce)
    
    if (!canProduceOverall) {
      const shortfallMaterials = materialChecks.filter(check => !check.canProduce)
      return res.status(400).json({
        success: false,
        error: 'Insufficient raw materials for production',
        data: {
          canProduce: false,
          message: `Insufficient materials: ${shortfallMaterials.map(m => m.materialName).join(', ')}`,
          shortfallMaterials
        }
      })
    }

    // If materials are available, proceed with production log creation
    const productionData = {
      order_id: orderId,
      quantity_produced: parseInt(producedQty),
      notes: notes || ''
      // Removed created_by for now since Firebase UID is not a valid PostgreSQL UUID
    }

    const { data: productionLog, error } = await supabase
      .from('production_logs')
      .insert([productionData])
      .select(`
        *,
        orders(order_number, customers(name))
      `)
      .single()
    
    if (error) {
      console.error('Error creating production log:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create production log'
      })
    }
    
    // Transform response to camelCase
    const transformedLog = {
      id: productionLog.id,
      orderId: productionLog.order_id,
      orderNumber: productionLog.orders?.order_number || 'Unknown',
      customerName: productionLog.orders?.customers?.name || 'Unknown',
      date: productionLog.created_at ? new Date(productionLog.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      producedQty: productionLog.quantity_produced,
      notes: productionLog.notes,
      createdAt: productionLog.created_at,
      updatedAt: productionLog.updated_at
    }

    res.status(201).json({
      success: true,
      data: transformedLog,
      materialCheck: {
        canProduce: true,
        message: 'Production log created successfully with sufficient materials',
        requirements: materialChecks
      }
    })
  } catch (error) {
    console.error('Error creating production log:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create production log'
    })
  }
})

// @route   PUT /api/production/:id
// @desc    Update production log
// @access  Private
router.put('/:id', [
  body('producedQty').isNumeric().withMessage('Produced quantity must be a number')
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
    const { producedQty, notes } = req.body
    
    const updateData = {
      quantity_produced: parseInt(producedQty),
      notes: notes || ''
      // Removed updated_by for now since Firebase UID is not a valid PostgreSQL UUID
    }

    const { data: productionLog, error } = await supabase
      .from('production_logs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        orders(order_number, customers(name))
      `)
      .single()
    
    if (error) {
      console.error('Error updating production log:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update production log'
      })
    }
    
    // Transform response to camelCase
    const transformedLog = {
      id: productionLog.id,
      orderId: productionLog.order_id,
      orderNumber: productionLog.orders?.order_number || 'Unknown',
      customerName: productionLog.orders?.customers?.name || 'Unknown',
      date: productionLog.created_at ? new Date(productionLog.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      producedQty: productionLog.quantity_produced,
      notes: productionLog.notes,
      createdAt: productionLog.created_at,
      updatedAt: productionLog.updated_at
    }

    res.json({
      success: true,
      data: transformedLog
    })
  } catch (error) {
    console.error('Error updating production log:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update production log'
    })
  }
})

// @route   DELETE /api/production/:id
// @desc    Delete production log
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { error } = await supabase
      .from('production_logs')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting production log:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to delete production log'
      })
    }

    res.json({
      success: true,
      message: 'Production log deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting production log:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete production log'
    })
  }
})

export default router;