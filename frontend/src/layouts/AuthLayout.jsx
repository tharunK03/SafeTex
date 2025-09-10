import { Link } from 'react-router-dom'

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary-600">Saft ERP</h1>
            <p className="text-gray-600 mt-2">Enterprise Resource Planning System</p>
          </Link>
        </div>
        
        <div className="card">
          {children}
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            © 2024 Saft ERP. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout 