const fs = require('fs')
const path = require('path')

const routesDir = './src/routes'
const files = [
  'customers-firestore.js',
  'orders-firestore.js', 
  'raw-materials-firestore.js'
]

files.forEach(file => {
  const filePath = path.join(routesDir, file)
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Replace firestore with db
  content = content.replace(/const firestore = require\('\.\.\/services\/firestore-rest'\)/g, "const db = require('../services/memory-db')")
  content = content.replace(/firestore\./g, 'db.')
  
  fs.writeFileSync(filePath, content)
  console.log(`Updated ${file}`)
})

console.log('All routes updated!')




