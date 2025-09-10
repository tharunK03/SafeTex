const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixOrders() {
  try {
    console.log('Fixing orders by adding order items...\n')
    
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return
    }
    
    // Get the product
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, unit_price')
    
    if (productsError) {
      console.error('Error fetching products:', productsError)
      return
    }
    
    if (products.length === 0) {
      console.log('No products found. Please add products first.')
      return
    }
    
    const product = products[0] // Use the first product (glove)
    console.log(`Using product: ${product.name} (₹${product.unit_price})`)
    
    // Add order items to each order
    for (const order of orders) {
      console.log(`\nProcessing order: ${order.order_number}`)
      
      // Calculate how many items based on total amount
      const itemCount = Math.round(order.total_amount / product.unit_price)
      console.log(`Adding ${itemCount} items of ${product.name}`)
      
      const orderItem = {
        order_id: order.id,
        product_id: product.id,
        quantity: itemCount,
        unit_price: product.unit_price,
        total_price: itemCount * product.unit_price
      }
      
      const { data: newItem, error: insertError } = await supabase
        .from('order_items')
        .insert([orderItem])
        .select()
      
      if (insertError) {
        console.error(`Error adding item to ${order.order_number}:`, insertError.message)
      } else {
        console.log(`✅ Added ${itemCount}x ${product.name} to ${order.order_number}`)
      }
    }
    
    console.log('\n🎉 Order items have been added!')
    console.log('Refresh your browser to see the updated item counts.')
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

fixOrders()
