import { useState } from 'react'
import { X } from 'lucide-react'

const AddRawMaterialModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    currentStock: '',
    unit: '',
    minStockLevel: '',
    costPerUnit: '',
    supplier: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.currentStock) {
      newErrors.currentStock = 'Current stock is required'
    } else if (isNaN(formData.currentStock) || parseFloat(formData.currentStock) < 0) {
      newErrors.currentStock = 'Current stock must be a positive number'
    }
    
    if (!formData.unit) {
      newErrors.unit = 'Unit is required'
    }
    
    if (!formData.minStockLevel) {
      newErrors.minStockLevel = 'Minimum stock level is required'
    } else if (isNaN(formData.minStockLevel) || parseFloat(formData.minStockLevel) < 0) {
      newErrors.minStockLevel = 'Minimum stock level must be a positive number'
    }
    
    if (!formData.costPerUnit) {
      newErrors.costPerUnit = 'Cost per unit is required'
    } else if (isNaN(formData.costPerUnit) || parseFloat(formData.costPerUnit) < 0) {
      newErrors.costPerUnit = 'Cost per unit must be a positive number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description,
        currentStock: parseFloat(formData.currentStock),
        unit: formData.unit,
        minStockLevel: parseFloat(formData.minStockLevel),
        costPerUnit: parseFloat(formData.costPerUnit),
        supplier: formData.supplier
      })
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        currentStock: '',
        unit: '',
        minStockLevel: '',
        costPerUnit: '',
        supplier: ''
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating raw material:', error)
      // Don't close modal on error, let user fix the issue
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Raw Material</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Material Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-field w-full ${errors.name ? 'border-red-500' : ''}`}
              placeholder="e.g., Cotton Fabric, Polyester Thread"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="input-field w-full"
              placeholder="Brief description of the material..."
            />
          </div>
          
          {/* Current Stock */}
          <div>
            <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700 mb-1">
              Current Stock *
            </label>
            <input
              type="number"
              id="currentStock"
              name="currentStock"
              value={formData.currentStock}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`input-field w-full ${errors.currentStock ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
            {errors.currentStock && (
              <p className="text-red-500 text-sm mt-1">{errors.currentStock}</p>
            )}
          </div>
          
          {/* Unit */}
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className={`input-field w-full ${errors.unit ? 'border-red-500' : ''}`}
            >
              <option value="">Select unit</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="m">Meters (m)</option>
              <option value="cm">Centimeters (cm)</option>
              <option value="pcs">Pieces (pcs)</option>
              <option value="rolls">Rolls</option>
              <option value="yards">Yards</option>
              <option value="liters">Liters (L)</option>
              <option value="ml">Milliliters (ml)</option>
            </select>
            {errors.unit && (
              <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
            )}
          </div>
          
          {/* Minimum Stock Level */}
          <div>
            <label htmlFor="minStockLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Stock Level *
            </label>
            <input
              type="number"
              id="minStockLevel"
              name="minStockLevel"
              value={formData.minStockLevel}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`input-field w-full ${errors.minStockLevel ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
            {errors.minStockLevel && (
              <p className="text-red-500 text-sm mt-1">{errors.minStockLevel}</p>
            )}
          </div>
          
          {/* Cost Per Unit */}
          <div>
            <label htmlFor="costPerUnit" className="block text-sm font-medium text-gray-700 mb-1">
              Cost Per Unit (₹) *
            </label>
            <input
              type="number"
              id="costPerUnit"
              name="costPerUnit"
              value={formData.costPerUnit}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`input-field w-full ${errors.costPerUnit ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
            {errors.costPerUnit && (
              <p className="text-red-500 text-sm mt-1">{errors.costPerUnit}</p>
            )}
          </div>
          
          {/* Supplier */}
          <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <input
              type="text"
              id="supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Supplier name..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddRawMaterialModal
