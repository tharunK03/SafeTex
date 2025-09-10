import { X, Download } from 'lucide-react'

const ViewInvoiceModal = ({ isOpen, onClose, invoice, onDownload }) => {
  if (!isOpen || !invoice) return null

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'unpaid': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Invoice Details</h2>
          <div className="flex space-x-2">
            <button
              onClick={onDownload}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Invoice Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Invoice Number:</span> {invoice.invoiceNumber}</div>
                <div><span className="font-medium">Order Number:</span> {invoice.orderNumber}</div>
                <div><span className="font-medium">Customer:</span> {invoice.customerName}</div>
                <div><span className="font-medium">Invoice Date:</span> {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                <div><span className="font-medium">Due Date:</span> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Financial Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Amount:</span> ₹{invoice.amount?.toLocaleString()}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                <div><span className="font-medium">Place of Supply:</span> {invoice.placeOfSupply}</div>
                <div><span className="font-medium">Created:</span> {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-IN') : 'N/A'}</div>
                <div><span className="font-medium">Last Updated:</span> {invoice.updatedAt ? new Date(invoice.updatedAt).toLocaleDateString('en-IN') : 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* GST Information */}
          <div>
            <h3 className="text-lg font-semibold mb-2">GST Information</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Supply Type:</span> 
                  <span className="ml-2">
                    {invoice.placeOfSupply === 'Tamil Nadu' ? 'Intra-state (CGST + SGST)' : 'Inter-state (IGST)'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">GST Rate:</span> <span className="ml-2">18%</span>
                </div>
                {invoice.placeOfSupply === 'Tamil Nadu' ? (
                  <>
                    <div><span className="font-medium">CGST (9%):</span> <span className="ml-2">₹{(invoice.amount * 0.09).toFixed(2)}</span></div>
                    <div><span className="font-medium">SGST (9%):</span> <span className="ml-2">₹{(invoice.amount * 0.09).toFixed(2)}</span></div>
                  </>
                ) : (
                  <div><span className="font-medium">IGST (18%):</span> <span className="ml-2">₹{(invoice.amount * 0.18).toFixed(2)}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Payment Terms:</span> Net 30 Days</div>
                <div><span className="font-medium">Bank:</span> HDFC Bank</div>
                <div><span className="font-medium">Account:</span> Safetex Enterprises</div>
                <div><span className="font-medium">UPI:</span> safetex@upi</div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Company Information</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="space-y-1 text-sm">
                <div className="font-semibold">Safetex Enterprises</div>
                <div>Vellanur, Chennai, Tamil Nadu</div>
                <div>GSTIN: 33BDIPP0757K2ZA</div>
                <div>Phone: +91 98765 43210</div>
                <div>Email: info@safetex.com</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewInvoiceModal
