import React from 'react'
import { useSelector } from 'react-redux'

const RoleBasedAccess = ({ children, requiredPermission, requiredRole, fallback = null }) => {
  const { user } = useSelector((state) => state.auth)

  // Check if specific role is required
  if (requiredRole && user?.role !== requiredRole) {
    return fallback
  }

  // Check if specific permission is required
  if (requiredPermission) {
    const hasPermission = checkPermission(user?.role, requiredPermission)
    if (!hasPermission) {
      return fallback
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

export default RoleBasedAccess








