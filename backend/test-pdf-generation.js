import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { supabase } from './src/config/supabase.js';
import InvoiceGenerator from './src/services/invoiceGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing PDF Invoice Generation...');
console.log('==================================');

const invoiceGenerator = new InvoiceGenerator();

async function testPDFGeneration() {
    try {
        console.log('📋 Creating test invoice data...');
        
        const testData = {
            invoiceNumber: 'TEST-001',
            invoiceDate: new Date().toLocaleDateString('en-IN'),
            dueDate: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-IN'),
            orderNumber: 'ORD-TEST-001',
            placeOfSupply: 'Tamil Nadu',
            isIntraState: true,
            customer: {
                name: 'Test Customer',
                company: 'Test Company Ltd',
                billingAddress: '123 Test Street, Chennai, Tamil Nadu',
                shippingAddress: '123 Test Street, Chennai, Tamil Nadu',
                gstNumber: '33TESTX0000X0ZX',
                contactPerson: 'John Doe',
                email: 'test@example.com'
            },
            items: [
                {
                    productCode: 'PRD001',
                    productName: 'Test Product 1',
                    size: 'Standard',
                    quantity: 10,
                    unit: 'Piece',
                    unitPrice: 100.00,
                    discount: 0,
                    total: 1000.00
                },
                {
                    productCode: 'PRD002',
                    productName: 'Test Product 2',
                    size: 'Standard',
                    quantity: 5,
                    unit: 'Piece',
                    unitPrice: 200.00,
                    discount: 0,
                    total: 1000.00
                }
            ],
            otherCharges: 0
        };

        console.log('🖨️  Generating PDF...');
        const result = await invoiceGenerator.generateInvoicePDF(testData);
        
        console.log('✅ PDF generated successfully!');
        console.log('📄 File:', result.filename);
        console.log('📂 Path:', result.filepath);
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
    }
}

testPDFGeneration();