const { initializeFirebase, getFirestore } = require('../config/firebase')

class FirestoreService {
  constructor() {
    // Initialize Firebase first
    initializeFirebase()
    this.db = getFirestore()
  }

  // Generic CRUD operations
  async create(collection, data) {
    try {
      const docRef = await this.db.collection(collection).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return { id: docRef.id, ...data }
    } catch (error) {
      console.error(`Error creating document in ${collection}:`, error)
      throw error
    }
  }

  async getById(collection, id) {
    try {
      const doc = await this.db.collection(collection).doc(id).get()
      if (!doc.exists) {
        return null
      }
      return { id: doc.id, ...doc.data() }
    } catch (error) {
      console.error(`Error getting document from ${collection}:`, error)
      throw error
    }
  }

  async getAll(collection, orderBy = 'createdAt', orderDirection = 'desc') {
    try {
      const snapshot = await this.db.collection(collection)
        .orderBy(orderBy, orderDirection)
        .get()
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error(`Error getting all documents from ${collection}:`, error)
      throw error
    }
  }

  async update(collection, id, data) {
    try {
      await this.db.collection(collection).doc(id).update({
        ...data,
        updatedAt: new Date()
      })
      return { id, ...data }
    } catch (error) {
      console.error(`Error updating document in ${collection}:`, error)
      throw error
    }
  }

  async delete(collection, id) {
    try {
      await this.db.collection(collection).doc(id).delete()
      return { id }
    } catch (error) {
      console.error(`Error deleting document from ${collection}:`, error)
      throw error
    }
  }

  async query(collection, field, operator, value) {
    try {
      const snapshot = await this.db.collection(collection)
        .where(field, operator, value)
        .get()
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error(`Error querying ${collection}:`, error)
      throw error
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

module.exports = new FirestoreService()

