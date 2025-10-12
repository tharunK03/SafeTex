#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

console.log('🔍 Testing Supabase Connection...')
console.log('================================')

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

console.log('📋 Environment Variables:')
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set')
console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseConnection() {
  try {
    console.log('\n🔌 Testing Supabase client connection...')
    
    // Test 1: Simple query to check connection
    console.log('📊 Test 1: Fetching products...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1)
    
    if (productsError) {
      console.error('❌ Products query failed:', productsError)
      return false
    } else {
      console.log('✅ Products query successful')
      console.log('📋 Sample product:', products?.[0] || 'No products found')
    }

    // Test 2: Test orders table
    console.log('\n📊 Test 2: Fetching orders...')
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number')
      .limit(1)
    
    if (ordersError) {
      console.error('❌ Orders query failed:', ordersError)
      return false
    } else {
      console.log('✅ Orders query successful')
      console.log('📋 Sample order:', orders?.[0] || 'No orders found')
    }

    // Test 3: Test customers table
    console.log('\n📊 Test 3: Fetching customers...')
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1)
    
    if (customersError) {
      console.error('❌ Customers query failed:', customersError)
      return false
    } else {
      console.log('✅ Customers query successful')
      console.log('📋 Sample customer:', customers?.[0] || 'No customers found')
    }

    // Test 4: Test production_logs table
    console.log('\n📊 Test 4: Fetching production logs...')
    const { data: productionLogs, error: productionError } = await supabase
      .from('production_logs')
      .select('id')
      .limit(1)
    
    if (productionError) {
      console.error('❌ Production logs query failed:', productionError)
      if (productionError.code === 'PGRST116') {
        console.log('ℹ️  This is expected if production_logs table doesn\'t exist yet')
      }
    } else {
      console.log('✅ Production logs query successful')
      console.log('📋 Sample production log:', productionLogs?.[0] || 'No production logs found')
    }

    // Test 5: Test raw_materials table
    console.log('\n📊 Test 5: Fetching raw materials...')
    const { data: rawMaterials, error: rawMaterialsError } = await supabase
      .from('raw_materials')
      .select('id')
      .limit(1)
    
    if (rawMaterialsError) {
      console.error('❌ Raw materials query failed:', rawMaterialsError)
      if (rawMaterialsError.code === 'PGRST116') {
        console.log('ℹ️  This is expected if raw_materials table doesn\'t exist yet')
      }
    } else {
      console.log('✅ Raw materials query successful')
      console.log('📋 Sample raw material:', rawMaterials?.[0] || 'No raw materials found')
    }

    console.log('\n🎉 All Supabase connection tests completed!')
    return true

  } catch (error) {
    console.error('❌ Supabase connection test failed:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return false
  }
}

// Run the test
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Supabase connection test PASSED!')
      console.log('🚀 Your Supabase client is working correctly')
    } else {
      console.log('\n❌ Supabase connection test FAILED!')
      console.log('🔧 Please check your Supabase configuration')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })



