import axios from 'axios';
import { createDemoToken } from './demo-auth-bypass.js';

const BASE_URL = 'http://localhost:5000';

// Create demo token for admin user
const DEMO_TOKEN = await createDemoToken('admin@saft.com');

async function testCustomerAndInvoiceFlow() {
  try {
    console.log('Testing customer creation and invoice generation...');

    // 1. Create a customer
    console.log('\n1. Creating customer...');
    const customerResponse = await axios.post(
      `${BASE_URL}/api/customers-pg`,
      {
        name: 'Test Customer Ltd',
        contact_person: 'John Doe',
        email: 'john@testcustomer.com',
        phone: '1234567890',
        address: '123 Test Street',
        gst_no: 'TEST1234567890'
      },
      {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`
        }
      }
    );

    if (!customerResponse.data.success) {
      throw new Error('Customer creation failed: ' + customerResponse.data.error);
    }

    console.log('Customer created successfully:', customerResponse.data.customer.id);
    const customerId = customerResponse.data.customer.id;

    // 2. Create a test product first
    console.log('\n2. Creating test product...');
    const productResponse = await axios.post(
      `${BASE_URL}/api/products`,
      {
        name: 'Test Product',
        description: 'A test product for invoice generation',
        unit_price: 1000,
        gst_rate: 18,
        stock: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`
        }
      }
    );

    if (!productResponse.data.success) {
      throw new Error('Product creation failed: ' + productResponse.data.error);
    }

    console.log('Product created successfully:', productResponse.data.product.id);
    const productId = productResponse.data.product.id;

    // 3. Create an order
    console.log('\n3. Creating order...');
    const orderResponse = await axios.post(
      `${BASE_URL}/api/orders`,
      {
        customerId: customerId,
        items: [
          {
            productId: productId,
            quantity: 2
          }
        ],
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`
        }
      }
    );

    if (!orderResponse.data.success) {
      throw new Error('Order creation failed: ' + orderResponse.data.error);
    }

    console.log('Order created successfully:', orderResponse.data.data.id);
    const orderId = orderResponse.data.data.id;

    // 4. Generate an invoice for the order
    console.log('\n4. Generating invoice...');
    const invoiceResponse = await axios.post(
      `${BASE_URL}/api/invoices`,
      {
        orderId: orderId,
        totalAmount: 2000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        placeOfSupply: 'Tamil Nadu',
        gstType: 'igst' // or 'cgst_sgst'
      },
      {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`
        }
      }
    );

    if (!invoiceResponse.data.success) {
      throw new Error('Invoice generation failed: ' + invoiceResponse.data.error);
    }

    console.log('Invoice generated successfully:', invoiceResponse.data.invoice.id);

    // 5. Download the invoice PDF
    console.log('\n5. Downloading invoice PDF...');
    const pdfResponse = await axios.get(
      `${BASE_URL}/api/invoices/${invoiceResponse.data.data.id}/download`,
      {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`
        },
        responseType: 'arraybuffer'
      }
    );

    if (pdfResponse.status !== 200) {
      throw new Error('PDF download failed');
    }

    console.log('PDF downloaded successfully');
    console.log('\nAll tests passed successfully! 🎉');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Start the test
// Start the test
(async () => {
  await testCustomerAndInvoiceFlow();
})();