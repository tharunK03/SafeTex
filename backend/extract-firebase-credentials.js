const fs = require('fs')
const path = require('path')

console.log('🔑 Firebase Credentials Extractor')
console.log('==================================\n')

// Check if service account JSON exists
const possiblePaths = [
  'firebase-service-account.json',
  'service-account.json',
  'firebase-adminsdk.json',
  'saft-erp-firebase-adminsdk.json'
]

let serviceAccountPath = null
for (const filePath of possiblePaths) {
  if (fs.existsSync(filePath)) {
    serviceAccountPath = filePath
    break
  }
}

if (serviceAccountPath) {
  console.log(`✅ Found service account file: ${serviceAccountPath}`)
  
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
    
    console.log('\n📋 Add these to your .env file:')
    console.log('')
    console.log('# Firebase Configuration')
    console.log(`FIREBASE_PROJECT_ID=${serviceAccount.project_id}`)
    console.log(`FIREBASE_PRIVATE_KEY="${serviceAccount.private_key}"`)
    console.log(`FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}`)
    console.log(`FIREBASE_CLIENT_ID=${serviceAccount.client_id}`)
    console.log(`FIREBASE_CLIENT_CERT_URL=${serviceAccount.client_x509_cert_url}`)
    console.log('')
    
    // Update .env file if it exists
    const envPath = path.join(__dirname, '.env')
    if (fs.existsSync(envPath)) {
      console.log('📝 Updating .env file...')
      
      let envContent = fs.readFileSync(envPath, 'utf8')
      
      // Update or add Firebase configuration
      const firebaseConfig = `# Firebase Configuration
FIREBASE_PROJECT_ID=${serviceAccount.project_id}
FIREBASE_PRIVATE_KEY="${serviceAccount.private_key}"
FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}
FIREBASE_CLIENT_ID=${serviceAccount.client_id}
FIREBASE_CLIENT_CERT_URL=${serviceAccount.client_x509_cert_url}`
      
      // Remove existing Firebase config if present
      envContent = envContent.replace(/# Firebase Configuration[\s\S]*?(?=\n[A-Z]|\n$|$)/, '')
      
      // Add new Firebase config
      envContent += '\n' + firebaseConfig + '\n'
      
      fs.writeFileSync(envPath, envContent)
      console.log('✅ .env file updated successfully!')
    } else {
      console.log('⚠️  .env file not found. Please create one with the above configuration.')
    }
    
  } catch (error) {
    console.error('❌ Error reading service account file:', error.message)
  }
} else {
  console.log('❌ Service account JSON file not found')
  console.log('')
  console.log('📥 To get your service account file:')
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts')
  console.log('2. Click "Generate new private key"')
  console.log('3. Download the JSON file')
  console.log('4. Rename it to "firebase-service-account.json" and place it in this directory')
  console.log('5. Run this script again')
}

console.log('')
console.log('🚀 After updating credentials:')
console.log('1. Restart backend: pm2 restart saft-backend')
console.log('2. Test connection: node test-firestore.js')




