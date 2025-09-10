import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { customerAPI, productAPI } from '../services/api'

const NewOrderModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    notes: ''
  })
  const [items, setItems] = useState([{ productId: '', quantity: 1 }])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Fetch customers and products on component mount
  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchProducts()
    }
  }, [isOpen])

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers()
      setCustomers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getProducts()
      setProducts(response.data.data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
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
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1 }])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index)
      setItems(newItems)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required'
    }
    
    if (items.length === 0) {
      newErrors.items = 'At least one item is required'
    } else {
      items.forEach((item, index) => {
        if (!item.productId) {
          newErrors[`item${index}Product`] = 'Product is required'
        }
        if (!item.quantity || item.quantity < 1) {
          newErrors[`item${index}Quantity`] = 'Valid quantity is required'
        }
      })
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
        customerId: formData.customerId,
        items: items.filter(item => item.productId && item.quantity),
        notes: formData.notes
      })
      
      // Reset form
      setFormData({
        customerId: '',
        notes: ''
      })
      setItems([{ productId: '', quantity: 1 }])
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating order:', error)
      // Don't close modal on error, let user fix the issue
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    let total = 0
    items.forEach(item => {
      if (item.productId && item.quantity) {
        const product = products.find(p => p.id === item.productId)
        if (product) {
          total += product.unitPrice * item.quantity
        }
      }
    })
    return total
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create New Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <select
              id="customerId"
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              className={`input-field w-full ${errors.customerId ? 'border-red-500' : ''}`}
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.email}
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
            )}
          </div>

          {/* Order Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 mb-4 p-4 border rounded-lg">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    className={`input-field w-full ${errors[`item${index}Product`] ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ₹{product.unitPrice}
                      </option>
                    ))}
                  </select>
                  {errors[`item${index}Product`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`item${index}Product`]}</p>
                  )}
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    className={`input-field w-full ${errors[`item${index}Quantity`] ? 'border-red-500' : ''}`}
                    min="1"
                  />
                  {errors[`item${index}Quantity`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`item${index}Quantity`]}</p>
                  )}
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <div className="input-field w-full bg-gray-50">
                    ₹{(() => {
                      const product = products.find(p => p.id === item.productId)
                      return product ? (product.unitPrice * item.quantity).toFixed(2) : '0.00'
                    })()}
                  </div>
                </div>

                <div className="col-span-1 flex items-end">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {errors.items && (
              <p className="text-red-500 text-sm mt-1">{errors.items}</p>
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
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
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
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewOrderModal
