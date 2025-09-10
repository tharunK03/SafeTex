import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const EditProductionLogModal = ({ isOpen, onClose, onSubmit, productionLog }) => {
  const [formData, setFormData] = useState({
    producedQty: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (productionLog) {
      setFormData({
        producedQty: productionLog.producedQty?.toString() || '',
        notes: productionLog.notes || ''
      })
      setErrors({})
    }
  }, [productionLog])

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
    
    if (!formData.producedQty) {
      newErrors.producedQty = 'Produced quantity is required'
    } else if (isNaN(formData.producedQty) || parseInt(formData.producedQty) <= 0) {
      newErrors.producedQty = 'Produced quantity must be a positive number'
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
      await onSubmit(productionLog.id, {
        producedQty: parseInt(formData.producedQty),
        notes: formData.notes
      })
      onClose()
    } catch (error) {
      console.error('Error updating production log:', error)
      // Don't close modal on error, let user fix the issue
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !productionLog) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Production Log</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Production Log Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Order</div>
            <div className="font-semibold text-gray-900">{productionLog.orderNumber}</div>
            <div className="text-sm text-gray-600 mt-1">Customer: {productionLog.customerName}</div>
            <div className="text-sm text-gray-600">Date: {productionLog.date}</div>
          </div>

          {/* Produced Quantity */}
          <div>
            <label htmlFor="producedQty" className="block text-sm font-medium text-gray-700 mb-1">
              Produced Quantity *
            </label>
            <input
              type="number"
              id="producedQty"
              name="producedQty"
              value={formData.producedQty}
              onChange={handleChange}
              min="1"
              className={`input-field w-full ${errors.producedQty ? 'border-red-500' : ''}`}
              placeholder="Enter quantity produced"
            />
            {errors.producedQty && (
              <p className="text-red-500 text-sm mt-1">{errors.producedQty}</p>
            )}
          </div>
          
          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="input-field w-full"
              placeholder="Add any production notes..."
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
              {loading ? 'Updating...' : 'Update Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProductionLogModal
