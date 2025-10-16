import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import InvoiceGenerator from '../services/invoiceGenerator.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router()
const invoiceGenerator = new InvoiceGenerator()

// Ensure uploads directory exists (configurable)
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)){
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        orders(
          order_number,
          customers(name, email, contact_person)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch invoices'
      })
    }

    // Transform data to camelCase for frontend
    const transformedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      orderId: invoice.order_id,
      orderNumber: invoice.orders?.order_number || 'Unknown',
      customerName: invoice.orders?.customers?.name || 'Unknown',
      amount: parseFloat(invoice.total_amount),
      status: invoice.status,
      dueDate: invoice.due_date,
      invoiceDate: invoice.created_at, // Use created_at as invoice date
      placeOfSupply: 'Tamil Nadu', // Default since column doesn't exist
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at
    }))

    res.json({
      success: true,
      data: transformedInvoices
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    })
  }
})

// @route   POST /api/invoices
// @desc    Create new invoice
// @access  Private
router.post('/', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const { orderId, amount, dueDate, placeOfSupply } = req.body

    // Generate invoice number
    const { data: lastInvoice, error: countError } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)

    let invoiceNumber = 'INV-2025-001'
    if (lastInvoice && lastInvoice.length > 0) {
      const parts = lastInvoice[0].invoice_number.split('-')
      if (parts.length >= 3) {
        const lastNumber = parseInt(parts[2])
        if (!isNaN(lastNumber)) {
          invoiceNumber = `INV-2025-${String(lastNumber + 1).padStart(3, '0')}`
        }
      }
    }

    const invoiceData = {
      invoice_number: invoiceNumber,
      order_id: orderId,
      amount: parseFloat(amount),
      total_amount: parseFloat(amount),
      tax_amount: parseFloat(amount) * 0.18, // 18% GST
      status: 'unpaid',
      due_date: dueDate ? new Date(dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create invoice'
      })
    }

    // Transform response to camelCase
    const transformedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      orderId: invoice.order_id,
      amount: parseFloat(invoice.amount),
      status: invoice.status,
      dueDate: invoice.due_date,
      invoiceDate: invoice.invoice_date,
      placeOfSupply: invoice.place_of_supply,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at
    }

    res.status(201).json({
      success: true,
      data: transformedInvoice
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    })
  }
})

// @route   PUT /api/invoices/:id
// @desc    Update invoice
// @access  Private
router.put('/:id', [
  body('status').isIn(['paid', 'unpaid', 'overdue']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      })
    }

    const { id } = req.params
    const { status, amount } = req.body

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    }

    if (amount) {
      updateData.amount = parseFloat(amount)
      updateData.total_amount = parseFloat(amount)
      updateData.tax_amount = parseFloat(amount) * 0.18
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to update invoice'
      })
    }

    // Transform response to camelCase
    const transformedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      orderId: invoice.order_id,
      amount: parseFloat(invoice.total_amount),
      status: invoice.status,
      dueDate: invoice.due_date,
      invoiceDate: invoice.created_at, // Use created_at as invoice date
      placeOfSupply: 'Tamil Nadu', // Default since column doesn't exist
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at
    }

    res.json({
      success: true,
      data: transformedInvoice
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice'
    })
  }
})

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting invoice:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to delete invoice'
      })
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete invoice'
    })
  }
})

// @route   GET /api/invoices/:id/generate-pdf
// @desc    Generate PDF for invoice
// @access  Private
router.get('/:id/generate-pdf', async (req, res) => {
  try {
    const { id } = req.params

    // Get invoice with order and customer details
    const { data: invoice, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      })
    }

    // Get order items for the invoice
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        products(
          name,
          sku
        )
      `)
      .eq('order_id', invoice.order_id)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch order items'
      })
    }

    // Prepare invoice data for PDF generation
    const invoiceData = {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: new Date(invoice.created_at).toLocaleDateString('en-IN'),
      dueDate: new Date(invoice.due_date).toLocaleDateString('en-IN'),
      orderNumber: invoice.orders.order_number,
      placeOfSupply: 'Tamil Nadu', // Default since column doesn't exist
      isIntraState: true, // Default to intra-state
      customer: {
        name: invoice.orders.customers.name,
        company: '', // Not available in customers table
        billingAddress: invoice.orders.customers.address,
        shippingAddress: invoice.orders.customers.address, // Use same address for both
        gstNumber: invoice.orders.customers.gst_no,
        contactPerson: invoice.orders.customers.contact_person,
        email: invoice.orders.customers.email
      },
      items: orderItems.map(item => ({
        productCode: item.products.sku || 'N/A',
        productName: item.products.name,
        size: 'Standard', // Default size since products table doesn't have size column
        quantity: item.quantity,
        unit: 'Piece',
        unitPrice: parseFloat(item.unit_price),
        discount: 0,
        total: parseFloat(item.quantity) * parseFloat(item.unit_price)
      })),
      otherCharges: 0
    }

    // Generate PDF
    const pdfResult = await invoiceGenerator.generateInvoicePDF(invoiceData)

    // Send PDF file
    res.download(pdfResult.filepath, pdfResult.filename, (err) => {
      if (err) {
        console.error('Error sending PDF:', err)
        res.status(500).json({
          success: false,
          error: 'Failed to send PDF'
        })
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    const status = error.message?.startsWith('PDF_GENERATION_FAILED') ? 502 : 500
    res.status(status).json({
      success: false,
      error: error.message || 'Failed to generate PDF'
    })
  }
})

// @route   GET /api/invoices/:id/download
// @desc    Download invoice PDF
// @access  Private
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params

    // Check if PDF already exists
    const pdfPath = path.join(uploadsDir, `invoice-${id}.pdf`)
    
    if (fs.existsSync(pdfPath)) {
      // Check if file has content
      const stats = fs.statSync(pdfPath)
      if (stats.size > 1000) {
        res.download(pdfPath, `invoice-${id}.pdf`)
      } else {
        // File exists but is too small, regenerate
        await generateAndSendPDF(id, res)
      }
    } else {
      // Generate PDF if it doesn't exist
      await generateAndSendPDF(id, res)
    }
  } catch (error) {
    console.error('Error downloading PDF:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to download PDF'
    })
  }
})

// Helper function to generate and send PDF
async function generateAndSendPDF(invoiceId, res) {
  try {
    // Get invoice with order and customer details
    const { data: invoice, error } = await supabase
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
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      })
    }

    // Get order items for the invoice
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        products(
          name,
          sku
        )
      `)
      .eq('order_id', invoice.order_id)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch order items'
      })
    }

    // Prepare invoice data for PDF generation
    const invoiceData = {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: new Date(invoice.created_at).toLocaleDateString('en-IN'),
      dueDate: new Date(invoice.due_date).toLocaleDateString('en-IN'),
      orderNumber: invoice.orders.order_number,
      placeOfSupply: 'Tamil Nadu', // Default since column doesn't exist
      isIntraState: true, // Default to intra-state
      customer: {
        name: invoice.orders.customers.name,
        company: '', // Not available in customers table
        billingAddress: invoice.orders.customers.address,
        shippingAddress: invoice.orders.customers.address, // Use same address for both
        gstNumber: invoice.orders.customers.gst_no,
        contactPerson: invoice.orders.customers.contact_person,
        email: invoice.orders.customers.email
      },
      items: orderItems.map(item => ({
        productCode: item.products.sku || 'N/A',
        productName: item.products.name,
        size: 'Standard', // Default size since products table doesn't have size column
        quantity: item.quantity,
        unit: 'Piece',
        unitPrice: parseFloat(item.unit_price),
        discount: 0,
        total: parseFloat(item.quantity) * parseFloat(item.unit_price)
      })),
      otherCharges: 0
    }

    // Generate PDF
    const pdfResult = await invoiceGenerator.generateInvoicePDF(invoiceData)

    // Send PDF file
    res.download(pdfResult.filepath, pdfResult.filename, (err) => {
      if (err) {
        console.error('Error sending PDF:', err)
        res.status(500).json({
          success: false,
          error: 'Failed to send PDF'
        })
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    const status = error.message?.startsWith('PDF_GENERATION_FAILED') ? 502 : 500
    res.status(status).json({
      success: false,
      error: error.message || 'Failed to generate PDF'
    })
  }
}

export default router;