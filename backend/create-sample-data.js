#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

console.log('🌱 Creating Sample Data for Saft ERP...')
console.log('=====================================')

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function createSampleData() {
  try {
    console.log('📦 Creating sample products...')
    
    // Insert sample products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert([
        {
          name: 'Cotton T-Shirt',
          description: 'High quality cotton t-shirt',
          category: 'Apparel',
          stock_qty: 100,
          unit_price: 25.99,
          low_stock_threshold: 10
        },
        {
          name: 'Denim Jeans',
          description: 'Classic blue denim jeans',
          category: 'Apparel',
          stock_qty: 50,
          unit_price: 45.99,
          low_stock_threshold: 5
        },
        {
          name: 'Leather Jacket',
          description: 'Premium leather jacket',
          category: 'Apparel',
          stock_qty: 25,
          unit_price: 125.99,
          low_stock_threshold: 3
        }
      ])
      .select()

    if (productsError) {
      console.error('❌ Error creating products:', productsError)
    } else {
      console.log(`✅ Created ${products.length} products`)
    }

    console.log('👥 Creating sample customers...')
    
    // Insert sample customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .insert([
        {
          name: 'ABC Clothing Store',
          contact_person: 'John Smith',
          email: 'john@abcclothing.com',
          phone: '+1-555-0123',
          address: '123 Main St, New York, NY 10001',
          gst_no: 'GST123456789'
        },
        {
          name: 'Fashion Forward',
          contact_person: 'Sarah Johnson',
          email: 'sarah@fashionforward.com',
          phone: '+1-555-0456',
          address: '456 Oak Ave, Los Angeles, CA 90210',
          gst_no: 'GST987654321'
        },
        {
          name: 'Trendy Threads',
          contact_person: 'Mike Davis',
          email: 'mike@trendythreads.com',
          phone: '+1-555-0789',
          address: '789 Pine St, Chicago, IL 60601',
          gst_no: 'GST456789123'
        }
      ])
      .select()

    if (customersError) {
      console.error('❌ Error creating customers:', customersError)
    } else {
      console.log(`✅ Created ${customers.length} customers`)
    }

    console.log('🧵 Creating sample raw materials...')
    
    // Insert sample raw materials
    const { data: rawMaterials, error: rawMaterialsError } = await supabase
      .from('raw_materials')
      .insert([
        {
          name: 'Cotton Fabric',
          description: 'High quality cotton fabric for t-shirt production',
          current_stock: 1000.00,
          unit: 'meters',
          min_stock_level: 100.00,
          cost_per_unit: 25.50,
          supplier: 'Textile Suppliers Ltd'
        },
        {
          name: 'Polyester Thread',
          description: 'Strong polyester thread for stitching',
          current_stock: 500.00,
          unit: 'spools',
          min_stock_level: 50.00,
          cost_per_unit: 5.75,
          supplier: 'Thread Masters'
        },
        {
          name: 'Zippers',
          description: 'Metal zippers for jackets and bags',
          current_stock: 200.00,
          unit: 'pieces',
          min_stock_level: 20.00,
          cost_per_unit: 12.00,
          supplier: 'Hardware Supply Co'
        },
        {
          name: 'Buttons',
          description: 'Plastic buttons for shirts',
          current_stock: 1000.00,
          unit: 'pieces',
          min_stock_level: 100.00,
          cost_per_unit: 0.25,
          supplier: 'Button World'
        },
        {
          name: 'Elastic Band',
          description: 'Elastic bands for waistbands',
          current_stock: 300.00,
          unit: 'meters',
          min_stock_level: 30.00,
          cost_per_unit: 8.00,
          supplier: 'Elastic Solutions'
        }
      ])
      .select()

    if (rawMaterialsError) {
      console.error('❌ Error creating raw materials:', rawMaterialsError)
    } else {
      console.log(`✅ Created ${rawMaterials.length} raw materials`)
    }

    console.log('📋 Creating sample orders...')
    
    // Get customer IDs for orders
    const { data: customerData } = await supabase
      .from('customers')
      .select('id')
      .limit(1)
    
    if (customerData && customerData.length > 0) {
      const customerId = customerData[0].id
      
      // Insert sample orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .insert([
          {
            order_number: 'SAFT-00001',
            customer_id: customerId,
            status: 'pending',
            total_amount: 519.80,
            notes: 'Urgent order for weekend sale'
          },
          {
            order_number: 'SAFT-00002',
            customer_id: customerId,
            status: 'in_production',
            total_amount: 2299.50,
            notes: 'Bulk order for new store opening'
          }
        ])
        .select()

      if (ordersError) {
        console.error('❌ Error creating orders:', ordersError)
      } else {
        console.log(`✅ Created ${orders.length} orders`)
      }
    }

    console.log('')
    console.log('🎉 Sample data creation completed!')
    console.log('')
    console.log('📊 Summary:')
    console.log('- Products: Cotton T-Shirt, Denim Jeans, Leather Jacket')
    console.log('- Customers: ABC Clothing Store, Fashion Forward, Trendy Threads')
    console.log('- Raw Materials: Cotton Fabric, Thread, Zippers, Buttons, Elastic')
    console.log('- Orders: 2 sample orders')
    console.log('')
    console.log('🚀 Your Saft ERP system is now ready to use!')

  } catch (error) {
    console.error('❌ Error creating sample data:', error)
  }
}

createSampleData()






