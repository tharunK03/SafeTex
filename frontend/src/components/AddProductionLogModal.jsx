import { useState, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle } from 'lucide-react'
import { orderAPI, rawMaterialsAPI } from '../services/api'

const AddProductionLogModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    producedQty: '',
    notes: ''
  })
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [materialAvailability, setMaterialAvailability] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Fetch orders when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchOrders()
    }
  }, [isOpen])

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getOrders()
      setOrders(response.data.data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const checkMaterialAvailability = async (orderId, quantity) => {
    if (!orderId || !quantity) return

    try {
      // Get order details to find products
      const order = orders.find(o => o.id === orderId)
      if (!order || !order.itemDetails || order.itemDetails.length === 0) return

      // Check availability for each product in the order
      const availabilityChecks = []
      for (const item of order.itemDetails) {
        // For now, we'll use a placeholder since we need product IDs
        // In a real implementation, you'd have product IDs in order items
        const response = await rawMaterialsAPI.checkAvailability('product-id', quantity)
        if (response.data.success) {
          availabilityChecks.push({
            productName: item.productName,
            ...response.data.data
          })
        }
      }

      setMaterialAvailability(availabilityChecks)
    } catch (error) {
      console.error('Error checking material availability:', error)
    }
  }

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

    // Update selected order when orderId changes
    if (name === 'orderId') {
      const order = orders.find(o => o.id === value)
      setSelectedOrder(order || null)
      setMaterialAvailability(null)
    }

    // Check material availability when quantity changes
    if (name === 'producedQty' && formData.orderId && value) {
      checkMaterialAvailability(formData.orderId, value)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.orderId) {
      newErrors.orderId = 'Order is required'
    }
    
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
      await onSubmit({
        orderId: formData.orderId,
        producedQty: parseInt(formData.producedQty),
        notes: formData.notes
      })
      
      // Reset form
      setFormData({
        orderId: '',
        producedQty: '',
        notes: ''
      })
      setSelectedOrder(null)
      setMaterialAvailability(null)
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating production log:', error)
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
          <h2 className="text-xl font-semibold text-gray-900">Add Production Log</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Order Selection */}
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-1">
              Order *
            </label>
            <select
              id="orderId"
              name="orderId"
              value={formData.orderId}
              onChange={handleChange}
              className={`input-field w-full ${errors.orderId ? 'border-red-500' : ''}`}
            >
              <option value="">Select an order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customerName} (₹{order.totalAmount?.toLocaleString()})
                </option>
              ))}
            </select>
            {errors.orderId && (
              <p className="text-red-500 text-sm mt-1">{errors.orderId}</p>
            )}
          </div>

          {/* Order Details */}
          {selectedOrder && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium text-gray-900">{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium text-gray-900">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium text-gray-900">₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-medium text-gray-900">{selectedOrder.totalItems || 0} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedOrder.status === 'in_production' ? 'bg-blue-100 text-blue-800' :
                    selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedOrder.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedOrder.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                </div>
                {selectedOrder.itemDetails && selectedOrder.itemDetails.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-600 text-sm">Items:</span>
                    <div className="mt-1 space-y-1">
                      {selectedOrder.itemDetails.map((item, index) => (
                        <div key={index} className="text-sm text-gray-700">
                          • {item.quantity}x {item.productName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Material Availability */}
          {materialAvailability && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-blue-600" />
                Material Availability Check
              </h3>
              <div className="space-y-2 text-sm">
                {materialAvailability.map((check, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{check.productName}:</span>
                    <span className={`flex items-center ${
                      check.canProduce ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {check.canProduce ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-1" />
                      )}
                      {check.canProduce ? 'Available' : 'Insufficient'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
              {loading ? 'Creating...' : 'Create Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProductionLogModal
