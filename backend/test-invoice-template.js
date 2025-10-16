import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { supabase } from './src/config/supabase.js';
import InvoiceGenerator from './src/services/invoiceGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Invoice Template...');
console.log('===========================');

const invoiceGenerator = new InvoiceGenerator();

async function testInvoiceTemplate() {
    try {
        const testData = {
            invoiceNumber: 'SAFT-INV-001',
            invoiceDate: new Date().toLocaleDateString('en-IN'),
            dueDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-IN'),
            orderNumber: 'ORD-001',
            placeOfSupply: 'Tamil Nadu',
            isIntraState: true,
            customer: {
                name: 'Acme Industries',
                company: 'Acme Industries Pvt Ltd',
                billingAddress: '123, Industrial Area Phase 1, Chennai, Tamil Nadu - 600001',
                gstNumber: '33AAACA1234A1Z5',
                contactPerson: 'John Doe',
                email: 'john.doe@acme.com'
            },
            items: [
                {
                    productCode: 'SF-001',
                    productName: 'Safety Gloves Pro',
                    size: 'L',
                    quantity: 100,
                    unit: 'Pairs',
                    unitPrice: 149.50,
                    discount: 0,
                    total: 14950.00
                },
                {
                    productCode: 'SF-002',
                    productName: 'Safety Goggles Elite',
                    size: 'Standard',
                    quantity: 50,
                    unit: 'Pieces',
                    unitPrice: 299.00,
                    discount: 0,
                    total: 14950.00
                },
                {
                    productCode: 'SF-003',
                    productName: 'High Visibility Vest',
                    size: 'XL',
                    quantity: 75,
                    unit: 'Pieces',
                    unitPrice: 399.00,
                    discount: 0,
                    total: 29925.00
                }
            ],
            otherCharges: 500
        };

        console.log('📄 Generating invoice...');
        const result = await invoiceGenerator.generateInvoicePDF(testData);
        
        console.log('✅ Invoice generated successfully!');
        console.log('📄 File:', result.filename);
        console.log('📂 Path:', result.filepath);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testInvoiceTemplate();