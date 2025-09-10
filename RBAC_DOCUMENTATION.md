# 🔐 Role-Based Access Control (RBAC) Documentation

## Overview

The Saft ERP system implements a comprehensive two-layer role-based access control system:

1. **Application-Level Roles** - Business logic permissions
2. **Database-Level Security** - Row Level Security (RLS) policies

## 🎯 **Role Definitions**

### **1. Admin Role**
- **Name**: System Administrator
- **Description**: Full access to all system features
- **Permissions**: All CRUD operations on all resources

### **2. Sales Role**
- **Name**: Sales Representative
- **Description**: Manage customers, orders, and invoices
- **Permissions**:
  - ✅ Customers: Create, Read, Update
  - ✅ Orders: Create, Read, Update, Delete
  - ✅ Invoices: Create, Read, Update, Delete
  - ✅ Products: Read only
  - ✅ Production: Read only
  - ✅ Reports: Read only
  - ❌ Settings: No access
  - ❌ User Management: Read only

### **3. Production Manager Role**
- **Name**: Production Manager
- **Description**: Manage production logs and assigned orders
- **Permissions**:
  - ✅ Production: Create, Read, Update, Delete
  - ✅ Orders: Read, Update (status changes)
  - ✅ Customers: Read only
  - ✅ Products: Read only
  - ✅ Invoices: Read only
  - ✅ Reports: Read only
  - ❌ Settings: No access
  - ❌ User Management: Read only

## 🔧 **Implementation Details**

### **Application-Level Security**

#### **Permission Checking**
```javascript
// Check if user has permission for specific action
const hasPermission = (userRole, resource, action) => {
  const permissions = ROLE_PERMISSIONS[userRole]?.permissions[resource] || []
  return permissions.includes(action)
}
```

#### **Middleware Usage**
```javascript
// Require specific permission
router.get('/customers', requirePermission('customers', 'read'), async (req, res) => {
  // Only users with 'read' permission on 'customers' can access
})

// Require specific role
router.post('/users', requireRole([ROLES.ADMIN]), async (req, res) => {
  // Only admin users can access
})
```

### **Database-Level Security (RLS)**

#### **Row Level Security Policies**
```sql
-- Example: Customers table policies
CREATE POLICY "Authenticated users can view customers" ON customers
  FOR SELECT USING (auth.role() IN ('admin', 'sales', 'production_manager'));

CREATE POLICY "Sales and admin can manage customers" ON customers
  FOR ALL USING (auth.role() IN ('admin', 'sales'));
```

#### **Policy Categories**
1. **Users Table**: Users can only see/update their own profile
2. **Customers Table**: All roles can read, admin/sales can manage
3. **Products Table**: All roles can read, only admin can manage
4. **Orders Table**: All roles can read, admin/sales can create, all can update
5. **Production Table**: All roles can read, admin/production can manage
6. **Invoices Table**: All roles can read, admin/sales can manage

## 📋 **API Endpoints with RBAC**

### **User Management** (`/api/users`)
- `GET /` - Admin only
- `GET /me` - All authenticated users
- `POST /` - Admin only
- `PUT /:id` - Admin only
- `PUT /me` - All authenticated users
- `DELETE /:id` - Admin only
- `GET /roles` - All authenticated users

### **Customer Management** (`/api/customers-pg`)
- `GET /` - Admin, Sales, Production Manager
- `POST /` - Admin, Sales
- `GET /:id` - Admin, Sales, Production Manager
- `PUT /:id` - Admin, Sales
- `DELETE /:id` - Admin only

### **Product Management** (`/api/products`)
- `GET /` - All roles (read only)
- `POST /` - Admin only
- `PUT /:id` - Admin only
- `DELETE /:id` - Admin only

### **Order Management** (`/api/orders`)
- `GET /` - All roles
- `POST /` - Admin, Sales
- `PUT /:id` - Admin, Sales, Production Manager
- `DELETE /:id` - Admin only

### **Production Management** (`/api/production`)
- `GET /` - All roles
- `POST /` - Admin, Production Manager
- `PUT /:id` - Admin, Production Manager
- `DELETE /:id` - Admin only

### **Invoice Management** (`/api/invoices`)
- `GET /` - All roles
- `POST /` - Admin, Sales
- `PUT /:id` - Admin, Sales
- `DELETE /:id` - Admin only

## 🧪 **Testing RBAC**

### **Run RBAC Tests**
```bash
cd backend
node test-rbac.js
```

### **Test Cases Covered**
1. ✅ Database connection and RLS initialization
2. ✅ Test user creation with different roles
3. ✅ Permission checking for all role/resource combinations
4. ✅ Role information retrieval
5. ✅ Database-level permission testing

### **Expected Test Results**
```
🔐 Testing Role-Based Access Control...

1️⃣ Testing database connection...
✅ Database connection successful

2️⃣ Initializing database with RLS policies...
✅ Database initialized with RLS policies

3️⃣ Creating test users with different roles...
✅ Created admin user: admin@saft.com
✅ Created sales user: sales@saft.com
✅ Created production_manager user: production@saft.com

4️⃣ Testing role permissions...
✅ admin can create customers: true
✅ admin can delete customers: true
✅ sales can create customers: true
✅ sales can delete customers: false
✅ production_manager can create customers: false
✅ production_manager can create production: true
```

## 🔐 **Security Features**

### **1. Application-Level Security**
- **Permission-based middleware**: Checks user permissions before allowing access
- **Role-based middleware**: Restricts endpoints to specific roles
- **Input validation**: Validates all user inputs
- **Error handling**: Secure error messages without exposing internals

### **2. Database-Level Security**
- **Row Level Security (RLS)**: Database-enforced access control
- **Policy-based access**: Granular permissions per table
- **User isolation**: Users can only access their own data
- **Role-based policies**: Different access levels per role

### **3. Authentication Integration**
- **Firebase Authentication**: Secure user authentication
- **JWT token verification**: Validates user sessions
- **Role synchronization**: Syncs Firebase auth with database roles
- **Session management**: Secure session handling

## 🚀 **Usage Examples**

### **Frontend Permission Checking**
```javascript
// Check if user can perform action
const canCreateCustomer = hasPermission(userRole, 'customers', 'create')
const canDeleteCustomer = hasPermission(userRole, 'customers', 'delete')

// Show/hide UI elements based on permissions
{canCreateCustomer && <button>Add Customer</button>}
{canDeleteCustomer && <button>Delete Customer</button>}
```

### **API Permission Checking**
```javascript
// In route handlers
router.post('/customers', requirePermission('customers', 'create'), async (req, res) => {
  // Only users with 'create' permission on 'customers' can access
  // req.user.role contains the user's role
})
```

### **Database Query with RLS**
```javascript
// RLS automatically filters results based on user role
const customers = await db.getMany(`
  SELECT * FROM customers WHERE status = 'active'
`)
// Results automatically filtered by RLS policies
```

## 🔄 **Role Management**

### **Creating Users with Roles**
```javascript
// Admin creates new user
const newUser = await db.insert(`
  INSERT INTO users (firebase_uid, email, display_name, role)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`, [firebaseUid, email, displayName, 'sales'])
```

### **Updating User Roles**
```javascript
// Admin updates user role
const updatedUser = await db.update(`
  UPDATE users 
  SET role = $1, updated_at = CURRENT_TIMESTAMP
  WHERE id = $2
  RETURNING *
`, ['production_manager', userId])
```

### **Getting User Permissions**
```javascript
// Get user's role permissions
const userRole = req.user.role
const permissions = getRolePermissions(userRole)
console.log(permissions.customers) // ['create', 'read', 'update']
```

## 🛡️ **Security Best Practices**

### **1. Principle of Least Privilege**
- Users get minimum permissions needed for their role
- Regular review of permissions
- Temporary elevation when needed

### **2. Defense in Depth**
- Multiple layers of security (app + database)
- Input validation at all levels
- Secure error handling

### **3. Audit and Monitoring**
- Log all permission checks
- Monitor failed access attempts
- Regular security reviews

### **4. Data Protection**
- Encrypt sensitive data
- Use parameterized queries
- Implement proper session management

## 📞 **Support and Troubleshooting**

### **Common Issues**

#### **1. Permission Denied Errors**
```
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "You don't have permission to create customers",
  "required": { "resource": "customers", "action": "create" },
  "current": { "role": "production_manager" }
}
```

**Solution**: Check user role and required permissions

#### **2. RLS Policy Violations**
```
{
  "success": false,
  "error": "Row Level Security policy violation"
}
```

**Solution**: Verify RLS policies are correctly configured

#### **3. Role Not Found**
```
{
  "success": false,
  "error": "User role not found"
}
```

**Solution**: Ensure user exists in database with proper role

### **Debug Steps**
1. Check user authentication status
2. Verify user role in database
3. Test permission checking logic
4. Review RLS policies
5. Check API endpoint permissions

## 🎯 **Next Steps**

### **Enhancements**
- [ ] Add role-based UI components
- [ ] Implement permission caching
- [ ] Add audit logging
- [ ] Create role management interface
- [ ] Add temporary permission elevation

### **Monitoring**
- [ ] Set up permission usage analytics
- [ ] Monitor failed access attempts
- [ ] Create security dashboards
- [ ] Implement automated alerts

Your RBAC system is now fully implemented and tested! 🎉








