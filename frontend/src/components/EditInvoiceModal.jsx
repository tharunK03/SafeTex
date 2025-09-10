import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const EditInvoiceModal = ({ isOpen, onClose, invoice, onSubmit }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    status: '',
    amount: '',
    dueDate: '',
    placeOfSupply: ''
  })

  useEffect(() => {
    if (invoice) {
      setFormData({
        status: invoice.status || '',
        amount: invoice.amount || '',
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        placeOfSupply: invoice.placeOfSupply || 'Tamil Nadu'
      })
    }
  }, [invoice])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.status) {
      alert('Please select a status')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error updating invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !invoice) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm">
            <div><span className="font-medium">Invoice:</span> {invoice.invoiceNumber}</div>
            <div><span className="font-medium">Order:</span> {invoice.orderNumber}</div>
            <div><span className="font-medium">Customer:</span> {invoice.customerName}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select status</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              step="0.01"
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
              {loading ? 'Updating...' : 'Update Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditInvoiceModal
