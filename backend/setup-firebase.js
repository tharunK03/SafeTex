const fs = require('fs')
const path = require('path')

console.log('🔥 Firebase Setup Helper for SAFT ERP')
console.log('=====================================\n')

console.log('📋 Follow these steps to set up Firebase:')
console.log('')
console.log('1. Go to https://console.firebase.google.com/')
console.log('2. Create a new project (e.g., "saft-erp")')
console.log('3. Enable Firestore Database')
console.log('4. Go to Project Settings > Service Accounts')
console.log('5. Generate a new private key (download JSON file)')
console.log('')

// Check if .env file exists
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  console.log('✅ Found .env file')
  
  // Read current .env content
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  // Check if Firebase config exists
  if (envContent.includes('FIREBASE_PROJECT_ID')) {
    console.log('✅ Firebase configuration found in .env')
    
    // Extract project ID
    const projectIdMatch = envContent.match(/FIREBASE_PROJECT_ID=(.+)/)
    if (projectIdMatch) {
      const projectId = projectIdMatch[1].trim()
      console.log(`📊 Current project ID: ${projectId}`)
      
      if (projectId && projectId !== 'your-project-id-here') {
        console.log('✅ Project ID is configured')
      } else {
        console.log('⚠️  Project ID needs to be updated')
      }
    }
  } else {
    console.log('⚠️  Firebase configuration not found in .env')
    console.log('📝 Add the following to your .env file:')
    console.log('')
    console.log('# Firebase Configuration')
    console.log('FIREBASE_PROJECT_ID=your-project-id-here')
    console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"')
    console.log('FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com')
    console.log('FIREBASE_CLIENT_ID=your-client-id')
    console.log('FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com')
  }
} else {
  console.log('❌ .env file not found')
  console.log('📝 Create a .env file with your Firebase configuration')
}

console.log('')
console.log('🔧 Next Steps:')
console.log('1. Update your .env file with Firebase credentials')
console.log('2. Restart your backend: pm2 restart saft-backend')
console.log('3. Test the connection: node test-firestore.js')
console.log('')
console.log('📚 For detailed instructions, see: firebase-setup-guide.md')




