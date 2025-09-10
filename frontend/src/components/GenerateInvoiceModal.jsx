import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { orderAPI } from '../services/api'

const GenerateInvoiceModal = ({ isOpen, onClose, onSubmit }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    orderId: '',
    amount: '',
    dueDate: '',
    placeOfSupply: 'Tamil Nadu'
  })

  useEffect(() => {
    if (isOpen) {
      fetchOrders()
    }
  }, [isOpen])

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getOrders()
      // Filter orders that can have invoices generated
      const availableOrders = response.data.data.filter(order => 
        order.status === 'confirmed' || 
        order.status === 'processing' || 
        order.status === 'shipped' || 
        order.status === 'pending'
      )
              setOrders(availableOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-fill amount when order is selected
    if (name === 'orderId') {
      const selectedOrder = orders.find(order => order.id === value)
      if (selectedOrder) {
        setFormData(prev => ({
          ...prev,
          amount: selectedOrder.totalAmount || ''
        }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.orderId || !formData.amount) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
      setFormData({
        orderId: '',
        amount: '',
        dueDate: '',
        placeOfSupply: 'Tamil Nadu'
      })
    } catch (error) {
      console.error('Error generating invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Generate Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order *
            </label>
            <select
              name="orderId"
              value={formData.orderId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an order</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customerName} (₹{order.totalAmount?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Place of Supply
            </label>
            <select
              name="placeOfSupply"
              value={formData.placeOfSupply}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Tamil Nadu">Tamil Nadu (Intra-state)</option>
              <option value="Karnataka">Karnataka (Inter-state)</option>
              <option value="Maharashtra">Maharashtra (Inter-state)</option>
              <option value="Kerala">Kerala (Inter-state)</option>
              <option value="Andhra Pradesh">Andhra Pradesh (Inter-state)</option>
              <option value="Telangana">Telangana (Inter-state)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GenerateInvoiceModal
