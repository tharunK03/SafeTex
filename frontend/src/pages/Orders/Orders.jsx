import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { orderAPI } from '../../services/api'
import NewOrderModal from '../../components/NewOrderModal'
import ViewOrderModal from '../../components/ViewOrderModal'
import EditOrderModal from '../../components/EditOrderModal'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await orderAPI.getOrders()
      console.log('Orders API response:', response.data)
      setOrders(response.data.data || [])
      setError('')
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async (orderData) => {
    try {
      const response = await orderAPI.createOrder(orderData)
      setOrders(prev => [response.data.data, ...prev])
      setError('')
      setSuccess('Order created successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error creating order:', error)
      throw error // Re-throw to let the modal handle the error
    }
  }

  const handleUpdateOrder = async (orderId, orderData) => {
    try {
      const response = await orderAPI.updateOrder(orderId, orderData)
      setOrders(prev => prev.map(order => 
        order.id === orderId ? response.data.data : order
      ))
      setError('')
      setSuccess('Order updated successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error updating order:', error)
      throw error // Re-throw to let the modal handle the error
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return
    }

    try {
      await orderAPI.deleteOrder(orderId)
      setOrders(prev => prev.filter(order => order.id !== orderId))
      setError('')
      setSuccess('Order deleted successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error deleting order:', error)
      setError('Failed to delete order')
    }
  }

  const openViewModal = (order) => {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  const openEditModal = (order) => {
    setSelectedOrder(order)
    setIsEditModalOpen(true)
  }

  const closeViewModal = () => {
    setSelectedOrder(null)
    setIsViewModalOpen(false)
  }

  const closeEditModal = () => {
    setSelectedOrder(null)
    setIsEditModalOpen(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_production': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter orders based on search term
  const filteredOrders = orders.filter(order =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders and track their status.</p>
        </div>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setIsNewModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>New Order</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No orders found matching your search.' : 'No orders found.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  console.log('Rendering order:', order)
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber || order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.customerName || 'Unknown Customer'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.totalItems || 0} items
                          {order.itemDetails && order.itemDetails.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {order.itemDetails.map((item, index) => (
                                <div key={index}>
                                  {item.quantity}x {item.productName}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{(order.totalAmount || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-primary-600 hover:text-primary-900 mr-3"
                          onClick={() => openViewModal(order)}
                        >
                          View
                        </button>
                        <button 
                          className="text-primary-600 hover:text-primary-900 mr-3"
                          onClick={() => openEditModal(order)}
                        >
                          Edit
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewOrderModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateOrder}
      />

      <ViewOrderModal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        order={selectedOrder}
      />

      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateOrder}
        order={selectedOrder}
      />
    </div>
  )
}

export default Orders 