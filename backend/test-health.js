const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 5000;
let serverProcess = null;

async function startServer() {
  return new Promise((resolve) => {
    console.log('🚀 Starting server...');
    serverProcess = spawn('node', [path.join(__dirname, 'src', 'index.js')], {
      env: { ...process.env, NODE_ENV: 'development', PORT: PORT.toString() },
      stdio: 'inherit'
    });

    // Give the server some time to start
    setTimeout(resolve, 2000);
  });
}

function testHealth() {
  console.log(`\n🔍 Testing connection to port ${PORT}...`);
  
  const options = {
    hostname: '127.0.0.1',
    port: PORT,
    path: '/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 5000 // 5 second timeout
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Connected to server on port ${PORT}!`);
    console.log(`📡 Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('\n🔍 Server Health Status:');
        console.log('------------------------');
        console.log(`🏷️  Status: ${jsonData.status}`);
        console.log(`🌍 Environment: ${jsonData.environment}`);
        console.log(`⏱️  Uptime: ${Math.floor(jsonData.uptime / 60)} minutes`);
        console.log(`\n📡 Supabase Connection:`);
        console.log(`Status: ${jsonData.supabase?.status}`);
        if (jsonData.supabase?.error) {
          console.log('❌ Error:', jsonData.supabase.error);
        }
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log(`❌ Server not responding:`, error.code);
    console.log('🔄 Trying to start server...');
    
    // Try to start the server and test again
    startServer().then(() => {
      console.log('⏳ Waiting for server to be ready...');
      setTimeout(testHealth, 2000);
    });
  });

  req.on('timeout', () => {
    console.log(`⏱️  Request timed out`);
    req.destroy();
  });

  req.end();
}

// Cleanup function
function cleanup() {
  if (serverProcess) {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill();
  }
  process.exit();
}

// Handle cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start testing
console.log('🔄 Starting health check...');
testHealth();
