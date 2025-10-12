const db = require('./src/services/memory-db')

async function testFirestore() {
  console.log('🧪 Testing Firestore integration...')
  
  try {
    // Test creating a product
    console.log('📦 Creating test product...')
    const product = await db.createProduct({
      name: 'Test Product',
      description: 'A test product for Firestore',
      category: 'Test',
      sku: 'TEST-001',
      stockQty: 100,
      unitPrice: 25.99,
      lowStockThreshold: 10,
      status: 'active',
      createdBy: 'test-user'
    })
    console.log('✅ Product created:', product.id)

    // Test creating a customer
    console.log('👤 Creating test customer...')
    const customer = await db.createCustomer({
      name: 'Test Customer',
      contactPerson: 'John Doe',
      email: 'test@example.com',
      phone: '+1234567890',
      address: '123 Test Street',
      gstNo: 'GST123456789',
      status: 'active',
      createdBy: 'test-user'
    })
    console.log('✅ Customer created:', customer.id)

    // Test creating an order
    console.log('📋 Creating test order...')
    const order = await db.createOrder({
      orderNumber: 'SAFT-TEST-001',
      customerId: customer.id,
      status: 'pending',
      totalAmount: 259.90,
      notes: 'Test order for Firestore',
      createdBy: 'test-user'
    })
    console.log('✅ Order created:', order.id)

    // Test creating order items
    console.log('📝 Creating order items...')
    const orderItem = await db.createOrderItem({
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      quantity: 10,
      unitPrice: product.unitPrice,
      totalPrice: product.unitPrice * 10
    })
    console.log('✅ Order item created:', orderItem.id)

    // Test retrieving data
    console.log('📊 Testing data retrieval...')
    const products = await db.getAllProducts()
    const customers = await db.getAllCustomers()
    const orders = await db.getAllOrders()
    
    console.log(`✅ Retrieved ${products.length} products`)
    console.log(`✅ Retrieved ${customers.length} customers`)
    console.log(`✅ Retrieved ${orders.length} orders`)

    // Test order number generation
    console.log('🔢 Testing order number generation...')
    const orderNumber = await db.generateOrderNumber()
    console.log('✅ Generated order number:', orderNumber)

    console.log('🎉 All Firestore tests passed!')
    
  } catch (error) {
    console.error('❌ Firestore test failed:', error)
  }
}

testFirestore()
