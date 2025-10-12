#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

console.log('🔧 Creating Missing Database Tables...')
console.log('=====================================')

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:')
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function createRawMaterialsTable() {
  try {
    console.log('📋 Creating raw_materials table...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-raw-materials-table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message)
        // Continue with other statements
      }
    }
    
    // Test if the table was created successfully
    console.log('🧪 Testing table creation...')
    const { data, error } = await supabase
      .from('raw_materials')
      .select('id, name, current_stock')
      .limit(1)
    
    if (error) {
      console.error('❌ Error testing raw_materials table:', error)
      return false
    }
    
    console.log('✅ raw_materials table created successfully!')
    console.log(`📊 Sample data: ${data.length > 0 ? data[0].name : 'No data yet'}`)
    
    // Test production_material_requirements table
    const { data: requirements, error: requirementsError } = await supabase
      .from('production_material_requirements')
      .select('id')
      .limit(1)
    
    if (requirementsError) {
      console.error('❌ Error testing production_material_requirements table:', requirementsError)
      return false
    }
    
    console.log('✅ production_material_requirements table created successfully!')
    
    return true
    
  } catch (error) {
    console.error('❌ Error creating tables:', error)
    return false
  }
}

async function checkExistingTables() {
  console.log('🔍 Checking existing tables...')
  
  const tables = ['raw_materials', 'production_material_requirements', 'products', 'orders', 'customers']
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(1)
    
    if (error) {
      console.log(`❌ ${table}: ${error.code === 'PGRST116' ? 'Not found' : error.message}`)
    } else {
      console.log(`✅ ${table}: Ready`)
    }
  }
}

// Main execution
async function main() {
  console.log('📋 Environment Variables:')
  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set')
  console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set')
  console.log('')
  
  // Check existing tables
  await checkExistingTables()
  console.log('')
  
  // Create missing tables
  const success = await createRawMaterialsTable()
  
  console.log('')
  if (success) {
    console.log('🎉 Database setup completed successfully!')
    console.log('🚀 Your backend should now work without the fetch errors')
    console.log('')
    console.log('📝 Next steps:')
    console.log('1. Restart your backend server: npm run dev')
    console.log('2. Test the API endpoints')
    console.log('3. Run: node test-supabase-connection.js')
  } else {
    console.log('❌ Database setup failed!')
    console.log('🔧 Please check your Supabase configuration and try again')
  }
}

main().catch(console.error)



