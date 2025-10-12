# 🔧 Supabase Table Setup Guide

## Problem
Your backend is failing with `TypeError: fetch failed` because:
1. Your environment variables contain placeholder values
2. The `raw_materials` table doesn't exist in your Supabase database

## Solution Steps

### Step 1: Fix Environment Variables
Your `.env` file currently has placeholder values. You need to update it with your actual Supabase credentials.

#### Option A: Interactive Setup
```bash
cd backend
node setup-env.js
```

#### Option B: Manual Setup
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **API Key (anon/public)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Database URL**: `postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres`

5. Edit your `.env` file:
```bash
nano .env
```

6. Replace the placeholder values:
```
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key
DATABASE_URL=postgresql://postgres:your-actual-password@db.your-actual-project-id.supabase.co:5432/postgres
```

### Step 2: Create Missing Tables

#### Option A: Automatic (after fixing env vars)
```bash
node create-tables.js
```

#### Option B: Manual (if automatic fails)
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `manual-table-creation.sql`
4. Run the SQL script

### Step 3: Test the Setup
```bash
# Test database connection
node test-db-connection.js

# Test Supabase client
node test-supabase-connection.js

# Test API endpoints
curl http://localhost:5000/health
```

## What Tables Will Be Created

### 1. raw_materials
- Stores information about raw materials used in production
- Fields: id, name, description, current_stock, unit, min_stock_level, cost_per_unit, supplier, status, timestamps
- Includes sample data (cotton fabric, thread, zippers, buttons, elastic bands)

### 2. production_material_requirements
- Links products to their required raw materials
- Fields: id, product_id, raw_material_id, quantity_required, unit, timestamps
- Enforces unique combinations of product_id and raw_material_id

## Verification
After completing the setup, you should see:
- ✅ Database connection successful
- ✅ All tables created
- ✅ Sample data inserted
- ✅ API endpoints working without fetch errors

## Troubleshooting

### If you get "fetch failed" errors:
1. Check your Supabase URL is correct
2. Verify your API key is the anon key (not service_role)
3. Ensure your project is active in Supabase dashboard
4. Check your network connection

### If tables already exist:
- The scripts use `CREATE TABLE IF NOT EXISTS` so they're safe to run multiple times
- Sample data uses `ON CONFLICT DO NOTHING` so it won't duplicate

### If you need to reset tables:
```sql
-- Drop tables (be careful!)
DROP TABLE IF EXISTS production_material_requirements CASCADE;
DROP TABLE IF EXISTS raw_materials CASCADE;
```

## Next Steps
Once your tables are created and environment variables are fixed:
1. Restart your backend server
2. Test all API endpoints
3. Deploy to AWS using the deployment scripts







