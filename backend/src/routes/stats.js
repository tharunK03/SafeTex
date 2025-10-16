import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// @route   GET /api/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/', async (req, res) => {
  try {
    
    // Get counts from different tables
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalInvoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    // Get invoices for revenue calculation
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, created_at')

    // Get orders for status calculation
    const { data: orders } = await supabase
      .from('orders')
      .select('status, created_at')

    // Get products for stock calculation
    const { data: products } = await supabase
      .from('products')
      .select('stock_qty, low_stock_threshold')

    // Calculate revenue
    let totalRevenue = 0
    let monthlyRevenue = 0
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    invoices?.forEach(invoice => {
      totalRevenue += invoice.total_amount || 0
      
      const invoiceDate = new Date(invoice.created_at)
      if (invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear) {
        monthlyRevenue += invoice.total_amount || 0
      }
    })

    // Calculate pending orders
    let pendingOrders = 0
    let monthlyOrders = 0
    
    orders?.forEach(order => {
      if (order.status === 'pending') {
        pendingOrders++
      }
      
      const orderDate = new Date(order.created_at)
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        monthlyOrders++
      }
    })

    // Calculate low stock products
    let lowStockProducts = 0
    products?.forEach(product => {
      if (product.stock_qty <= product.low_stock_threshold) {
        lowStockProducts++
      }
    })

    const stats = {
      totalCustomers: totalCustomers || 0,
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      totalRevenue: totalRevenue || 0,
      pendingOrders: pendingOrders || 0,
      lowStockProducts: lowStockProducts || 0,
      monthlyRevenue: monthlyRevenue || 0,
      monthlyOrders: monthlyOrders || 0
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    })
  }
})

export default router