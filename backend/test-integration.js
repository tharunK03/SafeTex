const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 5000;
let serverProcess = null;
let authToken = null;

// Test configuration
const tests = {
  customer: {
    data: {
      name: "Test Customer",
      contact_person: "John Doe",
      email: "test@example.com",
      phone: "+919876543210", // Valid Indian mobile number format
      address: "123 Test St, Test City, TS 12345",
      gst_no: "29AAAAA0000A1Z5" // Example GST number
    }
  },
  invoice: {
    data: {
      customerId: null, // Will be set after customer creation
      items: [
        {
          productId: 1,
          quantity: 2,
          price: 100
        }
      ],
      totalAmount: 200,
      status: "pending"
    }
  }
};

// HTTP request helper
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Login helper
async function login() {
  console.log('\n🔐 Logging in with demo credentials...');
  
  const loginData = {
    email: 'admin@saft.com',
    password: 'admin123'
  };

  const options = {
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, loginData);
    if (response.status === 200 && response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Login successful!');
      return true;
    } else {
      console.error('❌ Login failed:', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Login request failed:', error.message);
    return false;
  }
}

// Create customer test
async function testCreateCustomer() {
  console.log('\n🏢 Testing customer creation...');
  
  const options = {
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/customers-pg',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };

  try {
    const response = await makeRequest(options, tests.customer.data);
    if (response.status === 201 || response.status === 200) {
      console.log('✅ Customer created successfully!');
      console.log('📋 Customer details:', response.data);
      tests.invoice.data.customerId = response.data.id;
      return true;
    } else {
      console.error('❌ Customer creation failed:', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Customer creation request failed:', error.message);
    return false;
  }
}

// Generate invoice test
async function testGenerateInvoice() {
  console.log('\n📄 Testing invoice generation...');
  
  if (!tests.invoice.data.customerId) {
    console.error('❌ Cannot generate invoice: No customer ID available');
    return false;
  }

  const options = {
    hostname: '127.0.0.1',
    port: PORT,
    path: '/api/invoices',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };

  try {
    const response = await makeRequest(options, tests.invoice.data);
    if (response.status === 201 || response.status === 200) {
      console.log('✅ Invoice generated successfully!');
      console.log('📋 Invoice details:', response.data);
      
      // Test invoice download
      const invoiceId = response.data.id;
      return await testDownloadInvoice(invoiceId);
    } else {
      console.error('❌ Invoice generation failed:', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Invoice generation request failed:', error.message);
    return false;
  }
}

// Test invoice download
async function testDownloadInvoice(invoiceId) {
  console.log('\n📥 Testing invoice download...');
  
  const options = {
    hostname: '127.0.0.1',
    port: PORT,
    path: `/api/invoices/${invoiceId}/download`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    if (response.status === 200) {
      console.log('✅ Invoice download successful!');
      return true;
    } else {
      console.error('❌ Invoice download failed:', response.data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Invoice download request failed:', error.message);
    return false;
  }
}

// Server management
async function startServer() {
  return new Promise((resolve) => {
    console.log('🚀 Starting server...');
    serverProcess = spawn('node', [path.join(__dirname, 'src', 'index.js')], {
      env: { ...process.env, NODE_ENV: 'development', PORT: PORT.toString() },
      stdio: 'inherit'
    });

    // Give the server some time to start
    setTimeout(resolve, 3000);
  });
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

// Run all tests
async function runTests() {
  console.log('🔄 Starting integration tests...');

  // Login first
  if (!await login()) {
    console.error('❌ Tests aborted: Login failed');
    cleanup();
    return;
  }

  // Run customer creation test
  if (!await testCreateCustomer()) {
    console.error('❌ Tests aborted: Customer creation failed');
    cleanup();
    return;
  }

  // Run invoice generation test
  if (!await testGenerateInvoice()) {
    console.error('❌ Tests aborted: Invoice generation failed');
    cleanup();
    return;
  }

  console.log('\n✅ All tests completed successfully!');
  cleanup();
}

// Start testing
startServer()
  .then(runTests)
  .catch(error => {
    console.error('❌ Test failed:', error);
    cleanup();
  });