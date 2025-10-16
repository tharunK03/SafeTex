import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class InvoiceGenerator {
  constructor() {
    this.companyDetails = {
      name: 'Safetex Enterprises',
      address: 'Vellanur, Chennai, Tamil Nadu',
      gstin: '33BDIPP0757K2ZA',
      phone: '+91 98765 43210',
      email: 'info@safetex.com',
      website: 'www.safetex.com'
    }
    
    this.bankDetails = {
      accountName: 'Safetex Enterprises',
      bank: 'HDFC Bank',
      accountNo: 'XXXXXXXX',
      ifsc: 'HDFC0000XXX',
      upi: 'safetex@upi'
    }
  }

  // Get logo as base64
  getLogoBase64() {
    try {
      const assetsDir = process.env.ASSETS_DIR
        ? path.resolve(process.env.ASSETS_DIR)
        : path.join(__dirname, '../../uploads')
      const logoPath = path.join(assetsDir, 'safetex.png')
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath)
        return logoBuffer.toString('base64')
      } else {
        console.warn('Logo file not found:', logoPath)
        return ''
      }
    } catch (error) {
      console.error('Error reading logo file:', error)
      return ''
    }
  }

  // Convert number to words
  numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

    if (num === 0) return 'Zero'
    if (num < 10) return ones[num]
    if (num < 20) return teens[num - 10]
    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '')
    }
    if (num < 1000) {
      return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + this.numberToWords(num % 100) : '')
    }
    if (num < 100000) {
      return this.numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + this.numberToWords(num % 1000) : '')
    }
    if (num < 10000000) {
      return this.numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + this.numberToWords(num % 100000) : '')
    }
    return this.numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + this.numberToWords(num % 10000000) : '')
  }

  // Calculate GST based on place of supply
  calculateGST(amount, isIntraState = true) {
    const gstRate = 0.18 // 18% GST
    const totalGST = amount * gstRate
    
    if (isIntraState) {
      // CGST + SGST (9% each for intra-state)
      return {
        cgst: totalGST / 2,
        sgst: totalGST / 2,
        igst: 0
      }
    } else {
      // IGST (18% for inter-state)
      return {
        cgst: 0,
        sgst: 0,
        igst: totalGST
      }
    }
  }

  // Generate invoice PDF using Puppeteer
  async generateInvoicePDF(invoiceData) {
    let browser
    try {
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN
      const userDataDir = process.env.PUPPETEER_USER_DATA_DIR || path.join('/tmp', 'puppeteer_user_data')
      const launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--font-render-hinting=none',
          '--disable-font-subpixel-positioning',
          '--enable-font-antialiasing',
          `--user-data-dir=${userDataDir}`
        ]
      }
      if (executablePath) {
        launchOptions.executablePath = executablePath
      }

      // Ensure temp directories exist with safe permissions
      try {
        fs.mkdirSync(userDataDir, { recursive: true, mode: 0o755 })
      } catch {}

      browser = await puppeteer.launch(launchOptions)
      const page = await browser.newPage()

      // Create HTML content for the invoice
      const htmlContent = this.generateInvoiceHTML(invoiceData)

      await page.setContent(htmlContent, { waitUntil: 'load', timeout: 30000 })

      const filename = `invoice-${invoiceData.invoiceNumber}.pdf`
      const uploadsBase = process.env.UPLOADS_DIR
        ? path.resolve(process.env.UPLOADS_DIR)
        : path.join(__dirname, '../../uploads')
      const filepath = path.join(uploadsBase, filename)

      // Ensure uploads directory exists
      const uploadsDir = path.dirname(filepath)
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 })
      }

      await page.pdf({
        path: filepath,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        preferCSSPageSize: true
      })

      return {
        filename,
        filepath,
        url: `/uploads/${filename}`
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error(`PDF_GENERATION_FAILED: ${error.message}`)
    } finally {
      if (browser) {
        try { await browser.close() } catch {}
      }
    }
  }

  // Generate HTML content for the invoice
  generateInvoiceHTML(invoiceData) {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.total, 0)
    const gst = this.calculateGST(subtotal, invoiceData.isIntraState)
    const grandTotal = subtotal + gst.cgst + gst.sgst + gst.igst

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          /* Use system fonts to avoid external network calls in headless environments */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
              Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 30px;
            color: #333333;
            background-color: #ffffff;
            font-size: 11px;
            line-height: 1.4;
          }
          
          h1, h2, h3, h4, p, span, div { 
            margin: 5px 0;
            color: #333333;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            table-layout: fixed;
          }
          
          th, td {
            border: 1px solid #cccccc;
            padding: 8px;
            text-align: left;
            word-wrap: break-word;
          }
          
          th {
            background-color: #f8f8f8;
            font-weight: 600;
            color: #444444;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #eeeeee;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .company-info {
            width: 45%;
          }
          
          .company-logo {
            margin-bottom: 10px;
          }
          
          .company-logo img {
            max-width: 180px;
            height: auto;
          }
          
          .invoice-info {
            width: 45%;
            text-align: right;
          }
          
          .customer-info {
            margin: 20px 0;
            padding: 12px;
            border: 1px solid #eeeeee;
            background-color: #fafafa;
          }
          
          .calculations {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            font-size: 11px;
          }
          
          .total {
            width: 300px;
            text-align: right;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #eeeeee;
          }
          
          .total-row.grand-total {
            font-weight: 600;
            font-size: 13px;
            border-bottom: none;
            padding-top: 8px;
          }
          
          .amount-in-words {
            margin: 15px 0;
            padding: 12px;
            background-color: #f8f8f8;
            border: 1px solid #eeeeee;
            font-style: italic;
            color: #666666;
          }
          
          .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #eeeeee;
            padding-top: 15px;
          }
          
          .bank-details, .signature {
            width: 45%;
          }
          
          .signature-box {
            border: 1px solid #eeeeee;
            width: 140px;
            height: 50px;
            margin-top: 15px;
            text-align: center;
            line-height: 50px;
            color: #999999;
          }
          
          .footer-note {
            text-align: center;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #eeeeee;
            color: #999999;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div class="company-logo">
              <img src="data:image/png;base64,${this.getLogoBase64()}" alt="Safetex Logo" />
            </div>
            <h2 style="font-size: 16px; color: #222222;">${this.companyDetails.name}</h2>
            <p style="color: #666666;">${this.companyDetails.address}</p>
            <p>GSTIN: <strong>${this.companyDetails.gstin}</strong></p>
            <p>Phone: ${this.companyDetails.phone}</p>
            <p>Email: ${this.companyDetails.email}</p>
          </div>
          <div class="invoice-info">
            <h1 style="font-size: 20px; color: #222222; margin-bottom: 15px;">TAX INVOICE</h1>
            <table style="width: auto; float: right; border: none;">
              <tr>
                <td style="border: none; padding: 3px;"><strong>Invoice No:</strong></td>
                <td style="border: none; padding: 3px;">${invoiceData.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 3px;"><strong>Date:</strong></td>
                <td style="border: none; padding: 3px;">${invoiceData.invoiceDate}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 3px;"><strong>Due Date:</strong></td>
                <td style="border: none; padding: 3px;">${invoiceData.dueDate}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 3px;"><strong>Order Ref:</strong></td>
                <td style="border: none; padding: 3px;">${invoiceData.orderNumber}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 3px;"><strong>Place of Supply:</strong></td>
                <td style="border: none; padding: 3px;">${invoiceData.placeOfSupply}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <div class="customer-info">
          <h3 style="color: #444444;">Bill To:</h3>
          <p style="font-size: 13px;"><strong>${invoiceData.customer.name}</strong></p>
          ${invoiceData.customer.company ? `<p>${invoiceData.customer.company}</p>` : ''}
          <p>${invoiceData.customer.billingAddress}</p>
          <p>GSTIN: <strong>${invoiceData.customer.gstNumber || 'N/A'}</strong></p>
          <p>Contact Person: ${invoiceData.customer.contactPerson}</p>
          <p>Email: ${invoiceData.customer.email}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">S.No</th>
              <th style="width: 10%;">Product Code</th>
              <th style="width: 25%;">Product Name</th>
              <th style="width: 10%;">Size</th>
              <th style="width: 8%;">Qty</th>
              <th style="width: 7%;">Unit</th>
              <th style="width: 10%;">Unit Price</th>
              <th style="width: 10%;">Discount</th>
              <th style="width: 5%;">Tax %</th>
              <th style="width: 10%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.productCode}</td>
                <td>${item.productName}</td>
                <td>${item.size}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td>${item.unit}</td>
                <td style="text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
                <td style="text-align: right;">₹${item.discount.toFixed(2)}</td>
                <td style="text-align: center;">18%</td>
                <td style="text-align: right;">₹${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="calculations">
          <div class="total">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            ${gst.cgst > 0 ? `
              <div class="total-row">
                <span>CGST (9%):</span>
                <span>₹${gst.cgst.toFixed(2)}</span>
              </div>
            ` : ''}
            ${gst.sgst > 0 ? `
              <div class="total-row">
                <span>SGST (9%):</span>
                <span>₹${gst.sgst.toFixed(2)}</span>
              </div>
            ` : ''}
            ${gst.igst > 0 ? `
              <div class="total-row">
                <span>IGST (18%):</span>
                <span>₹${gst.igst.toFixed(2)}</span>
              </div>
            ` : ''}
            ${invoiceData.otherCharges > 0 ? `
              <div class="total-row">
                <span>Other Charges:</span>
                <span>₹${invoiceData.otherCharges.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>₹${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div class="amount-in-words">
          <strong>Amount in Words:</strong> ${this.numberToWords(Math.floor(grandTotal))} Only
        </div>
        
        <div class="footer">
          <div class="bank-details">
            <h4 style="color: #444444;">Payment Details</h4>
            <table style="border: none; margin: 10px 0;">
              <tr>
                <td style="border: none; padding: 2px; color: #666666;">Account Name:</td>
                <td style="border: none; padding: 2px;">${this.bankDetails.accountName}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 2px; color: #666666;">Bank:</td>
                <td style="border: none; padding: 2px;">${this.bankDetails.bank}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 2px; color: #666666;">Account No:</td>
                <td style="border: none; padding: 2px;">${this.bankDetails.accountNo}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 2px; color: #666666;">IFSC:</td>
                <td style="border: none; padding: 2px;">${this.bankDetails.ifsc}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 2px; color: #666666;">UPI:</td>
                <td style="border: none; padding: 2px;">${this.bankDetails.upi}</td>
              </tr>
            </table>
          </div>
          <div class="signature">
            <h4 style="color: #444444;">Authorized Signatory</h4>
            <p>For ${this.companyDetails.name}</p>
            <div class="signature-box">Signature</div>
          </div>
        </div>
        
        <div class="footer-note">
          <p>E.&O.E. | This is a computer-generated invoice. Subject to Chennai jurisdiction.</p>
        </div>
      </body>
      </html>
    `
  }
}

export default InvoiceGenerator;
