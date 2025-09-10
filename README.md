# Saft ERP System

A comprehensive Enterprise Resource Planning (ERP) system built with React, Node.js, and Firebase for textile manufacturing businesses.

## 🚀 Features

- **User Authentication**: Firebase Authentication with role-based access control
- **Dashboard**: Real-time KPIs and analytics
- **Customer Management**: Complete CRUD operations for customer data
- **Product Management**: Inventory tracking with low stock alerts
- **Order Management**: Order processing and status tracking
- **Production Tracking**: Manufacturing logs and progress monitoring
- **Invoice Management**: Billing and payment tracking
- **Reports**: Sales, inventory, and production analytics
- **Notifications**: Real-time alerts for important events
- **Responsive Design**: Mobile-friendly interface

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router v6** - Client-side routing
- **Redux Toolkit** - State management
- **React Query** - Server state management
- **Firebase** - Authentication and real-time database
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Firebase Admin SDK** - Backend Firebase integration
- **Firestore** - NoSQL database
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Rate Limiting** - API protection

## 📁 Project Structure

```
Saft/
├── frontend/                 # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── assets/          # Images, icons
│   │   ├── components/      # Shared components
│   │   ├── config/          # Firebase configuration
│   │   ├── layouts/         # Layout components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Redux store
│   │   └── utils/           # Utility functions
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── backend/                  # Node.js backend API
    ├── src/
    │   ├── config/          # Firebase Admin SDK setup
    │   ├── middlewares/     # Express middlewares
    │   ├── routes/          # API routes
    │   └── services/        # Business logic
    ├── package.json
    └── env.example
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore enabled

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Saft
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Backend Setup

```bash
cd ../backend
npm install
```

Copy the environment example file:
```bash
cp env.example .env
```

Update the `.env` file with your Firebase configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Go to Project Settings > Service Accounts
6. Generate a new private key
7. Download the JSON file and use the values in your `.env` file

### 5. Run the Application

#### Start the Backend
```bash
cd backend
npm run dev
```

#### Start the Frontend
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Authentication & Authorization

The system uses Firebase Authentication with role-based access control:

- **Admin**: Full access to all features
- **Sales**: Access to customers, products, orders, invoices
- **Production**: Access to dashboard, production, notifications

## 📊 Data Model

### Users
```javascript
{
  id: string,
  name: string,
  email: string,
  role: "admin" | "sales" | "production",
  createdAt: Timestamp
}
```

### Customers
```javascript
{
  id: string,
  name: string,
  contact: string,
  address: string,
  gstNo: string,
  createdAt: Timestamp
}
```

### Products
```javascript
{
  id: string,
  name: string,
  category: string,
  stockQty: number,
  unitPrice: number,
  lowStockThreshold: number
}
```

### Orders
```javascript
{
  id: string,
  customerId: string,
  items: [{ productId: string, qty: number }],
  status: "pending" | "in_production" | "completed" | "shipped",
  createdAt: Timestamp
}
```

## 🛣 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create user (admin only)
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/stats` - Get dashboard KPIs

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Production
- `GET /api/production` - Get production logs
- `POST /api/production` - Create production log

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice

### Reports
- `GET /api/reports` - Get available reports
- `POST /api/reports/generate` - Generate report

## 🎨 Customization

### Styling
The application uses Tailwind CSS for styling. You can customize the theme in `frontend/tailwind.config.js`.

### Components
Reusable components are located in `frontend/src/components/`.

### API Configuration
API base URL can be configured in `frontend/src/services/api.js`.

## 🚀 Deployment

### Frontend Deployment
1. Build the application:
```bash
cd frontend
npm run build
```

2. Deploy the `dist` folder to your hosting provider (Vercel, Netlify, etc.)

### Backend Deployment
1. Set up environment variables on your hosting platform
2. Deploy to platforms like Heroku, Railway, or DigitalOcean

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.

## 🔄 Development Roadmap

- [ ] Real-time notifications
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Integration with accounting software
- [ ] Barcode scanning
- [ ] Email notifications
- [ ] PDF generation for invoices
- [ ] Data export functionality 