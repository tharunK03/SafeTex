#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

console.log('🔧 Fixing Duplicate Order Numbers...')
console.log('===================================')

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function fixDuplicateOrders() {
  try {
    console.log('📋 Checking for duplicate order numbers...')
    
    // Get all orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, created_at')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching orders:', error)
      return
    }
    
    console.log(`📊 Found ${orders.length} orders`)
    
    // Find duplicates
    const orderNumbers = new Map()
    const duplicates = []
    
    orders.forEach(order => {
      if (orderNumbers.has(order.order_number)) {
        duplicates.push(order)
      } else {
        orderNumbers.set(order.order_number, order)
      }
    })
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate order numbers found!')
      return
    }
    
    console.log(`⚠️  Found ${duplicates.length} duplicate order numbers:`)
    duplicates.forEach(dup => {
      console.log(`   - ${dup.order_number} (ID: ${dup.id})`)
    })
    
    // Fix duplicates by generating new unique numbers
    console.log('🔧 Fixing duplicate order numbers...')
    
    for (const duplicate of duplicates) {
      // Generate new unique order number
      let newOrderNumber
      let attempts = 0
      const maxAttempts = 10
      
      do {
        // Get the highest order number
        const { data: lastOrder } = await supabase
          .from('orders')
          .select('order_number')
          .like('order_number', 'SAFT-%')
          .order('order_number', { ascending: false })
          .limit(1)
        
        if (lastOrder && lastOrder.length > 0) {
          const lastNumber = lastOrder[0].order_number
          const numberPart = parseInt(lastNumber.replace('SAFT-', ''))
          newOrderNumber = `SAFT-${String(numberPart + 1).padStart(5, '0')}`
        } else {
          newOrderNumber = 'SAFT-00001'
        }
        
        // Check if this order number already exists
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('order_number', newOrderNumber)
          .limit(1)
        
        if (!existingOrder || existingOrder.length === 0) {
          break // Order number is unique
        }
        
        attempts++
      } while (attempts < maxAttempts)
      
      if (attempts >= maxAttempts) {
        console.error(`❌ Failed to generate unique order number for ${duplicate.order_number}`)
        continue
      }
      
      // Update the order with new number
      const { error: updateError } = await supabase
        .from('orders')
        .update({ order_number: newOrderNumber })
        .eq('id', duplicate.id)
      
      if (updateError) {
        console.error(`❌ Error updating order ${duplicate.id}:`, updateError)
      } else {
        console.log(`✅ Updated ${duplicate.order_number} → ${newOrderNumber}`)
      }
    }
    
    console.log('')
    console.log('🎉 Duplicate order numbers fixed!')
    
    // Verify no duplicates remain
    console.log('🔍 Verifying no duplicates remain...')
    const { data: finalOrders } = await supabase
      .from('orders')
      .select('order_number')
      .order('order_number')
    
    const finalOrderNumbers = finalOrders.map(o => o.order_number)
    const uniqueOrderNumbers = [...new Set(finalOrderNumbers)]
    
    if (finalOrderNumbers.length === uniqueOrderNumbers.length) {
      console.log('✅ No duplicate order numbers found!')
    } else {
      console.log('⚠️  Some duplicates may still exist')
    }
    
  } catch (error) {
    console.error('❌ Error fixing duplicate orders:', error)
  }
}

fixDuplicateOrders()






