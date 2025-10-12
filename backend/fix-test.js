const fs = require('fs')

let content = fs.readFileSync('./test-firestore.js', 'utf8')
content = content.replace(/firestore\./g, 'db.')
fs.writeFileSync('./test-firestore.js', content)
console.log('Test script updated!')




