import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const servicesPath = path.join(__dirname, 'src', 'services', 'invoiceGenerator.js');

import InvoiceGenerator from './src/services/invoiceGenerator.js';

const app = express();
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test invoice generation
app.get('/test-invoice', async (req, res) => {
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
        }
      ],
      isIntraState: true
    };
    
    console.log('Generating invoice...');
    const result = await generator.generateInvoicePDF(testData);
    console.log('Invoice generated:', result);
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const port = 4000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});