import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Invoice Template...');
console.log('===========================');

// HTML template generation
function generateHTML() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice TEST-001</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            body { 
                font-family: 'Inter', Arial, sans-serif;
                margin: 0;
                padding: 40px;
                color: #1a1a1a;
                background-color: #ffffff;
                font-size: 12px;
                line-height: 1.5;
            }

            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                border-bottom: 2px solid #e0e0e0;
                padding-bottom: 30px;
                margin-bottom: 30px;
            }

            .company-info {
                max-width: 350px;
            }
            
            .company-info img {
                height: 60px;
                margin-bottom: 20px;
            }
            
            .invoice-info {
                text-align: right;
            }
            
            .invoice-title {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 20px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
            }
            
            th {
                background-color: #f8f9fa;
                font-weight: 600;
                text-align: left;
                padding: 12px;
                border: 1px solid #e0e0e0;
            }
            
            td {
                padding: 12px;
                border: 1px solid #e0e0e0;
            }
            
            .total-section {
                width: 350px;
                margin-left: auto;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
            }
            
            .grand-total {
                font-weight: 700;
                font-size: 16px;
                border-top: 2px solid #e0e0e0;
                margin-top: 10px;
                padding-top: 10px;
            }
            
            .amount-words {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                margin: 30px 0;
            }
            
            .footer {
                display: flex;
                justify-content: space-between;
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px solid #e0e0e0;
            }
            
            .bank-details, .signature {
                width: 45%;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="company-info">
                    <img src="data:image/png;base64,${fs.readFileSync(path.join(__dirname, 'uploads/safetex.png')).toString('base64')}" alt="Safetex Logo">
                    <h2>Safetex Enterprises</h2>
                    <p>Vellanur, Chennai, Tamil Nadu</p>
                    <p>GSTIN: 33BDIPP0757K2ZA</p>
                    <p>Phone: +91 98765 43210</p>
                    <p>Email: info@safetex.com</p>
                </div>
                <div class="invoice-info">
                    <div class="invoice-title">TAX INVOICE</div>
                    <p><strong>Invoice No:</strong> TEST-001</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                    <p><strong>Due Date:</strong> ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-IN')}</p>
                    <p><strong>Order Ref:</strong> ORD-001</p>
                </div>
            </div>

            <div class="billing-info">
                <h3>Bill To:</h3>
                <p><strong>Acme Industries Pvt Ltd</strong></p>
                <p>123, Industrial Area Phase 1</p>
                <p>Chennai, Tamil Nadu - 600001</p>
                <p>GSTIN: 33AAACA1234A1Z5</p>
                <p>Contact: John Doe</p>
                <p>Email: john.doe@acme.com</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>S.No</th>
                        <th>Product Code</th>
                        <th>Description</th>
                        <th>Size</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>Rate</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>SF-001</td>
                        <td>Safety Gloves Pro</td>
                        <td>L</td>
                        <td>100</td>
                        <td>Pairs</td>
                        <td>₹149.50</td>
                        <td>₹14,950.00</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>SF-002</td>
                        <td>Safety Goggles Elite</td>
                        <td>Standard</td>
                        <td>50</td>
                        <td>Pieces</td>
                        <td>₹299.00</td>
                        <td>₹14,950.00</td>
                    </tr>
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₹29,900.00</span>
                </div>
                <div class="total-row">
                    <span>CGST (9%):</span>
                    <span>₹2,691.00</span>
                </div>
                <div class="total-row">
                    <span>SGST (9%):</span>
                    <span>₹2,691.00</span>
                </div>
                <div class="total-row grand-total">
                    <span>Grand Total:</span>
                    <span>₹35,282.00</span>
                </div>
            </div>

            <div class="amount-words">
                <strong>Amount in Words:</strong> Thirty Five Thousand Two Hundred Eighty Two Rupees Only
            </div>

            <div class="footer">
                <div class="bank-details">
                    <h4>Bank Details:</h4>
                    <p>Account Name: Safetex Enterprises</p>
                    <p>Bank: HDFC Bank</p>
                    <p>Account No: XXXXXXXX</p>
                    <p>IFSC: HDFC0000XXX</p>
                    <p>UPI: safetex@upi</p>
                </div>
                <div class="signature">
                    <h4>For Safetex Enterprises</h4>
                    <br><br><br>
                    <p>Authorized Signatory</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
}

async function generatePDF() {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        console.log('📄 Creating PDF...');
        await page.setContent(generateHTML(), { 
            waitUntil: 'networkidle0'
        });
        
        const pdfPath = path.join(__dirname, 'uploads/test-new-template.pdf');
        
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            printBackground: true
        });
        
        await browser.close();
        
        console.log('✅ PDF generated successfully!');
        console.log('📂 Path:', pdfPath);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

generatePDF();