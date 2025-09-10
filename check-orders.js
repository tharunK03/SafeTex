const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrders() {
  try {
    console.log('Checking orders and order items in database...\n')
    
    // Check orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return
    }
    
    console.log(`Found ${orders.length} orders:`)
    orders.forEach(order => {
      console.log(`- ${order.order_number}: ${order.total_amount} (ID: ${order.id})`)
    })
    
    // Check order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
    
    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return
    }
    
    console.log(`\nFound ${orderItems.length} order items:`)
    orderItems.forEach(item => {
      console.log(`- Order ID: ${item.order_id}, Product ID: ${item.product_id}, Qty: ${item.quantity}`)
    })
    
    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
    
    if (productsError) {
      console.error('Error fetching products:', productsError)
      return
    }
    
    console.log(`\nFound ${products.length} products:`)
    products.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id})`)
    })
    
    if (orders.length > 0 && orderItems.length === 0) {
      console.log('\n⚠️  No order items found! This is why you see "0 items".')
      console.log('The orders exist but have no items associated with them.')
      console.log('\nTo fix this, you can:')
      console.log('1. Create new orders with items using the "New Order" button')
      console.log('2. Or manually add order items to existing orders')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkOrders()
