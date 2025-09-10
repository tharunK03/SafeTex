import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const EditProductModal = ({ isOpen, onClose, onSubmit, product }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stockQty: '',
    unitPrice: '',
    lowStockThreshold: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Update form data when product prop changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        stockQty: product.stockQty || '',
        unitPrice: product.unitPrice || '',
        lowStockThreshold: product.lowStockThreshold || ''
      })
      setErrors({})
    }
  }, [product])

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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }
    
    if (!formData.stockQty || isNaN(formData.stockQty) || formData.stockQty < 0) {
      newErrors.stockQty = 'Valid stock quantity is required'
    }
    
    if (!formData.unitPrice || isNaN(formData.unitPrice) || formData.unitPrice < 0) {
      newErrors.unitPrice = 'Valid unit price is required'
    }
    
    if (!formData.lowStockThreshold || isNaN(formData.lowStockThreshold) || formData.lowStockThreshold < 0) {
      newErrors.lowStockThreshold = 'Valid low stock threshold is required'
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
      await onSubmit(product.id, {
        ...formData,
        stockQty: parseInt(formData.stockQty),
        unitPrice: parseFloat(formData.unitPrice),
        lowStockThreshold: parseInt(formData.lowStockThreshold)
      })
      
      onClose()
    } catch (error) {
      console.error('Error updating product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-field w-full ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`input-field w-full ${errors.category ? 'border-red-500' : ''}`}
              placeholder="Enter category"
            />
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="stockQty" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                id="stockQty"
                name="stockQty"
                value={formData.stockQty}
                onChange={handleChange}
                className={`input-field w-full ${errors.stockQty ? 'border-red-500' : ''}`}
                placeholder="0"
                min="0"
              />
              {errors.stockQty && (
                <p className="text-red-500 text-sm mt-1">{errors.stockQty}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                className={`input-field w-full ${errors.unitPrice ? 'border-red-500' : ''}`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.unitPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.unitPrice}</p>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Threshold *
            </label>
            <input
              type="number"
              id="lowStockThreshold"
              name="lowStockThreshold"
              value={formData.lowStockThreshold}
              onChange={handleChange}
              className={`input-field w-full ${errors.lowStockThreshold ? 'border-red-500' : ''}`}
              placeholder="0"
              min="0"
            />
            {errors.lowStockThreshold && (
              <p className="text-red-500 text-sm mt-1">{errors.lowStockThreshold}</p>
            )}
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
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProductModal
