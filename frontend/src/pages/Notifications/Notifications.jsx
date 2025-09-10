import { useState } from 'react'
import { Bell, Check, X } from 'lucide-react'

const Notifications = () => {
  const [notifications] = useState([
    {
      id: 1,
      type: 'low_stock',
      message: 'Cotton Fabric is running low on stock (15 units remaining)',
      date: '2024-02-01 10:30 AM',
      read: false
    },
    {
      id: 2,
      type: 'order_completed',
      message: 'Order ORD-001 has been completed and is ready for shipping',
      date: '2024-02-01 09:15 AM',
      read: true
    },
    {
      id: 3,
      type: 'payment_overdue',
      message: 'Invoice INV-002 is overdue by 5 days',
      date: '2024-01-31 03:45 PM',
      read: false
    }
  ])

  const getTypeColor = (type) => {
    switch (type) {
      case 'low_stock': return 'bg-red-100 text-red-800'
      case 'order_completed': return 'bg-green-100 text-green-800'
      case 'payment_overdue': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600">Stay updated with important alerts and notifications.</p>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className={`card ${!notification.read ? 'border-l-4 border-l-primary-500' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Bell className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                      {notification.type.replace('_', ' ')}
                    </span>
                    {!notification.read && (
                      <span className="inline-flex h-2 w-2 bg-primary-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-900">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-1">{notification.date}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {!notification.read && (
                  <button className="text-green-600 hover:text-green-800">
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Notifications 