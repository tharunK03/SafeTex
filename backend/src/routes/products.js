const express = require('express')
const { body, validationResult } = require('express-validator')
const { supabase } = require('../config/supabase')

const router = express.Router()

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching products:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch products'
      })
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedProducts = (products || []).map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      stockQty: product.stock_qty,
      unitPrice: product.unit_price,
      lowStockThreshold: product.low_stock_threshold,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }))

    res.json({
      success: true,
      data: transformedProducts
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    })
  }
})

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stockQty').isNumeric().withMessage('Stock quantity must be a number'),
  body('unitPrice').isNumeric().withMessage('Unit price must be a number'),
  body('lowStockThreshold').isNumeric().withMessage('Low stock threshold must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const { name, category, stockQty, unitPrice, lowStockThreshold } = req.body
    
    const productData = {
      name,
      category,
      stock_qty: parseInt(stockQty),
      unit_price: parseFloat(unitPrice),
      low_stock_threshold: parseInt(lowStockThreshold)
      // Removed created_by for now since Firebase UID is not a valid PostgreSQL UUID
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating product:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create product'
      })
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        category: product.category,
        stockQty: product.stock_qty,
        unitPrice: product.unit_price,
        lowStockThreshold: product.low_stock_threshold
      }
    })
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    })
  }
})

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', [
  body('name').notEmpty().withMessage('Name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stockQty').isNumeric().withMessage('Stock quantity must be a number'),
  body('unitPrice').isNumeric().withMessage('Unit price must be a number'),
  body('lowStockThreshold').isNumeric().withMessage('Low stock threshold must be a number')
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
    const { name, category, stockQty, unitPrice, lowStockThreshold } = req.body
    
    const productData = {
      name,
      category,
      stock_qty: parseInt(stockQty),
      unit_price: parseFloat(unitPrice),
      low_stock_threshold: parseInt(lowStockThreshold)
      // Removed updated_by for now since Firebase UID is not a valid PostgreSQL UUID
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating product:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update product'
      })
    }
    
    res.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        category: product.category,
        stockQty: product.stock_qty,
        unitPrice: product.unit_price,
        lowStockThreshold: product.low_stock_threshold
      }
    })
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    })
  }
})

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting product:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to delete product'
      })
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    })
  }
})

module.exports = router 