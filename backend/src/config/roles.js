// Role-Based Access Control (RBAC) Configuration
// Handles both application-level and database-level permissions

const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  PRODUCTION_MANAGER: 'production_manager'
}

// Application-level permissions for each role
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    name: 'System Administrator',
    description: 'Full access to all system features',
    permissions: {
      // User Management
      users: ['create', 'read', 'update', 'delete'],
      
      // Customer Management
      customers: ['create', 'read', 'update', 'delete'],
      
      // Product Management
      products: ['create', 'read', 'update', 'delete'],
      
      // Order Management
      orders: ['create', 'read', 'update', 'delete'],
      
      // Production Management
      production: ['create', 'read', 'update', 'delete'],
      
      // Invoice Management
      invoices: ['create', 'read', 'update', 'delete'],
      
      // Reports & Analytics
      reports: ['create', 'read', 'update', 'delete'],
      
      // System Settings
      settings: ['create', 'read', 'update', 'delete']
    }
  },
  
  [ROLES.SALES]: {
    name: 'Sales Representative',
    description: 'Manage customers, orders, and invoices',
    permissions: {
      // User Management - Read only
      users: ['read'],
      
      // Customer Management - Create, read, update (no delete)
      customers: ['create', 'read', 'update'],
      
      // Product Management - Read only
      products: ['read'],
      
      // Order Management - Full access
      orders: ['create', 'read', 'update', 'delete'],
      
      // Production Management - Read only
      production: ['read'],
      
      // Invoice Management - Full access
      invoices: ['create', 'read', 'update', 'delete'],
      
      // Reports & Analytics - Read only
      reports: ['read'],
      
      // System Settings - No access
      settings: []
    }
  },
  
  [ROLES.PRODUCTION_MANAGER]: {
    name: 'Production Manager',
    description: 'Manage production logs and assigned orders',
    permissions: {
      // User Management - Read only
      users: ['read'],
      
      // Customer Management - Read only
      customers: ['read'],
      
      // Product Management - Read only
      products: ['read'],
      
      // Order Management - Read and update status
      orders: ['read', 'update'],
      
      // Production Management - Full access
      production: ['create', 'read', 'update', 'delete'],
      
      // Invoice Management - Read only
      invoices: ['read'],
      
      // Reports & Analytics - Read only
      reports: ['read'],
      
      // System Settings - No access
      settings: []
    }
  }
}

// Database-level Row Level Security (RLS) policies
const RLS_POLICIES = {
  // Users table policies
  users: {
    // Users can only see their own profile
    select: "auth.uid() = firebase_uid",
    insert: "auth.uid() = firebase_uid",
    update: "auth.uid() = firebase_uid",
    delete: "role = 'admin' AND auth.uid() = firebase_uid"
  },
  
  // Customers table policies
  customers: {
    // All authenticated users can read customers
    select: "auth.role() IN ('admin', 'sales', 'production_manager')",
    // Only admin and sales can create/update customers
    insert: "auth.role() IN ('admin', 'sales')",
    update: "auth.role() IN ('admin', 'sales')",
    delete: "auth.role() = 'admin'"
  },
  
  // Products table policies
  products: {
    // All authenticated users can read products
    select: "auth.role() IN ('admin', 'sales', 'production_manager')",
    // Only admin can manage products
    insert: "auth.role() = 'admin'",
    update: "auth.role() = 'admin'",
    delete: "auth.role() = 'admin'"
  },
  
  // Orders table policies
  orders: {
    // All authenticated users can read orders
    select: "auth.role() IN ('admin', 'sales', 'production_manager')",
    // Admin and sales can create orders
    insert: "auth.role() IN ('admin', 'sales')",
    // Admin, sales, and production can update orders
    update: "auth.role() IN ('admin', 'sales', 'production_manager')",
    delete: "auth.role() = 'admin'"
  },
  
  // Production logs table policies
  production_logs: {
    // All authenticated users can read production logs
    select: "auth.role() IN ('admin', 'sales', 'production_manager')",
    // Admin and production manager can create logs
    insert: "auth.role() IN ('admin', 'production_manager')",
    // Admin and production manager can update logs
    update: "auth.role() IN ('admin', 'production_manager')",
    delete: "auth.role() = 'admin'"
  },
  
  // Invoices table policies
  invoices: {
    // All authenticated users can read invoices
    select: "auth.role() IN ('admin', 'sales', 'production_manager')",
    // Only admin and sales can manage invoices
    insert: "auth.role() IN ('admin', 'sales')",
    update: "auth.role() IN ('admin', 'sales')",
    delete: "auth.role() = 'admin'"
  }
}

// Helper functions for role checking
const hasPermission = (userRole, resource, action) => {
  if (!userRole || !ROLE_PERMISSIONS[userRole]) {
    return false
  }
  
  const permissions = ROLE_PERMISSIONS[userRole].permissions[resource] || []
  return permissions.includes(action)
}

const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || null
}

const getAllRoles = () => {
  return Object.keys(ROLE_PERMISSIONS).map(role => ({
    id: role,
    ...ROLE_PERMISSIONS[role]
  }))
}

// Middleware for checking permissions
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'user'
    
    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `You don't have permission to ${action} ${resource}`,
        required: { resource, action },
        current: { role: userRole }
      })
    }
    
    next()
  }
}

// Middleware for checking if user has any of the required roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'user'
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
        required: { roles: allowedRoles },
        current: { role: userRole }
      })
    }
    
    next()
  }
}

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  RLS_POLICIES,
  hasPermission,
  getRolePermissions,
  getAllRoles,
  requirePermission,
  requireRole
}
