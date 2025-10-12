import axios from 'axios'
import { auth } from '../config/supabase'
import { getApiBaseUrl } from '../utils/apiBaseUrl'

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false, // Changed to false since we're not using session cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Try to get token from localStorage first (for demo mode)
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`
        return config
      }
      
      // Fallback to Supabase auth
      const token = await auth.getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error getting auth token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Product API endpoints
export const productAPI = {
  // Get all products
  getProducts: () => api.get('/api/products'),
  
  // Create new product
  createProduct: (productData) => api.post('/api/products', productData),
  
  // Update product
  updateProduct: (id, productData) => api.put(`/api/products/${id}`, productData),
  
  // Delete product
  deleteProduct: (id) => api.delete(`/api/products/${id}`)
}

// Orders API endpoints
export const orderAPI = {
  // Get all orders
  getOrders: () => api.get('/api/orders'),
  
  // Create new order
  createOrder: (orderData) => api.post('/api/orders', orderData),
  
  // Update order
  updateOrder: (id, orderData) => api.put(`/api/orders/${id}`, orderData),
  
  // Delete order
  deleteOrder: (id) => api.delete(`/api/orders/${id}`)
}

// Customers API endpoints
export const customerAPI = {
  // Get all customers
  getCustomers: () => api.get('/api/customers'),
  
  // Create new customer
  createCustomer: (customerData) => api.post('/api/customers', customerData),
  
  // Update customer
  updateCustomer: (id, customerData) => api.put(`/api/customers/${id}`, customerData),
  
  // Delete customer
  deleteCustomer: (id) => api.delete(`/api/customers/${id}`)
} 

// Production API
export const productionAPI = {
  getProductionLogs: () => api.get('/api/production'),
  createProductionLog: (data) => api.post('/api/production', data),
  updateProductionLog: (id, data) => api.put(`/api/production/${id}`, data),
  deleteProductionLog: (id) => api.delete(`/api/production/${id}`)
}

// Raw Materials API
export const rawMaterialsAPI = {
  getRawMaterials: () => api.get('/api/raw-materials'),
  createRawMaterial: (data) => api.post('/api/raw-materials', data),
  updateRawMaterial: (id, data) => api.put(`/api/raw-materials/${id}`, data),
  deleteRawMaterial: (id) => api.delete(`/api/raw-materials/${id}`),
  checkAvailability: (productId, quantity) => api.get(`/api/raw-materials/check-availability?productId=${productId}&quantity=${quantity}`)
}

// Invoices API
export const invoiceAPI = {
  getInvoices: () => api.get('/api/invoices'),
  createInvoice: (data) => api.post('/api/invoices', data),
  updateInvoice: (id, data) => api.put(`/api/invoices/${id}`, data),
  deleteInvoice: (id) => api.delete(`/api/invoices/${id}`),
  generatePDF: (id) => api.get(`/api/invoices/${id}/generate-pdf`),
  downloadPDF: (id) => api.get(`/api/invoices/${id}/download`, {
    responseType: 'blob'
  })
} 