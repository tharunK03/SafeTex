import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if specific role is required
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required role: {requiredRole} | Your role: {user?.role || 'none'}
          </p>
        </div>
      </div>
    )
  }

  // Check if specific permission is required
  if (requiredPermission) {
    // Simple permission check - you can enhance this based on your needs
    const hasPermission = checkPermission(user?.role, requiredPermission)
    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Required permission: {requiredPermission}
            </p>
          </div>
        </div>
      )
    }
  }

  return children
}

// Simple permission checking function
const checkPermission = (userRole, requiredPermission) => {
  const permissions = {
    admin: ['dashboard', 'customers', 'products', 'orders', 'production', 'invoices', 'reports', 'settings'],
    sales: ['dashboard', 'customers', 'orders', 'invoices', 'reports'],
    production_manager: ['dashboard', 'orders', 'production', 'reports'],
    user: ['dashboard']
  }

  return permissions[userRole]?.includes(requiredPermission) || false
}

export default ProtectedRoute
