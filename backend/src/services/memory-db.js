// Simple in-memory database for demonstration
// In production, this would be replaced with a real database

class MemoryDatabase {
  constructor() {
    this.data = {
      users: [],
      customers: [],
      products: [],
      orders: [],
      orderItems: [],
      rawMaterials: [],
      productionLogs: [],
      invoices: []
    }
    this.counters = {
      orders: 0,
      invoices: 0
    }
  }

  // Generic CRUD operations
  async create(collection, data) {
    const id = this.generateId()
    const document = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.data[collection].push(document)
    return document
  }

  async getById(collection, id) {
    return this.data[collection].find(doc => doc.id === id) || null
  }

  async getAll(collection) {
    return [...this.data[collection]]
  }

  async update(collection, id, data) {
    const index = this.data[collection].findIndex(doc => doc.id === id)
    if (index === -1) {
      throw new Error(`Document with id ${id} not found`)
    }
    
    this.data[collection][index] = {
      ...this.data[collection][index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    return this.data[collection][index]
  }

  async delete(collection, id) {
    const index = this.data[collection].findIndex(doc => doc.id === id)
    if (index === -1) {
      throw new Error(`Document with id ${id} not found`)
    }
    
    this.data[collection].splice(index, 1)
    return { id }
  }

  async query(collection, field, operator, value) {
    return this.data[collection].filter(doc => {
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
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9)
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
    this.counters.orders++
    return `SAFT-${String(this.counters.orders).padStart(5, '0')}`
  }

  // Generate unique invoice number
  async generateInvoiceNumber() {
    this.counters.invoices++
    return `INV-${String(this.counters.invoices).padStart(5, '0')}`
  }

  // Initialize with sample data
  async initializeSampleData() {
    console.log('📊 Initializing sample data...')
    
    // Create sample products
    await this.createProduct({
      name: 'Cotton T-Shirt',
      description: 'High quality cotton t-shirt',
      category: 'Apparel',
      sku: 'TSH-001',
      stockQty: 100,
      unitPrice: 25.99,
      lowStockThreshold: 10,
      status: 'active',
      createdBy: 'system'
    })

    await this.createProduct({
      name: 'Denim Jeans',
      description: 'Classic blue denim jeans',
      category: 'Apparel',
      sku: 'JNS-001',
      stockQty: 50,
      unitPrice: 49.99,
      lowStockThreshold: 5,
      status: 'active',
      createdBy: 'system'
    })

    // Create sample customers
    await this.createCustomer({
      name: 'ABC Clothing Store',
      contactPerson: 'John Smith',
      email: 'john@abclothing.com',
      phone: '+1-555-0123',
      address: '123 Main Street, New York, NY 10001',
      gstNo: 'GST123456789',
      status: 'active',
      createdBy: 'system'
    })

    await this.createCustomer({
      name: 'Fashion Forward',
      contactPerson: 'Jane Doe',
      email: 'jane@fashionforward.com',
      phone: '+1-555-0456',
      address: '456 Fashion Ave, Los Angeles, CA 90210',
      gstNo: 'GST987654321',
      status: 'active',
      createdBy: 'system'
    })

    // Create sample raw materials
    await this.createRawMaterial({
      name: 'Cotton Fabric',
      description: 'High quality cotton fabric',
      currentStock: 1000,
      unit: 'meters',
      minStockLevel: 100,
      costPerUnit: 5.50,
      supplier: 'Cotton Mills Inc',
      status: 'active',
      createdBy: 'system'
    })

    await this.createRawMaterial({
      name: 'Denim Fabric',
      description: 'Blue denim fabric',
      currentStock: 500,
      unit: 'meters',
      minStockLevel: 50,
      costPerUnit: 8.75,
      supplier: 'Denim Co',
      status: 'active',
      createdBy: 'system'
    })

    console.log('✅ Sample data initialized successfully')
  }
}

export default new MemoryDatabase()




