import React from 'react'

const RoleBadge = ({ role, size = 'md' }) => {
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'sales':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'production_manager':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'worker':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleDisplayName = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Admin'
      case 'sales':
        return 'Sales'
      case 'production_manager':
        return 'Production Manager'
      case 'worker':
        return 'Worker'
      default:
        return role || 'User'
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(role)} ${sizeClasses[size]}`}>
      {getRoleDisplayName(role)}
    </span>
  )
}

export default RoleBadge
