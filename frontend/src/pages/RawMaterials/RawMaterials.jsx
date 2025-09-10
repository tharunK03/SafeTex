import { useState, useEffect } from 'react'
import { Plus, Search, Filter, AlertTriangle } from 'lucide-react'
import { rawMaterialsAPI } from '../../services/api'
import AddRawMaterialModal from '../../components/AddRawMaterialModal'
import EditRawMaterialModal from '../../components/EditRawMaterialModal'

const RawMaterials = () => {
  const [rawMaterials, setRawMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch raw materials on component mount
  useEffect(() => {
    fetchRawMaterials()
  }, [])

  const fetchRawMaterials = async () => {
    try {
      setLoading(true)
      const response = await rawMaterialsAPI.getRawMaterials()
      console.log('Raw materials API response:', response.data)
      setRawMaterials(response.data.data || [])
      setError('')
    } catch (error) {
      console.error('Error fetching raw materials:', error)
      setError('Failed to load raw materials')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRawMaterial = async (materialData) => {
    try {
      const response = await rawMaterialsAPI.createRawMaterial(materialData)
      setRawMaterials(prev => [response.data.data, ...prev])
      setError('')
      setSuccess('Raw material added successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error adding raw material:', error)
      throw error // Re-throw to let the modal handle the error
    }
  }

  const handleUpdateRawMaterial = async (materialId, materialData) => {
    try {
      const response = await rawMaterialsAPI.updateRawMaterial(materialId, materialData)
      setRawMaterials(prev => prev.map(material => 
        material.id === materialId ? response.data.data : material
      ))
      setError('')
      setSuccess('Raw material updated successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error updating raw material:', error)
      throw error // Re-throw to let the modal handle the error
    }
  }

  const handleDeleteRawMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this raw material?')) {
      return
    }

    try {
      await rawMaterialsAPI.deleteRawMaterial(materialId)
      setRawMaterials(prev => prev.filter(material => material.id !== materialId))
      setError('')
      setSuccess('Raw material deleted successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error deleting raw material:', error)
      setError('Failed to delete raw material')
    }
  }

  const openEditModal = (material) => {
    setSelectedMaterial(material)
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setSelectedMaterial(null)
    setIsEditModalOpen(false)
  }

  const getStockStatus = (currentStock, minStockLevel) => {
    if (currentStock <= 0) return 'out-of-stock'
    if (currentStock <= minStockLevel) return 'low-stock'
    return 'in-stock'
  }

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out-of-stock': return 'bg-red-100 text-red-800'
      case 'low-stock': return 'bg-yellow-100 text-yellow-800'
      case 'in-stock': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter raw materials based on search term
  const filteredMaterials = rawMaterials.filter(material =>
    material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raw Materials</h1>
          <p className="text-gray-600">Manage raw materials inventory and track availability for production.</p>
        </div>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Add Raw Material</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search raw materials..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading raw materials...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No raw materials found matching your search.' : 'No raw materials found.'}
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => {
                  const stockStatus = getStockStatus(material.currentStock, material.minStockLevel)
                  return (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{material.name}</div>
                          {material.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">{material.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {material.currentStock} {material.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {material.minStockLevel} {material.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(stockStatus)}`}>
                          {stockStatus === 'out-of-stock' ? 'Out of Stock' :
                           stockStatus === 'low-stock' ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{material.costPerUnit?.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{material.supplier || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-primary-600 hover:text-primary-900 mr-3"
                          onClick={() => openEditModal(material)}
                        >
                          Edit
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteRawMaterial(material.id)}
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

      <AddRawMaterialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddRawMaterial}
      />

      <EditRawMaterialModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateRawMaterial}
        material={selectedMaterial}
      />
    </div>
  )
}

export default RawMaterials
