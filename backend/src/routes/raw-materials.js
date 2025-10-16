import express from 'express'
import { body, validationResult } from 'express-validator'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// @route   GET /api/raw-materials
// @desc    Get all raw materials
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { data: rawMaterials, error } = await supabase
      .from('raw_materials')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching raw materials:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch raw materials'
      })
    }

    // Transform data to camelCase for frontend
    const transformedMaterials = rawMaterials.map(material => ({
      id: material.id,
      name: material.name,
      description: material.description,
      currentStock: parseFloat(material.current_stock),
      unit: material.unit,
      minStockLevel: parseFloat(material.min_stock_level),
      costPerUnit: parseFloat(material.cost_per_unit),
      supplier: material.supplier,
      createdAt: material.created_at,
      updatedAt: material.updated_at
    }))

    res.json({
      success: true,
      data: transformedMaterials
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
// @desc    Create new raw material
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('currentStock').isNumeric().withMessage('Current stock must be a number'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('minStockLevel').isNumeric().withMessage('Minimum stock level must be a number'),
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

    const { name, description, currentStock, unit, minStockLevel, costPerUnit, supplier } = req.body
    
    const materialData = {
      name,
      description: description || '',
      current_stock: parseFloat(currentStock),
      unit,
      min_stock_level: parseFloat(minStockLevel),
      cost_per_unit: parseFloat(costPerUnit),
      supplier: supplier || ''
    }

    const { data: material, error } = await supabase
      .from('raw_materials')
      .insert([materialData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating raw material:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create raw material'
      })
    }
    
    // Transform response to camelCase
    const transformedMaterial = {
      id: material.id,
      name: material.name,
      description: material.description,
      currentStock: parseFloat(material.current_stock),
      unit: material.unit,
      minStockLevel: parseFloat(material.min_stock_level),
      costPerUnit: parseFloat(material.cost_per_unit),
      supplier: material.supplier,
      createdAt: material.created_at,
      updatedAt: material.updated_at
    }

    res.status(201).json({
      success: true,
      data: transformedMaterial
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
// @desc    Update raw material
// @access  Private
router.put('/:id', [
  body('name').notEmpty().withMessage('Name is required'),
  body('currentStock').isNumeric().withMessage('Current stock must be a number'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('minStockLevel').isNumeric().withMessage('Minimum stock level must be a number'),
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

    const { id } = req.params
    const { name, description, currentStock, unit, minStockLevel, costPerUnit, supplier } = req.body
    
    const updateData = {
      name,
      description: description || '',
      current_stock: parseFloat(currentStock),
      unit,
      min_stock_level: parseFloat(minStockLevel),
      cost_per_unit: parseFloat(costPerUnit),
      supplier: supplier || ''
    }

    const { data: material, error } = await supabase
      .from('raw_materials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating raw material:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update raw material'
      })
    }
    
    // Transform response to camelCase
    const transformedMaterial = {
      id: material.id,
      name: material.name,
      description: material.description,
      currentStock: parseFloat(material.current_stock),
      unit: material.unit,
      minStockLevel: parseFloat(material.min_stock_level),
      costPerUnit: parseFloat(material.cost_per_unit),
      supplier: material.supplier,
      createdAt: material.created_at,
      updatedAt: material.updated_at
    }

    res.json({
      success: true,
      data: transformedMaterial
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
// @desc    Delete raw material
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { error } = await supabase
      .from('raw_materials')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting raw material:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to delete raw material'
      })
    }

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

// @route   GET /api/raw-materials/check-availability
// @desc    Check raw materials availability for production
// @access  Private
router.get('/check-availability', async (req, res) => {
  try {
    const { productId, quantity } = req.query

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and quantity are required'
      })
    }

    // Get material requirements for the product
    const { data: requirements, error: requirementsError } = await supabase
      .from('production_material_requirements')
      .select(`
        quantity_required,
        unit,
        raw_materials(id, name, current_stock, unit, min_stock_level)
      `)
      .eq('product_id', productId)

    if (requirementsError) {
      console.error('Error fetching material requirements:', requirementsError)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch material requirements'
      })
    }

    if (!requirements || requirements.length === 0) {
      return res.json({
        success: true,
        data: {
          canProduce: true,
          message: 'No material requirements defined for this product',
          requirements: []
        }
      })
    }

    // Check availability for each material
    const availabilityCheck = requirements.map(req => {
      const requiredQty = parseFloat(req.quantity_required) * parseInt(quantity)
      const availableQty = parseFloat(req.raw_materials.current_stock)
      const canProduce = availableQty >= requiredQty

      return {
        materialId: req.raw_materials.id,
        materialName: req.raw_materials.name,
        requiredQuantity: requiredQty,
        availableQuantity: availableQty,
        unit: req.unit,
        canProduce,
        shortfall: canProduce ? 0 : requiredQty - availableQty
      }
    })

    const canProduceOverall = availabilityCheck.every(check => check.canProduce)
    const shortfallMaterials = availabilityCheck.filter(check => !check.canProduce)

    res.json({
      success: true,
      data: {
        canProduce: canProduceOverall,
        message: canProduceOverall 
          ? 'All materials available for production' 
          : `Insufficient materials: ${shortfallMaterials.map(m => m.materialName).join(', ')}`,
        requirements: availabilityCheck,
        shortfallMaterials
      }
    })
  } catch (error) {
    console.error('Error checking material availability:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check material availability'
    })
  }
})

export default router
