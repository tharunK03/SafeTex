import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Simple PDF Generation...');
console.log('=================================');

async function testSimplePDFGeneration() {
    try {
        // Launch Puppeteer with minimal settings
        console.log('🚀 Launching browser...');
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        // Create a new page
        const page = await browser.newPage();
        
        // Simple HTML content
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test Invoice</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #333; }
                    .invoice-box { border: 1px solid #ddd; padding: 20px; }
                </style>
            </head>
            <body>
                <div class="invoice-box">
                    <h1>Test Invoice</h1>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <hr>
                    <h2>Items:</h2>
                    <ul>
                        <li>Test Product 1 - $100.00</li>
                        <li>Test Product 2 - $200.00</li>
                    </ul>
                    <hr>
                    <h3>Total: $300.00</h3>
                </div>
            </body>
            </html>
        `;
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const filename = 'simple-test.pdf';
        const filepath = path.join(__dirname, 'uploads', filename);
        
        // Ensure uploads directory exists
        const uploadsDir = path.dirname(filepath);
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        console.log('📄 Generating PDF...');
        await page.pdf({
            path: filepath,
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
        console.log('📄 File:', filename);
        console.log('📂 Path:', filepath);
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
    }
}

testSimplePDFGeneration();