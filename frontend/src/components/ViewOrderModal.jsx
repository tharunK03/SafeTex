import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const ViewOrderModal = ({ isOpen, onClose, order }) => {
  const [orderDetails, setOrderDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && order) {
      setOrderDetails(order)
    }
  }, [isOpen, order])

  if (!isOpen || !orderDetails) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Order Header */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Number
              </label>
              <div className="text-lg font-semibold text-gray-900">
                {orderDetails.orderNumber}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                orderDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                orderDetails.status === 'in_production' ? 'bg-blue-100 text-blue-800' :
                orderDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                orderDetails.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {orderDetails.status?.replace('_', ' ') || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <div className="text-gray-900">
              {orderDetails.customerName}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Order Items
            </label>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderDetails.itemDetails && orderDetails.itemDetails.length > 0 ? (
                    orderDetails.itemDetails.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ₹{item.unitPrice || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ₹{((item.unitPrice || 0) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-sm text-gray-500 text-center">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span>₹{(orderDetails.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Notes */}
          {orderDetails.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {orderDetails.notes}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created Date
              </label>
              <div className="text-gray-900">
                {orderDetails.createdAt ? new Date(orderDetails.createdAt).toLocaleString() : 'N/A'}
              </div>
            </div>
            {orderDetails.updatedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <div className="text-gray-900">
                  {new Date(orderDetails.updatedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewOrderModal
