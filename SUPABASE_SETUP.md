# 🗄️ Supabase PostgreSQL Setup Guide

This guide will help you set up PostgreSQL hosted on Supabase for your Saft ERP application.

## 🚀 **Step 1: Create Supabase Project**

### **1.1 Sign Up/Login to Supabase**
1. Go to [Supabase](https://supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"**

### **1.2 Create New Project**
1. **Organization**: Select your organization
2. **Name**: `saft-erp` (or your preferred name)
3. **Database Password**: Create a strong password (save this!)
4. **Region**: Choose the closest region to your users
5. Click **"Create new project"**

### **1.3 Wait for Setup**
- Database setup takes 2-3 minutes
- You'll receive an email when ready

## 🔑 **Step 2: Get Connection Details**

### **2.1 Database Connection String**
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI)
3. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres`

### **2.2 API Keys**
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://[PROJECT-ID].supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ⚙️ **Step 3: Update Environment Variables**

### **3.1 Backend Configuration**
Update your `backend/.env` file:

```env
# Supabase PostgreSQL Configuration
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
```

### **3.2 Replace Placeholders**
- `[YOUR-PROJECT-ID]`: Your actual project ID
- `[YOUR-PASSWORD]`: The database password you created
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`: Your actual anon key

## 🗂️ **Step 4: Database Schema**

The application will automatically create these tables when you start the server:

### **Core Tables:**
- **users** - User profiles (extends Firebase auth)
- **customers** - Customer information
- **products** - Product catalog and inventory
- **orders** - Order management
- **order_items** - Order line items
- **production_logs** - Manufacturing tracking
- **invoices** - Billing and payments

### **Table Structure:**
```sql
-- Users table (extends Firebase auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  gst_no VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  sku VARCHAR(100) UNIQUE,
  stock_qty INTEGER DEFAULT 0,
  unit_price DECIMAL(10,2) DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Production logs table
CREATE TABLE production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity_produced INTEGER NOT NULL,
  quantity_defective INTEGER DEFAULT 0,
  machine_id VARCHAR(100),
  operator_id UUID REFERENCES users(id),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 **Step 5: Test the Setup**

### **5.1 Start the Backend Server**
```bash
cd backend
npm run dev
```

### **5.2 Check Console Output**
You should see:
```
✅ PostgreSQL database connected successfully
✅ Database tables initialized successfully
🚀 Saft ERP API server running on port 5000
```

### **5.3 Test Database Connection**
Visit: `http://localhost:5000/health`

Expected response:
```json
{
  "status": "OK",
  "message": "Saft ERP API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 **Step 6: Security Configuration**

### **6.1 Row Level Security (RLS)**
Enable RLS for better security:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
```

### **6.2 Create Policies**
```sql
-- Example policy for customers table
CREATE POLICY "Users can view their own customers" ON customers
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own customers" ON customers
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own customers" ON customers
  FOR UPDATE USING (created_by = auth.uid());
```

## 📊 **Step 7: Supabase Dashboard Features**

### **7.1 Database Explorer**
- View and edit data directly
- Run SQL queries
- Monitor performance

### **7.2 Authentication**
- User management
- Email templates
- Social logins

### **7.3 Storage**
- File uploads
- Image storage
- Document management

### **7.4 Real-time**
- Live data updates
- WebSocket connections
- Real-time subscriptions

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. Connection Error**
```
❌ PostgreSQL connection error: connection to server at "db.xxx.supabase.co" failed
```
**Solution**: Check your DATABASE_URL and ensure the password is correct

#### **2. SSL Error**
```
❌ PostgreSQL connection error: no pg_hba.conf entry for host
```
**Solution**: Add `?sslmode=require` to your DATABASE_URL

#### **3. Table Creation Error**
```
❌ Database initialization error: relation "users" already exists
```
**Solution**: Tables already exist, this is normal on subsequent runs

#### **4. Permission Error**
```
❌ Database initialization error: permission denied
```
**Solution**: Check if your database user has CREATE TABLE permissions

### **Debug Steps:**
1. Verify environment variables are set correctly
2. Check Supabase project status
3. Test connection string in a database client
4. Check browser console for errors
5. Review server logs for detailed error messages

## 🎯 **Next Steps**

### **After Setup:**
1. ✅ Database is connected and tables are created
2. ✅ API endpoints are ready to use
3. ✅ Frontend can now use PostgreSQL instead of Firestore
4. ✅ Better performance and relational data integrity

### **Optional Enhancements:**
- Set up database backups
- Configure monitoring and alerts
- Enable real-time subscriptions
- Set up automated migrations
- Configure connection pooling

## 📞 **Support**

If you encounter issues:
1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the troubleshooting section above
3. Check your environment variables
4. Verify your Supabase project settings

Your PostgreSQL database is now ready to power your Saft ERP application! 🎉










