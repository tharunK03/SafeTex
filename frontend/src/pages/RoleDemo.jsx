import { useSelector } from 'react-redux'
import { 
  Shield, 
  Factory, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  Settings,
  FileText,
  ShoppingCart,
  Package
} from 'lucide-react'
import RoleBasedAccess from '../components/RoleBasedAccess'
import { getUserRoleDisplayName, ROLES } from '../store/slices/authSlice'

const RoleDemo = () => {
  const { user } = useSelector((state) => state.auth)

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-6 w-6 text-red-600" />
      case 'production_manager':
        return <Factory className="h-6 w-6 text-blue-600" />
      case 'sales':
        return <Users className="h-6 w-6 text-green-600" />
      default:
        return <Shield className="h-6 w-6 text-gray-600" />
    }
  }

  const permissions = [
    {
      name: 'Dashboard',
      icon: BarChart3,
      description: 'View dashboard and analytics',
      admin: true,
      production_manager: true,
      sales: true
    },
    {
      name: 'Customers',
      icon: Users,
      description: 'Manage customer information',
      admin: true,
      production_manager: false,
      sales: true
    },
    {
      name: 'Products',
      icon: Package,
      description: 'Manage product catalog',
      admin: true,
      production_manager: false,
      sales: true
    },
    {
      name: 'Orders',
      icon: ShoppingCart,
      description: 'Process and manage orders',
      admin: true,
      production_manager: false,
      sales: true
    },
    {
      name: 'Production',
      icon: Factory,
      description: 'Monitor production processes',
      admin: true,
      production_manager: true,
      sales: false
    },
    {
      name: 'Invoices',
      icon: FileText,
      description: 'Generate and manage invoices',
      admin: true,
      production_manager: false,
      sales: true
    },
    {
      name: 'Reports',
      icon: BarChart3,
      description: 'Access detailed reports',
      admin: true,
      production_manager: false,
      sales: false
    },
    {
      name: 'Settings',
      icon: Settings,
      description: 'System configuration',
      admin: true,
      production_manager: false,
      sales: false
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        {getRoleIcon(user?.role)}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role-Based Access Control Demo</h1>
          <p className="text-gray-600">
            Current Role: <span className="font-semibold">{getUserRoleDisplayName(user?.role)}</span>
          </p>
        </div>
      </div>

      {/* Role Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold">Administrator</h3>
          </div>
          <p className="text-gray-600 mb-3">Full access to all system features and analytics.</p>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>All permissions</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>System configuration</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>User management</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Factory className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Production Manager</h3>
          </div>
          <p className="text-gray-600 mb-3">View production and update manufacturing logs.</p>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>Production monitoring</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>Process updates</span>
            </div>
            <div className="flex items-center text-sm">
              <XCircle className="h-4 w-4 text-red-500 mr-2" />
              <span>No sales access</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Sales</h3>
          </div>
          <p className="text-gray-600 mb-3">Manage customers, orders, and invoices.</p>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>Customer management</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>Order processing</span>
            </div>
            <div className="flex items-center text-sm">
              <XCircle className="h-4 w-4 text-red-500 mr-2" />
              <span>No production access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Production Manager
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.map((permission) => (
                <tr key={permission.name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <permission.icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                        <div className="text-sm text-gray-500">{permission.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {permission.admin ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {permission.production_manager ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {permission.sales ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Specific Content Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Only Content */}
        <RoleBasedAccess requiredPermission="settings" fallback={
          <div className="card border-2 border-dashed border-gray-300">
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Only</h3>
              <p className="text-gray-500">This content is only visible to administrators.</p>
            </div>
          </div>
        }>
          <div className="card bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Admin Dashboard</h3>
            </div>
            <p className="text-red-700 mb-4">This is admin-only content. You have full system access.</p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-red-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>System configuration</span>
              </div>
              <div className="flex items-center text-sm text-red-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>User management</span>
              </div>
              <div className="flex items-center text-sm text-red-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Advanced reports</span>
              </div>
            </div>
          </div>
        </RoleBasedAccess>

        {/* Production Manager Content */}
        <RoleBasedAccess requiredPermission="production" fallback={
          <div className="card border-2 border-dashed border-gray-300">
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Production Only</h3>
              <p className="text-gray-500">This content is only visible to production managers.</p>
            </div>
          </div>
        }>
          <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <Factory className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Production Overview</h3>
            </div>
            <p className="text-blue-700 mb-4">This is production manager content. You can monitor production processes.</p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-blue-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Production monitoring</span>
              </div>
              <div className="flex items-center text-sm text-blue-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Process updates</span>
              </div>
              <div className="flex items-center text-sm text-blue-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Quality control</span>
              </div>
            </div>
          </div>
        </RoleBasedAccess>

        {/* Sales Content */}
        <RoleBasedAccess requiredPermission="customers" fallback={
          <div className="card border-2 border-dashed border-gray-300">
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sales Only</h3>
              <p className="text-gray-500">This content is only visible to sales users.</p>
            </div>
          </div>
        }>
          <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Sales Dashboard</h3>
            </div>
            <p className="text-green-700 mb-4">This is sales content. You can manage customers and orders.</p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Customer management</span>
              </div>
              <div className="flex items-center text-sm text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Order processing</span>
              </div>
              <div className="flex items-center text-sm text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Invoice generation</span>
              </div>
            </div>
          </div>
        </RoleBasedAccess>

        {/* Shared Content */}
        <div className="card bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900">Shared Dashboard</h3>
          </div>
          <p className="text-purple-700 mb-4">This content is visible to all authenticated users.</p>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-purple-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Basic analytics</span>
            </div>
            <div className="flex items-center text-sm text-purple-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Notifications</span>
            </div>
            <div className="flex items-center text-sm text-purple-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Profile management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">How to Test Different Roles</h3>
            <p className="text-yellow-700 mb-3">
              To test different roles, log out and log back in with a different role selection on the login page.
            </p>
            <div className="space-y-1 text-sm text-yellow-700">
              <p>• <strong>Admin:</strong> Full access to all features</p>
              <p>• <strong>Production Manager:</strong> Access to production and dashboard only</p>
              <p>• <strong>Sales:</strong> Access to customers, orders, invoices, and dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleDemo
