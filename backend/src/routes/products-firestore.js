import express from 'express'
import { body, validationResult } from 'express-validator'
import db from '../services/memory-db.js'

const router = express.Router()

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', async (req, res) => {
  try {
    const products = await db.getAllProducts()
    
    res.json({
      success: true,
      data: products
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
// @desc    Create a new product
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Product name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stockQty').isNumeric().withMessage('Stock quantity must be a number'),
  body('unitPrice').isNumeric().withMessage('Unit price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const productData = {
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category,
      sku: req.body.sku || '',
      stockQty: parseInt(req.body.stockQty) || 0,
      unitPrice: parseFloat(req.body.unitPrice) || 0,
      lowStockThreshold: parseInt(req.body.lowStockThreshold) || 10,
      status: req.body.status || 'active',
      createdBy: req.user?.uid || 'system'
    }

    const product = await db.createProduct(productData)

    res.status(201).json({
      success: true,
      data: product
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
// @desc    Update a product
// @access  Private
router.put('/:id', [
  body('name').notEmpty().withMessage('Product name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stockQty').isNumeric().withMessage('Stock quantity must be a number'),
  body('unitPrice').isNumeric().withMessage('Unit price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const productId = req.params.id
    const productData = {
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category,
      sku: req.body.sku || '',
      stockQty: parseInt(req.body.stockQty) || 0,
      unitPrice: parseFloat(req.body.unitPrice) || 0,
      lowStockThreshold: parseInt(req.body.lowStockThreshold) || 10,
      status: req.body.status || 'active'
    }

    const product = await db.updateProduct(productId, productData)

    res.json({
      success: true,
      data: product
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
// @desc    Delete a product
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const productId = req.params.id
    await db.deleteProduct(productId)

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

// @route   GET /api/products/:id
// @desc    Get a single product
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id
    const product = await db.getProductById(productId)

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    })
  }
})

export default router

