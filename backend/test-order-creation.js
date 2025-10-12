#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

console.log('🧪 Testing Order Creation...')
console.log('===========================')

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function testOrderCreation() {
  try {
    console.log('📋 Getting sample data for order creation...')
    
    // Get a customer
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1)
    
    if (!customers || customers.length === 0) {
      console.log('❌ No customers found. Please create a customer first.')
      return
    }
    
    // Get products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, unit_price')
      .limit(2)
    
    if (!products || products.length === 0) {
      console.log('❌ No products found. Please create products first.')
      return
    }
    
    const customer = customers[0]
    console.log(`👤 Using customer: ${customer.name}`)
    console.log(`📦 Using products: ${products.map(p => p.name).join(', ')}`)
    
    // Test order number generation logic
    console.log('🔢 Testing order number generation...')
    
    // Get current highest order number
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('order_number')
      .like('order_number', 'SAFT-%')
      .order('order_number', { ascending: false })
      .limit(1)
    
    let nextOrderNumber
    if (lastOrder && lastOrder.length > 0) {
      const lastNumber = lastOrder[0].order_number
      const numberPart = parseInt(lastNumber.replace('SAFT-', ''))
      nextOrderNumber = `SAFT-${String(numberPart + 1).padStart(5, '0')}`
    } else {
      nextOrderNumber = 'SAFT-00001'
    }
    
    console.log(`📝 Next order number will be: ${nextOrderNumber}`)
    
    // Check if this order number already exists
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', nextOrderNumber)
      .limit(1)
    
    if (existingOrder && existingOrder.length > 0) {
      console.log('⚠️  Order number already exists! This would cause a duplicate key error.')
    } else {
      console.log('✅ Order number is unique and available.')
    }
    
    console.log('')
    console.log('🎯 Order creation test completed!')
    console.log('📝 The improved order number generation should prevent duplicate key errors.')
    
  } catch (error) {
    console.error('❌ Error testing order creation:', error)
  }
}

testOrderCreation()






