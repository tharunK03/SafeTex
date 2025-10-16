import express from 'express';
import InvoiceGenerator from './src/services/invoiceGenerator.js';

const app = express();
const port = 3001;

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Test invoice generation endpoint
app.post('/api/test-invoice', async (req, res) => {
  try {
    const generator = new InvoiceGenerator();
    const testData = {
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-18',
      dueDate: '2024-02-18',
      orderNumber: 'ORD-2024-001',
      placeOfSupply: 'Tamil Nadu',
      customer: {
        name: 'John Doe Industries',
        company: 'John Doe Industries Pvt Ltd',
        billingAddress: '123 Main Street, Chennai, Tamil Nadu - 600001',
        gstNumber: '33AABBC1234C1Z5',
        contactPerson: 'John Doe',
        email: 'john@example.com'
      },
      items: [
        {
          productCode: 'GL001',
          productName: 'Safety Gloves - Heavy Duty',
          size: 'Large',
          quantity: 100,
          unit: 'Pairs',
          unitPrice: 350.00,
          discount: 0,
          total: 35000.00
        },
        {
          productCode: 'BT002',
          productName: 'Safety Boots - Steel Toe',
          size: 'UK 9',
          quantity: 50,
          unit: 'Pairs',
          unitPrice: 1200.00,
          discount: 1000.00,
          total: 59000.00
        }
      ],
      otherCharges: 500,
      isIntraState: true
    };
    
    const result = await generator.generateInvoicePDF(testData);
    res.json({ 
      success: true, 
      message: 'Invoice generated successfully', 
      data: result 
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating invoice',
      error: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Test server running on port ${port}`);
});