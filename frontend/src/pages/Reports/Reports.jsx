import { useState } from 'react'
import { Download, Calendar, BarChart3 } from 'lucide-react'

const Reports = () => {
  const [reports] = useState([
    {
      id: 1,
      name: 'Sales Report',
      description: 'Monthly sales analysis and revenue trends',
      type: 'sales',
      lastGenerated: '2024-01-31'
    },
    {
      id: 2,
      name: 'Inventory Report',
      description: 'Current stock levels and low stock alerts',
      type: 'inventory',
      lastGenerated: '2024-02-01'
    },
    {
      id: 3,
      name: 'Production Report',
      description: 'Production efficiency and output analysis',
      type: 'production',
      lastGenerated: '2024-01-30'
    }
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and view business reports and analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary-600" />
              </div>
              <button className="text-primary-600 hover:text-primary-800">
                <Download className="h-5 w-5" />
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{report.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                Last: {report.lastGenerated}
              </div>
              <button className="btn-primary text-sm">Generate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reports 