import express from 'express'
import { body, validationResult } from 'express-validator'
import db from '../services/memory-db.js'

const router = express.Router()

// @route   GET /api/raw-materials
// @desc    Get all raw materials
// @access  Private
router.get('/', async (req, res) => {
  try {
    const rawMaterials = await db.getAllRawMaterials()
    
    res.json({
      success: true,
      data: rawMaterials
    })
  } catch (error) {
    console.error('Error fetching raw materials:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch raw materials'
    })
  }
})

// @route   POST /api/raw-materials
// @desc    Create a new raw material
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Raw material name is required'),
  body('currentStock').isNumeric().withMessage('Current stock must be a number'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('costPerUnit').isNumeric().withMessage('Cost per unit must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const rawMaterialData = {
      name: req.body.name,
      description: req.body.description || '',
      currentStock: parseFloat(req.body.currentStock) || 0,
      unit: req.body.unit,
      minStockLevel: parseFloat(req.body.minStockLevel) || 0,
      costPerUnit: parseFloat(req.body.costPerUnit) || 0,
      supplier: req.body.supplier || '',
      status: req.body.status || 'active',
      createdBy: req.user?.uid || 'system'
    }

    const rawMaterial = await db.createRawMaterial(rawMaterialData)

    res.status(201).json({
      success: true,
      data: rawMaterial
    })
  } catch (error) {
    console.error('Error creating raw material:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create raw material'
    })
  }
})

// @route   PUT /api/raw-materials/:id
// @desc    Update a raw material
// @access  Private
router.put('/:id', [
  body('name').notEmpty().withMessage('Raw material name is required'),
  body('currentStock').isNumeric().withMessage('Current stock must be a number'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('costPerUnit').isNumeric().withMessage('Cost per unit must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const rawMaterialId = req.params.id
    const rawMaterialData = {
      name: req.body.name,
      description: req.body.description || '',
      currentStock: parseFloat(req.body.currentStock) || 0,
      unit: req.body.unit,
      minStockLevel: parseFloat(req.body.minStockLevel) || 0,
      costPerUnit: parseFloat(req.body.costPerUnit) || 0,
      supplier: req.body.supplier || '',
      status: req.body.status || 'active'
    }

    const rawMaterial = await db.updateRawMaterial(rawMaterialId, rawMaterialData)

    res.json({
      success: true,
      data: rawMaterial
    })
  } catch (error) {
    console.error('Error updating raw material:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update raw material'
    })
  }
})

// @route   DELETE /api/raw-materials/:id
// @desc    Delete a raw material
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const rawMaterialId = req.params.id
    await db.deleteRawMaterial(rawMaterialId)

    res.json({
      success: true,
      message: 'Raw material deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting raw material:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete raw material'
    })
  }
})

// @route   GET /api/raw-materials/:id
// @desc    Get a single raw material
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const rawMaterialId = req.params.id
    const rawMaterial = await db.getRawMaterialById(rawMaterialId)

    if (!rawMaterial) {
      return res.status(404).json({
        success: false,
        error: 'Raw material not found'
      })
    }

    res.json({
      success: true,
      data: rawMaterial
    })
  } catch (error) {
    console.error('Error fetching raw material:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch raw material'
    })
  }
})

export default router

