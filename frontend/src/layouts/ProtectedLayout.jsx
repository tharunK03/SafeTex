import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import { logout } from '../store/slices/authSlice'
import RoleBadge from '../components/RoleBadge'
import { 
  Home, 
  Users, 
  Package, 
  ShoppingCart, 
  Factory, 
  FileText, 
  BarChart3, 
  Bell, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User
} from 'lucide-react'

const ProtectedLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      dispatch(logout())
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home
    },
    { 
      name: 'Customers', 
      href: '/customers', 
      icon: Users
    },
    { 
      name: 'Products', 
      href: '/products', 
      icon: Package
    },
    { 
      name: 'Orders', 
      href: '/orders', 
      icon: ShoppingCart
    },
    { 
      name: 'Production', 
      href: '/production', 
      icon: Factory
    },
    { 
      name: 'Raw Materials', 
      href: '/raw-materials', 
      icon: Package
    },
    { 
      name: 'Invoices', 
      href: '/invoices', 
      icon: FileText
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: BarChart3
    },
    { 
      name: 'Notifications', 
      href: '/notifications', 
      icon: Bell
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Settings
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-gradient-to-b from-white to-gray-50 shadow-2xl">
          {/* Enhanced Mobile Header */}
          <div className="flex h-20 items-center justify-between px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold text-white">Saft ERP</h1>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Enhanced Mobile Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-all duration-200 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Mobile Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.displayName || user?.email}
                </p>
                <RoleBadge role={user?.role} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg">
          {/* Enhanced Desktop Header */}
          <div className="flex h-20 items-center px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-blue-600 font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Saft ERP</h1>
                <p className="text-blue-100 text-xs">Enterprise Resource Planning</p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Desktop Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-all duration-200 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                  {!isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-200"></div>
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Enhanced Desktop Footer */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.displayName || user?.email}
                </p>
                <RoleBadge role={user?.role} size="sm" />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main content */}
      <div className="lg:pl-72">
        {/* Enhanced Top navbar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="lg:hidden -m-2.5 p-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.displayName || user?.email}
                  </span>
                </div>
                <RoleBadge role={user?.role} size="sm" />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProtectedLayout 