#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupEnvironment() {
  console.log('🔧 Saft ERP Backend - Environment Setup')
  console.log('=====================================')
  console.log('This script will help you configure your environment variables.')
  console.log('')

  const envPath = path.join(__dirname, '.env')
  const envExamplePath = path.join(__dirname, 'env.example')
  
  // Check if .env exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Do you want to overwrite it? (y/N): ')
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('❌ Setup cancelled.')
      rl.close()
      return
    }
  }

  console.log('📝 Please provide the following information:')
  console.log('')

  // Server Configuration
  console.log('🖥️  Server Configuration:')
  const port = await question('Port (default: 5000): ') || '5000'
  const nodeEnv = await question('Environment (development/production, default: development): ') || 'development'
  
  // Supabase Configuration
  console.log('')
  console.log('🔗 Supabase Configuration:')
  console.log('Get these from your Supabase project dashboard at https://supabase.com/dashboard')
  const supabaseUrl = await question('Supabase URL (https://your-project-id.supabase.co): ')
  const supabaseAnonKey = await question('Supabase Anonymous Key: ')
  const databaseUrl = await question('Database URL (postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres): ')
  
  // Firebase Configuration
  console.log('')
  console.log('🔥 Firebase Configuration:')
  console.log('Get these from your Firebase project settings')
  const firebaseProjectId = await question('Firebase Project ID: ')
  const firebasePrivateKey = await question('Firebase Private Key (paste the entire key including -----BEGIN PRIVATE KEY-----): ')
  const firebaseClientEmail = await question('Firebase Client Email: ')
  
  // JWT Secret
  console.log('')
  console.log('🔑 Security Configuration:')
  const jwtSecret = await question('JWT Secret (generate a strong random string): ') || generateRandomString(64)
  
  // SMTP Configuration (Optional)
  console.log('')
  console.log('📧 Email Configuration (Optional):')
  const smtpHost = await question('SMTP Host (default: smtp.gmail.com): ') || 'smtp.gmail.com'
  const smtpPort = await question('SMTP Port (default: 587): ') || '587'
  const smtpUser = await question('SMTP Username (optional): ')
  const smtpPass = await question('SMTP Password (optional): ')
  
  // CORS Configuration
  console.log('')
  console.log('🌐 CORS Configuration:')
  const corsOrigin = await question('CORS Origin (default: http://localhost:3000): ') || 'http://localhost:3000'
  
  // Create .env content
  const envContent = `# Server Configuration
PORT=${port}
NODE_ENV=${nodeEnv}

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=${firebaseProjectId}
FIREBASE_PRIVATE_KEY="${firebasePrivateKey}"
FIREBASE_CLIENT_EMAIL=${firebaseClientEmail}

# Supabase PostgreSQL Configuration
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}
DATABASE_URL=${databaseUrl}

# JWT Secret
JWT_SECRET=${jwtSecret}

# Email Configuration (for notifications)
SMTP_HOST=${smtpHost}
SMTP_PORT=${smtpPort}
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=${corsOrigin}
`

  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent)
    console.log('')
    console.log('✅ Environment file created successfully!')
    console.log('📁 Location: ' + envPath)
    
    // Test the configuration
    console.log('')
    console.log('🧪 Testing configuration...')
    require('dotenv').config({ path: envPath })
    
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.DATABASE_URL) {
      console.log('✅ Environment variables loaded successfully')
      console.log('')
      console.log('🚀 Next steps:')
      console.log('1. Restart your backend server: npm run dev')
      console.log('2. Test the API endpoints')
      console.log('3. Run: node test-supabase-connection.js')
    } else {
      console.log('❌ Some environment variables are missing')
    }
    
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message)
  }
  
  rl.close()
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Run the setup
setupEnvironment().catch(console.error)



