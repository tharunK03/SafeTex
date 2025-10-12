const axios = require('axios')

class FirestoreRestService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || 'safetex-749f9'
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`
  }

  // Helper method to convert document path to Firestore format
  getDocumentPath(collection, docId = null) {
    if (docId) {
      return `${this.baseUrl}/${collection}/${docId}`
    }
    return `${this.baseUrl}/${collection}`
  }

  // Helper method to convert Firestore document to our format
  convertDocument(doc) {
    if (!doc) return null
    
    const data = {}
    if (doc.fields) {
      for (const [key, value] of Object.entries(doc.fields)) {
        data[key] = this.convertValue(value)
      }
    }
    
    return {
      id: doc.name ? doc.name.split('/').pop() : null,
      ...data
    }
  }

  // Helper method to convert Firestore values
  convertValue(value) {
    if (value.stringValue !== undefined) return value.stringValue
    if (value.integerValue !== undefined) return parseInt(value.integerValue)
    if (value.doubleValue !== undefined) return parseFloat(value.doubleValue)
    if (value.booleanValue !== undefined) return value.booleanValue
    if (value.arrayValue !== undefined) return value.arrayValue.values.map(v => this.convertValue(v))
    if (value.mapValue !== undefined) {
      const map = {}
      for (const [key, val] of Object.entries(value.mapValue.fields || {})) {
        map[key] = this.convertValue(val)
      }
      return map
    }
    return value
  }

  // Helper method to convert our data to Firestore format
  convertToFirestore(data) {
    const fields = {}
    for (const [key, value] of Object.entries(data)) {
      fields[key] = this.convertToFirestoreValue(value)
    }
    return { fields }
  }

  convertToFirestoreValue(value) {
    if (typeof value === 'string') return { stringValue: value }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return { integerValue: value.toString() }
      return { doubleValue: value }
    }
    if (typeof value === 'boolean') return { booleanValue: value }
    if (Array.isArray(value)) {
      return { arrayValue: { values: value.map(v => this.convertToFirestoreValue(v)) } }
    }
    if (typeof value === 'object' && value !== null) {
      const map = {}
      for (const [key, val] of Object.entries(value)) {
        map[key] = this.convertToFirestoreValue(val)
      }
      return { mapValue: { fields: map } }
    }
    return { stringValue: String(value) }
  }

  // Generic CRUD operations
  async create(collection, data) {
    try {
      const docData = this.convertToFirestore({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      const response = await axios.post(this.getDocumentPath(collection), docData)
      return this.convertDocument(response.data)
    } catch (error) {
      console.error(`Error creating document in ${collection}:`, error.response?.data || error.message)
      throw error
    }
  }

  async getById(collection, id) {
    try {
      const response = await axios.get(this.getDocumentPath(collection, id))
      return this.convertDocument(response.data)
    } catch (error) {
      if (error.response?.status === 404) {
        return null
      }
      console.error(`Error getting document from ${collection}:`, error.response?.data || error.message)
      throw error
    }
  }

  async getAll(collection, orderBy = 'createdAt', orderDirection = 'DESCENDING') {
    try {
      const response = await axios.get(this.getDocumentPath(collection), {
        params: {
          orderBy: orderBy,
          pageSize: 1000
        }
      })
      
      return response.data.documents?.map(doc => this.convertDocument(doc)) || []
    } catch (error) {
      console.error(`Error getting all documents from ${collection}:`, error.response?.data || error.message)
      return []
    }
  }

  async update(collection, id, data) {
    try {
      const docData = this.convertToFirestore({
        ...data,
        updatedAt: new Date().toISOString()
      })

      const response = await axios.patch(this.getDocumentPath(collection, id), docData, {
        params: { updateMask: 'fields' }
      })
      return this.convertDocument(response.data)
    } catch (error) {
      console.error(`Error updating document in ${collection}:`, error.response?.data || error.message)
      throw error
    }
  }

  async delete(collection, id) {
    try {
      await axios.delete(this.getDocumentPath(collection, id))
      return { id }
    } catch (error) {
      console.error(`Error deleting document from ${collection}:`, error.response?.data || error.message)
      throw error
    }
  }

  async query(collection, field, operator, value) {
    try {
      // For simplicity, we'll get all documents and filter client-side
      // In production, you'd want to use Firestore's query API
      const allDocs = await this.getAll(collection)
      return allDocs.filter(doc => {
        const docValue = doc[field]
        switch (operator) {
          case '==': return docValue === value
          case '!=': return docValue !== value
          case '>': return docValue > value
          case '>=': return docValue >= value
          case '<': return docValue < value
          case '<=': return docValue <= value
          default: return false
        }
      })
    } catch (error) {
      console.error(`Error querying ${collection}:`, error.response?.data || error.message)
      return []
    }
  }

  // Specific methods for SAFT ERP collections
  async createUser(userData) {
    return this.create('users', userData)
  }

  async getUserById(id) {
    return this.getById('users', id)
  }

  async getAllUsers() {
    return this.getAll('users')
  }

  async updateUser(id, userData) {
    return this.update('users', id, userData)
  }

  async deleteUser(id) {
    return this.delete('users', id)
  }

  // Customers
  async createCustomer(customerData) {
    return this.create('customers', customerData)
  }

  async getCustomerById(id) {
    return this.getById('customers', id)
  }

  async getAllCustomers() {
    return this.getAll('customers')
  }

  async updateCustomer(id, customerData) {
    return this.update('customers', id, customerData)
  }

  async deleteCustomer(id) {
    return this.delete('customers', id)
  }

  // Products
  async createProduct(productData) {
    return this.create('products', productData)
  }

  async getProductById(id) {
    return this.getById('products', id)
  }

  async getAllProducts() {
    return this.getAll('products')
  }

  async updateProduct(id, productData) {
    return this.update('products', id, productData)
  }

  async deleteProduct(id) {
    return this.delete('products', id)
  }

  // Orders
  async createOrder(orderData) {
    return this.create('orders', orderData)
  }

  async getOrderById(id) {
    return this.getById('orders', id)
  }

  async getAllOrders() {
    return this.getAll('orders')
  }

  async updateOrder(id, orderData) {
    return this.update('orders', id, orderData)
  }

  async deleteOrder(id) {
    return this.delete('orders', id)
  }

  // Order Items
  async createOrderItem(orderItemData) {
    return this.create('orderItems', orderItemData)
  }

  async getOrderItemsByOrderId(orderId) {
    return this.query('orderItems', 'orderId', '==', orderId)
  }

  async updateOrderItem(id, orderItemData) {
    return this.update('orderItems', id, orderItemData)
  }

  async deleteOrderItem(id) {
    return this.delete('orderItems', id)
  }

  // Raw Materials
  async createRawMaterial(rawMaterialData) {
    return this.create('rawMaterials', rawMaterialData)
  }

  async getRawMaterialById(id) {
    return this.getById('rawMaterials', id)
  }

  async getAllRawMaterials() {
    return this.getAll('rawMaterials')
  }

  async updateRawMaterial(id, rawMaterialData) {
    return this.update('rawMaterials', id, rawMaterialData)
  }

  async deleteRawMaterial(id) {
    return this.delete('rawMaterials', id)
  }

  // Production Logs
  async createProductionLog(productionLogData) {
    return this.create('productionLogs', productionLogData)
  }

  async getProductionLogById(id) {
    return this.getById('productionLogs', id)
  }

  async getAllProductionLogs() {
    return this.getAll('productionLogs')
  }

  async updateProductionLog(id, productionLogData) {
    return this.update('productionLogs', id, productionLogData)
  }

  async deleteProductionLog(id) {
    return this.delete('productionLogs', id)
  }

  // Invoices
  async createInvoice(invoiceData) {
    return this.create('invoices', invoiceData)
  }

  async getInvoiceById(id) {
    return this.getById('invoices', id)
  }

  async getAllInvoices() {
    return this.getAll('invoices')
  }

  async updateInvoice(id, invoiceData) {
    return this.update('invoices', id, invoiceData)
  }

  async deleteInvoice(id) {
    return this.delete('invoices', id)
  }

  // Generate unique order number
  async generateOrderNumber() {
    try {
      const orders = await this.getAll('orders')
      const orderNumbers = orders
        .map(order => order.orderNumber)
        .filter(number => number && number.startsWith('SAFT-'))
        .map(number => parseInt(number.replace('SAFT-', '')))
        .filter(number => !isNaN(number))
      
      const maxNumber = orderNumbers.length > 0 ? Math.max(...orderNumbers) : 0
      const nextNumber = maxNumber + 1
      
      return `SAFT-${String(nextNumber).padStart(5, '0')}`
    } catch (error) {
      console.error('Error generating order number:', error)
      return `SAFT-${String(Date.now()).slice(-5)}`
    }
  }

  // Generate unique invoice number
  async generateInvoiceNumber() {
    try {
      const invoices = await this.getAll('invoices')
      const invoiceNumbers = invoices
        .map(invoice => invoice.invoiceNumber)
        .filter(number => number && number.startsWith('INV-'))
        .map(number => parseInt(number.replace('INV-', '')))
        .filter(number => !isNaN(number))
      
      const maxNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 0
      const nextNumber = maxNumber + 1
      
      return `INV-${String(nextNumber).padStart(5, '0')}`
    } catch (error) {
      console.error('Error generating invoice number:', error)
      return `INV-${String(Date.now()).slice(-5)}`
    }
  }
}

module.exports = new FirestoreRestService()
