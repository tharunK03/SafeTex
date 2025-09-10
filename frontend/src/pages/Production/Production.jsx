import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { productionAPI } from '../../services/api'
import AddProductionLogModal from '../../components/AddProductionLogModal'
import EditProductionLogModal from '../../components/EditProductionLogModal'

const Production = () => {
  const [productionLogs, setProductionLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch production logs on component mount
  useEffect(() => {
    fetchProductionLogs()
  }, [])

  const fetchProductionLogs = async () => {
    try {
      setLoading(true)
      const response = await productionAPI.getProductionLogs()
      console.log('Production logs API response:', response.data)
      setProductionLogs(response.data.data || [])
      setError('')
    } catch (error) {
      console.error('Error fetching production logs:', error)
      setError('Failed to load production logs')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProductionLog = async (logData) => {
    try {
      const response = await productionAPI.createProductionLog(logData)
      setProductionLogs(prev => [response.data.data, ...prev])
      setError('')
      setSuccess('Production log created successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error creating production log:', error)
      throw error // Re-throw to let the modal handle the error
    }
  }

  const handleUpdateProductionLog = async (logId, logData) => {
    try {
      const response = await productionAPI.updateProductionLog(logId, logData)
      setProductionLogs(prev => prev.map(log => 
        log.id === logId ? response.data.data : log
      ))
      setError('')
      setSuccess('Production log updated successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error updating production log:', error)
      throw error // Re-throw to let the modal handle the error
    }
  }

  const handleDeleteProductionLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this production log?')) {
      return
    }

    try {
      await productionAPI.deleteProductionLog(logId)
      setProductionLogs(prev => prev.filter(log => log.id !== logId))
      setError('')
      setSuccess('Production log deleted successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error deleting production log:', error)
      setError('Failed to delete production log')
    }
  }

  const openEditModal = (log) => {
    setSelectedLog(log)
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setSelectedLog(null)
    setIsEditModalOpen(false)
  }

  // Filter production logs based on search term
  const filteredLogs = productionLogs.filter(log =>
    log.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production</h1>
          <p className="text-gray-600">Track production progress and manage manufacturing logs.</p>
        </div>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Add Production Log</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search production logs..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produced Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Loading production logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No production logs found matching your search.' : 'No production logs found.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  console.log('Rendering production log:', log)
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.orderNumber || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.customerName || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.date || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.producedQty || 0}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{log.notes || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-primary-600 hover:text-primary-900 mr-3"
                          onClick={() => openEditModal(log)}
                        >
                          Edit
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteProductionLog(log.id)}
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

      <AddProductionLogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddProductionLog}
      />

      <EditProductionLogModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateProductionLog}
        productionLog={selectedLog}
      />
    </div>
  )
}

export default Production 