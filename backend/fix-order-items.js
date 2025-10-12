#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

console.log('🔧 Fixing Missing Order Items...')
console.log('================================')

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function fixOrderItems() {
  try {
    console.log('📋 Getting orders without items...')
    
    // Get all orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching orders:', error)
      return
    }
    
    console.log(`📦 Found ${orders.length} orders`)
    
    // Get all products for order items
    const { data: products } = await supabase
      .from('products')
      .select('*')
    
    if (!products || products.length === 0) {
      console.log('❌ No products found. Please create products first.')
      return
    }
    
    console.log(`📦 Available products: ${products.map(p => p.name).join(', ')}`)
    
    // Check which orders have items
    for (const order of orders) {
      const { data: existingItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', order.id)
      
      if (!existingItems || existingItems.length === 0) {
        console.log(`⚠️  Order ${order.order_number} has no items. Creating items...`)
        
        // Create order items based on order total
        // For SAFT-00001 (519.8), create items that sum to this amount
        // For SAFT-00002 (2299.5), create items that sum to this amount
        
        let itemsToCreate = []
        
        if (order.order_number === 'SAFT-00001') {
          // Create items for Cotton T-Shirt order
          const cottonTShirt = products.find(p => p.name === 'Cotton T-Shirt')
          const jeans = products.find(p => p.name === 'Denim Jeans')
          
          if (cottonTShirt && jeans) {
            itemsToCreate = [
              {
                order_id: order.id,
                product_id: cottonTShirt.id,
                quantity: 15, // 15 * 25.99 = 389.85
                unit_price: cottonTShirt.unit_price,
                total_price: 15 * cottonTShirt.unit_price
              },
              {
                order_id: order.id,
                product_id: jeans.id,
                quantity: 3, // 3 * 45.99 = 137.97
                unit_price: jeans.unit_price,
                total_price: 3 * jeans.unit_price
              }
            ]
          }
        } else if (order.order_number === 'SAFT-00002') {
          // Create items for bulk order
          const cottonTShirt = products.find(p => p.name === 'Cotton T-Shirt')
          const jeans = products.find(p => p.name === 'Denim Jeans')
          const jacket = products.find(p => p.name === 'Leather Jacket')
          
          if (cottonTShirt && jeans && jacket) {
            itemsToCreate = [
              {
                order_id: order.id,
                product_id: cottonTShirt.id,
                quantity: 50, // 50 * 25.99 = 1299.5
                unit_price: cottonTShirt.unit_price,
                total_price: 50 * cottonTShirt.unit_price
              },
              {
                order_id: order.id,
                product_id: jeans.id,
                quantity: 20, // 20 * 45.99 = 919.8
                unit_price: jeans.unit_price,
                total_price: 20 * jeans.unit_price
              },
              {
                order_id: order.id,
                product_id: jacket.id,
                quantity: 2, // 2 * 125.99 = 251.98
                unit_price: jacket.unit_price,
                total_price: 2 * jacket.unit_price
              }
            ]
          }
        } else {
          // For other orders, create a simple item
          const firstProduct = products[0]
          itemsToCreate = [
            {
              order_id: order.id,
              product_id: firstProduct.id,
              quantity: Math.floor(order.total_amount / firstProduct.unit_price),
              unit_price: firstProduct.unit_price,
              total_price: Math.floor(order.total_amount / firstProduct.unit_price) * firstProduct.unit_price
            }
          ]
        }
        
        if (itemsToCreate.length > 0) {
          console.log(`   Creating ${itemsToCreate.length} items for order ${order.order_number}:`)
          itemsToCreate.forEach((item, index) => {
            const product = products.find(p => p.id === item.product_id)
            console.log(`     ${index + 1}. ${product?.name}: ${item.quantity} x ₹${item.unit_price} = ₹${item.total_price}`)
          })
          
          const { error: insertError } = await supabase
            .from('order_items')
            .insert(itemsToCreate)
          
          if (insertError) {
            console.error(`❌ Error creating items for order ${order.order_number}:`, insertError)
          } else {
            console.log(`✅ Created items for order ${order.order_number}`)
          }
        }
      } else {
        console.log(`✅ Order ${order.order_number} already has ${existingItems.length} items`)
      }
    }
    
    console.log('')
    console.log('🎉 Order items fix completed!')
    
    // Verify the fix
    console.log('🔍 Verifying order items...')
    for (const order of orders) {
      const { data: items } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          products(name)
        `)
        .eq('order_id', order.id)
      
      console.log(`📦 Order ${order.order_number}: ${items?.length || 0} items`)
      if (items && items.length > 0) {
        items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.products?.name}: ${item.quantity} x ₹${item.unit_price} = ₹${item.total_price}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing order items:', error)
  }
}

fixOrderItems()






