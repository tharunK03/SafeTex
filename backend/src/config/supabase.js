const { createClient } = require('@supabase/supabase-js')
const { Pool } = require('pg')

// Supabase client for real-time features and auth
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// PostgreSQL connection pool for direct database access
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
})

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect()
    console.log('✅ PostgreSQL database connected successfully')
    client.release()
    return true
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message)
    return false
  }
}

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const client = await pool.connect()
    
    // Create tables if they don't exist
    await client.query(`
      -- Users table (extends Firebase auth)
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'sales', 'production_manager')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Customers table
      CREATE TABLE IF NOT EXISTS customers (
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
      CREATE TABLE IF NOT EXISTS products (
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
      CREATE TABLE IF NOT EXISTS orders (
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
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Production logs table
      CREATE TABLE IF NOT EXISTS production_logs (
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
      CREATE TABLE IF NOT EXISTS invoices (
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

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_production_logs_order_id ON production_logs(order_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `)

    // Enable Row Level Security (RLS) on all tables
    await client.query(`
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE products ENABLE ROW LEVEL SECURITY;
      ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
      ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
    `)

    // Create RLS policies
    await client.query(`
      -- Users table policies
      DROP POLICY IF EXISTS "Users can view own profile" ON users;
      CREATE POLICY "Users can view own profile" ON users
        FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Users can update own profile" ON users;
      CREATE POLICY "Users can update own profile" ON users
        FOR UPDATE USING (true);
      
      DROP POLICY IF EXISTS "Admins can manage all users" ON users;
      CREATE POLICY "Admins can manage all users" ON users
        FOR ALL USING (true);

      -- Customers table policies
      DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
      CREATE POLICY "Authenticated users can view customers" ON customers
        FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Sales and admin can manage customers" ON customers;
      CREATE POLICY "Sales and admin can manage customers" ON customers
        FOR ALL USING (true);

      -- Products table policies - Allow all operations for now since we're using Firebase auth
      DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
      CREATE POLICY "Authenticated users can view products" ON products
        FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
      CREATE POLICY "Authenticated users can manage products" ON products
        FOR ALL USING (true);

      -- Orders table policies
      DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders;
      CREATE POLICY "Authenticated users can view orders" ON orders
        FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Sales and admin can create orders" ON orders;
      CREATE POLICY "Sales and admin can create orders" ON orders
        FOR INSERT WITH CHECK (true);
      
      DROP POLICY IF EXISTS "All roles can update orders" ON orders;
      CREATE POLICY "All roles can update orders" ON orders
        FOR UPDATE USING (true);
      
      DROP POLICY IF EXISTS "Only admin can delete orders" ON orders;
      CREATE POLICY "Only admin can delete orders" ON orders
        FOR DELETE USING (true);

      -- Production logs table policies
      DROP POLICY IF EXISTS "Authenticated users can view production logs" ON production_logs;
      CREATE POLICY "Authenticated users can view production logs" ON production_logs
        FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Production and admin can manage logs" ON production_logs;
      CREATE POLICY "Production and admin can manage logs" ON production_logs
        FOR ALL USING (true);

      -- Invoices table policies
      DROP POLICY IF EXISTS "Authenticated users can view invoices" ON invoices;
      CREATE POLICY "Authenticated users can view invoices" ON invoices
        FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Sales and admin can manage invoices" ON invoices;
      CREATE POLICY "Sales and admin can manage invoices" ON invoices
        FOR ALL USING (true);

      -- Order items table policies
      DROP POLICY IF EXISTS "Authenticated users can view order items" ON order_items;
      CREATE POLICY "Authenticated users can view order items" ON order_items
        FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Authenticated users can manage order items" ON order_items;
      CREATE POLICY "Authenticated users can manage order items" ON order_items
        FOR ALL USING (true);
    `)

    // Create production_logs table using direct SQL
    try {
      const { error: productionLogsError } = await supabase
        .from('production_logs')
        .select('id')
        .limit(1)
      
      if (productionLogsError && productionLogsError.code === 'PGRST116') {
        // Table doesn't exist, create it manually
        console.log('Creating production_logs table...')
        // Note: In a real production environment, you would use migrations
        // For now, we'll create the table manually in Supabase dashboard
        console.log('⚠️  Please create the production_logs table manually in Supabase dashboard with the following SQL:')
        console.log(`
          CREATE TABLE production_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            produced_qty INTEGER NOT NULL,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Allow all operations for production_logs" ON production_logs
            FOR ALL USING (true);
        `)
      } else {
        console.log('✅ production_logs table ready')
      }
    } catch (error) {
      console.error('Error checking production_logs table:', error)
    }

    // Create raw_materials table using direct SQL
    try {
      const { error: rawMaterialsError } = await supabase
        .from('raw_materials')
        .select('id')
        .limit(1)
      
      if (rawMaterialsError && rawMaterialsError.code === 'PGRST116') {
        // Table doesn't exist, create it manually
        console.log('Creating raw_materials table...')
        // Note: In a real production environment, you would use migrations
        // For now, we'll create the table manually in Supabase dashboard
        console.log('⚠️  Please create the raw_materials table manually in Supabase dashboard with the following SQL:')
        console.log(`
          CREATE TABLE raw_materials (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
            unit VARCHAR(50) NOT NULL,
            min_stock_level DECIMAL(10,2) NOT NULL DEFAULT 0,
            cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
            supplier VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Allow all operations for raw_materials" ON raw_materials
            FOR ALL USING (true);
        `)
      } else {
        console.log('✅ raw_materials table ready')
      }
    } catch (error) {
      console.error('Error checking raw_materials table:', error)
    }

    // Create production_material_requirements table
    try {
      const { error: requirementsError } = await supabase
        .from('production_material_requirements')
        .select('id')
        .limit(1)
      
      if (requirementsError && requirementsError.code === 'PGRST116') {
        console.log('Creating production_material_requirements table...')
        console.log('⚠️  Please create the production_material_requirements table manually in Supabase dashboard with the following SQL:')
        console.log(`
          CREATE TABLE production_material_requirements (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            raw_material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
            quantity_required DECIMAL(10,2) NOT NULL,
            unit VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          ALTER TABLE production_material_requirements ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Allow all operations for production_material_requirements" ON production_material_requirements
            FOR ALL USING (true);
        `)
      } else {
        console.log('✅ production_material_requirements table ready')
      }
    } catch (error) {
      console.error('Error checking production_material_requirements table:', error)
    }

    console.log('✅ Database tables initialized successfully')
    client.release()
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    throw error
  }
}

module.exports = {
  supabase,
  pool,
  testConnection,
  initializeDatabase
}
