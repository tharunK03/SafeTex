#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

console.log('🧪 Testing Invoice Generation...')
console.log('===============================')

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function testInvoiceGeneration() {
  try {
    console.log('📋 Getting invoice data...')
    
    // Get an invoice with order details
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders(
          order_number,
          total_amount,
          customers(
            name,
            address,
            gst_no,
            contact_person,
            email,
            phone
          )
        )
      `)
      .limit(1)
    
    if (error) {
      console.error('❌ Error fetching invoices:', error)
      return
    }
    
    if (!invoices || invoices.length === 0) {
      console.log('❌ No invoices found. Please create an invoice first.')
      return
    }
    
    const invoice = invoices[0]
    console.log(`📄 Testing invoice: ${invoice.invoice_number}`)
    console.log(`📦 Order: ${invoice.orders?.order_number || 'No order'}`)
    console.log(`👤 Customer: ${invoice.orders?.customers?.name || 'No customer'}`)
    
    // Get order items for this invoice
    console.log('📋 Fetching order items...')
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        total_price,
        products(
          name,
          sku
        )
      `)
      .eq('order_id', invoice.order_id)
    
    if (itemsError) {
      console.error('❌ Error fetching order items:', itemsError)
      return
    }
    
    console.log(`📦 Found ${orderItems.length} order items:`)
    orderItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.products?.name || 'Unknown Product'}`)
      console.log(`      SKU: ${item.products?.sku || 'N/A'}`)
      console.log(`      Quantity: ${item.quantity}`)
      console.log(`      Unit Price: ₹${item.unit_price}`)
      console.log(`      Total: ₹${item.total_price}`)
      console.log('')
    })
    
    // Test the invoice data structure
    const invoiceData = {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: new Date(invoice.created_at).toLocaleDateString('en-IN'),
      dueDate: new Date(invoice.due_date).toLocaleDateString('en-IN'),
      orderNumber: invoice.orders?.order_number || 'N/A',
      placeOfSupply: 'Tamil Nadu',
      isIntraState: true,
      customer: {
        name: invoice.orders?.customers?.name || 'Unknown Customer',
        company: '',
        billingAddress: invoice.orders?.customers?.address || 'No address',
        shippingAddress: invoice.orders?.customers?.address || 'No address',
        gstNumber: invoice.orders?.customers?.gst_no || 'N/A',
        contactPerson: invoice.orders?.customers?.contact_person || 'N/A',
        email: invoice.orders?.customers?.email || 'N/A'
      },
      items: orderItems.map(item => ({
        productCode: item.products?.sku || 'N/A',
        productName: item.products?.name || 'Unknown Product',
        size: 'Standard',
        quantity: item.quantity,
        unit: 'Piece',
        unitPrice: parseFloat(item.unit_price),
        discount: 0,
        total: parseFloat(item.quantity) * parseFloat(item.unit_price)
      })),
      otherCharges: 0
    }
    
    console.log('📊 Invoice Data Structure:')
    console.log(`   Invoice Number: ${invoiceData.invoiceNumber}`)
    console.log(`   Order Number: ${invoiceData.orderNumber}`)
    console.log(`   Customer: ${invoiceData.customer.name}`)
    console.log(`   Items Count: ${invoiceData.items.length}`)
    console.log(`   Total Items Value: ₹${invoiceData.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}`)
    
    // Test PDF generation
    console.log('')
    console.log('🖨️  Testing PDF generation...')
    
    const InvoiceGenerator = require('./src/services/invoiceGenerator')
    const invoiceGenerator = new InvoiceGenerator()
    
    try {
      const pdfResult = await invoiceGenerator.generateInvoicePDF(invoiceData)
      console.log('✅ PDF generated successfully!')
      console.log(`   File: ${pdfResult.filename}`)
      console.log(`   Path: ${pdfResult.filepath}`)
      console.log(`   URL: ${pdfResult.url}`)
    } catch (pdfError) {
      console.error('❌ Error generating PDF:', pdfError.message)
    }
    
  } catch (error) {
    console.error('❌ Error testing invoice generation:', error)
  }
}

testInvoiceGeneration()






