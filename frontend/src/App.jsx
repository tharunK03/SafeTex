import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { auth } from './config/supabase'
import { setUser, setLoading } from './store/slices/authSlice'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import ProtectedLayout from './layouts/ProtectedLayout'

// Components

// Auth Pages
import Login from './pages/Auth/Login'
import ResetPassword from './pages/Auth/ResetPassword'

// Protected Pages
import Dashboard from './pages/Dashboard/Dashboard'
import Customers from './pages/Customers/Customers'
import Products from './pages/Products/Products'
import Orders from './pages/Orders/Orders'
import Production from './pages/Production/Production'
import RawMaterials from './pages/RawMaterials/RawMaterials'
import Invoices from './pages/Invoices/Invoices'
import Reports from './pages/Reports/Reports'
import Notifications from './pages/Notifications/Notifications'
import Settings from './pages/Settings/Settings'
import RoleDemo from './pages/RoleDemo'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)

  // Role-based redirect function
  const getRoleBasedRedirect = (role) => {
    switch (role) {
      case 'admin':
        return '/dashboard'
      case 'sales':
        return '/orders'
      case 'production_manager':
        return '/production'
      default:
        return '/dashboard'
    }
  }

  useEffect(() => {
    // Check for stored token on app load
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('auth_token')
      
      if (storedToken) {
        try {
          // Auto-detect API URL based on current hostname
          const getApiBaseUrl = () => {
            if (import.meta.env.VITE_API_URL) {
              return import.meta.env.VITE_API_URL
            }
            const hostname = window.location.hostname
            
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
              // Local development - use localhost backend
              return 'http://localhost:5000'
            } else if (hostname === 'safetexenterprises.vercel.app') {
              // Production Vercel frontend - use Render backend
              return 'https://safetex-1.onrender.com'
            } else {
              // Fallback for other domains
              return 'https://safetex-1.onrender.com'
            }
          }
          
          // Verify token with backend
          const response = await fetch(`${getApiBaseUrl()}/api/users/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const userData = await response.json()
            dispatch(setUser({
              uid: userData.data.id,
              email: userData.data.email,
              displayName: userData.data.display_name,
              role: userData.data.role,
            }))
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token')
            dispatch(setUser(null))
          }
        } catch (error) {
          console.error('Error verifying token:', error)
          localStorage.removeItem('auth_token')
          dispatch(setUser(null))
        }
      } else {
        dispatch(setUser(null))
      }
      dispatch(setLoading(false))
    }

    checkAuthStatus()
  }, [dispatch])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={
        !isAuthenticated ? (
          <AuthLayout>
            <Login />
          </AuthLayout>
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />
      <Route path="/reset-password" element={
        !isAuthenticated ? (
          <AuthLayout>
            <ResetPassword />
          </AuthLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Protected Routes */}
      <Route path="/" element={
        isAuthenticated ? (
          <Navigate to={getRoleBasedRedirect(user?.role)} replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/dashboard" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/customers" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <Customers />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/products" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <Products />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/orders" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <Orders />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/production" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <Production />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/raw-materials" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <RawMaterials />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/invoices" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <Invoices />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/reports" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <Reports />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/notifications" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <Notifications />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/settings" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <Settings />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Role Demo Route */}
      <Route path="/role-demo" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <RoleDemo />
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App 