import express from 'express';
import { getFirestore } from '../config/firebase.js';

const router = express.Router();

// @route   GET /api/reports
// @desc    Get available reports
// @access  Private
router.get('/', async (req, res) => {
  try {
    const reports = [
      {
        id: 'sales',
        name: 'Sales Report',
        description: 'Monthly sales analysis and revenue trends',
        type: 'sales',
        lastGenerated: new Date().toISOString()
      },
      {
        id: 'inventory',
        name: 'Inventory Report',
        description: 'Current stock levels and low stock alerts',
        type: 'inventory',
        lastGenerated: new Date().toISOString()
      },
      {
        id: 'production',
        name: 'Production Report',
        description: 'Production efficiency and output analysis',
        type: 'production',
        lastGenerated: new Date().toISOString()
      }
    ]

    res.json({
      success: true,
      data: reports
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    })
  }
})

// @route   POST /api/reports/generate
// @desc    Generate a specific report
// @access  Private
router.post('/generate', async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body
    const db = getFirestore()

    let reportData = {}

    switch (reportType) {
      case 'sales':
        // Generate sales report
        const invoicesSnapshot = await db.collection('invoices').get()
        let totalSales = 0
        let paidInvoices = 0
        let unpaidInvoices = 0

        invoicesSnapshot.forEach(doc => {
          const invoice = doc.data()
          totalSales += invoice.amount || 0
          if (invoice.status === 'paid') {
            paidInvoices++
          } else {
            unpaidInvoices++
          }
        })

        reportData = {
          totalSales,
          paidInvoices,
          unpaidInvoices,
          generatedAt: new Date()
        }
        break

      case 'inventory':
        // Generate inventory report
        const productsSnapshot = await db.collection('products').get()
        let totalProducts = 0
        let lowStockProducts = 0
        let outOfStockProducts = 0

        productsSnapshot.forEach(doc => {
          const product = doc.data()
          totalProducts++
          if (product.stockQty <= product.lowStockThreshold) {
            lowStockProducts++
          }
          if (product.stockQty === 0) {
            outOfStockProducts++
          }
        })

        reportData = {
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          generatedAt: new Date()
        }
        break

      case 'production':
        // Generate production report
        const productionSnapshot = await db.collection('production').get()
        let totalProduction = 0
        let productionDays = 0

        productionSnapshot.forEach(doc => {
          const production = doc.data()
          totalProduction += production.producedQty || 0
          productionDays++
        })

        reportData = {
          totalProduction,
          productionDays,
          averageProduction: productionDays > 0 ? totalProduction / productionDays : 0,
          generatedAt: new Date()
        }
        break

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type'
        })
    }

    res.json({
      success: true,
      data: {
        reportType,
        ...reportData
      }
    })
  } catch (error) {
    console.error('Error generating report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    })
  }
})

export default router;