const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

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
      const logoPath = path.join(__dirname, '../../uploads/safetex.png')
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
    try {
            const browser = await puppeteer.launch({
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
          '--enable-font-antialiasing'
        ]
      })
      const page = await browser.newPage()
      
      // Create HTML content for the invoice
      const htmlContent = this.generateInvoiceHTML(invoiceData)
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const filename = `invoice-${invoiceData.invoiceNumber}.pdf`
      const filepath = path.join(__dirname, '../../uploads', filename)
      
      // Ensure uploads directory exists
      const uploadsDir = path.dirname(filepath)
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
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
        printBackground: true
      })
      
      await browser.close()
      
      return {
        filename,
        filepath,
        url: `/uploads/${filename}`
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
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
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          body { 
            font-family: 'Roboto', Arial, sans-serif; 
            margin: 20px; 
            padding: 20px; 
            color: #000000 !important;
            background-color: #ffffff !important;
            font-size: 14px;
            line-height: 1.4;
            font-weight: 400;
          }
          
          h1, h2, h3, h4, p, span, div { 
            color: #000000 !important; 
            margin: 10px 0;
            font-family: 'Roboto', Arial, sans-serif;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            font-family: 'Roboto', Arial, sans-serif;
          }
          
          th, td { 
            border: 1px solid #000000; 
            padding: 10px; 
            text-align: left; 
            color: #000000 !important;
            font-family: 'Roboto', Arial, sans-serif;
          }
          
          th { 
            background-color: #f0f0f0; 
            font-weight: 500;
            font-family: 'Roboto', Arial, sans-serif;
          }
          
          .header {
            border-bottom: 2px solid #000000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .company-info {
            float: left;
            width: 50%;
          }
          
          .company-logo {
            margin-bottom: 15px;
          }
          
          .company-logo img {
            max-width: 200px;
            height: auto;
          }
          
          .invoice-info {
            float: right;
            text-align: right;
            width: 50%;
          }
          
          .clear {
            clear: both;
          }
          
          .customer-info {
            margin: 30px 0;
            padding: 15px;
            border: 1px solid #000000;
          }
          
          .total {
            text-align: right;
            font-weight: 500;
            margin-top: 20px;
          }
          
          .footer {
            margin-top: 50px;
            border-top: 1px solid #000000;
            padding-top: 20px;
          }
          
          .bank-details, .signature {
            width: 48%;
            display: inline-block;
            vertical-align: top;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div class="company-logo">
              <img src="data:image/png;base64,${this.getLogoBase64()}" alt="Safetex Logo" />
            </div>
            <h2>${this.companyDetails.name}</h2>
            <p>${this.companyDetails.address}</p>
            <p>GSTIN: ${this.companyDetails.gstin}</p>
            <p>Phone: ${this.companyDetails.phone}</p>
            <p>Email: ${this.companyDetails.email}</p>
          </div>
          <div class="invoice-info">
            <h1>TAX INVOICE</h1>
            <p><strong>Invoice No:</strong> ${invoiceData.invoiceNumber}</p>
            <p><strong>Date:</strong> ${invoiceData.invoiceDate}</p>
            <p><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
            <p><strong>Order Ref:</strong> ${invoiceData.orderNumber}</p>
            <p><strong>Place of Supply:</strong> ${invoiceData.placeOfSupply}</p>
          </div>
          <div class="clear"></div>
        </div>
        
        <div class="customer-info">
          <h3>Bill To:</h3>
          <p><strong>${invoiceData.customer.name}</strong></p>
          ${invoiceData.customer.company ? `<p>${invoiceData.customer.company}</p>` : ''}
          <p>${invoiceData.customer.billingAddress}</p>
          <p>GST: ${invoiceData.customer.gstNumber || 'N/A'}</p>
          <p>Contact: ${invoiceData.customer.contactPerson}</p>
          <p>Email: ${invoiceData.customer.email}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Size</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Tax %</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.productCode}</td>
                <td>${item.productName}</td>
                <td>${item.size}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>₹${item.unitPrice.toFixed(2)}</td>
                <td>₹${item.discount.toFixed(2)}</td>
                <td>18%</td>
                <td>₹${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          <p><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
          ${gst.cgst > 0 ? `<p><strong>CGST (9%):</strong> ₹${gst.cgst.toFixed(2)}</p>` : ''}
          ${gst.sgst > 0 ? `<p><strong>SGST (9%):</strong> ₹${gst.sgst.toFixed(2)}</p>` : ''}
          ${gst.igst > 0 ? `<p><strong>IGST (18%):</strong> ₹${gst.igst.toFixed(2)}</p>` : ''}
          ${invoiceData.otherCharges > 0 ? `<p><strong>Other Charges:</strong> ₹${invoiceData.otherCharges.toFixed(2)}</p>` : ''}
          <p style="font-size: 18px;"><strong>Grand Total:</strong> ₹${grandTotal.toFixed(2)}</p>
        </div>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f0f0f0; border: 1px solid #000000;">
          <p><strong>Amount in Words:</strong> ${this.numberToWords(Math.floor(grandTotal))} Only</p>
        </div>
        
        <div class="footer">
          <div class="bank-details">
            <h4>Payment Terms:</h4>
            <p>Net 30 Days</p>
            <h4>Bank Details:</h4>
            <p>Account Name: ${this.bankDetails.accountName}</p>
            <p>Bank: ${this.bankDetails.bank}</p>
            <p>Account No: ${this.bankDetails.accountNo}</p>
            <p>IFSC: ${this.bankDetails.ifsc}</p>
            <p>UPI: ${this.bankDetails.upi}</p>
          </div>
          <div class="signature">
            <h4>Authorized Signatory</h4>
            <p>For ${this.companyDetails.name}</p>
            <div style="border: 1px solid #000000; width: 150px; height: 60px; margin-top: 20px; text-align: center; line-height: 60px; font-size: 12px;">Signature</div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px solid #000000; padding-top: 20px;">
          <p>E.&O.E. | This is a computer-generated invoice. Subject to Chennai jurisdiction.</p>
        </div>
      </body>
      </html>
    `
  }
}

module.exports = InvoiceGenerator
