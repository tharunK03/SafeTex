# Database Connection Issues - Deployment Fixes

## 🚨 **Common Database Connection Problems**

### **1. Environment Variables Not Set**
- **Problem**: `DATABASE_URL`, `SUPABASE_URL`, etc. not configured in deployment platform
- **Solution**: Set all required environment variables in your deployment platform

### **2. SSL Connection Issues**
- **Problem**: Different platforms require different SSL configurations
- **Solution**: Update SSL settings based on platform

### **3. Connection String Format**
- **Problem**: Wrong connection string format for different platforms
- **Solution**: Use platform-specific connection string format

### **4. Network/Firewall Issues**
- **Problem**: Platform can't reach database
- **Solution**: Whitelist platform IPs or use proper connection settings

---

## 🔧 **Platform-Specific Fixes**

### **Render.com**
```bash
# Environment Variables to Set:
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Connection Pool Settings:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // Reduce for Render
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
})
```

### **Railway**
```bash
# Environment Variables:
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:port/railway
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**Connection Pool Settings:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5, // Railway has limits
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 3000,
})
```

### **Vercel**
```bash
# Environment Variables:
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**Connection Pool Settings:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1, // Vercel serverless - single connection
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
})
```

### **Heroku**
```bash
# Environment Variables:
DATABASE_URL=postgresql://username:password@hostname:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**Connection Pool Settings:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

---

## 🛠️ **Updated Database Configuration**

Here's the improved database configuration that works across all platforms:

```javascript
const { createClient } = require('@supabase/supabase-js')
const { Pool } = require('pg')

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Platform-specific connection pool configuration
const getPoolConfig = () => {
  const baseConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }

  // Platform detection
  if (process.env.VERCEL) {
    // Vercel serverless
    return {
      ...baseConfig,
      max: 1,
      idleTimeoutMillis: 0,
      connectionTimeoutMillis: 10000,
    }
  } else if (process.env.RAILWAY_ENVIRONMENT) {
    // Railway
    return {
      ...baseConfig,
      max: 5,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 3000,
    }
  } else if (process.env.RENDER) {
    // Render
    return {
      ...baseConfig,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    }
  } else {
    // Default (Heroku, local development)
    return {
      ...baseConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  }
}

const pool = new Pool(getPoolConfig())

// Enhanced connection test with retry logic
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT NOW()')
      console.log('✅ PostgreSQL database connected successfully')
      console.log(`📊 Database time: ${result.rows[0].now}`)
      client.release()
      return true
    } catch (error) {
      console.error(`❌ PostgreSQL connection attempt ${i + 1} failed:`, error.message)
      if (i === retries - 1) {
        console.error('❌ All connection attempts failed')
        return false
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  return false
}
```

---

## 🔍 **Debugging Steps**

### **1. Check Environment Variables**
```bash
# In your deployment platform, verify these are set:
echo $DATABASE_URL
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

### **2. Test Connection String**
```bash
# Test your connection string locally:
psql "your-database-url"
```

### **3. Check Platform Logs**
- **Render**: Check build logs and runtime logs
- **Railway**: Check deployment logs
- **Vercel**: Check function logs
- **Heroku**: Check app logs

### **4. Network Connectivity**
```javascript
// Add this to test network connectivity
const testNetworkConnectivity = async () => {
  try {
    const response = await fetch('https://api.supabase.co/health')
    console.log('✅ Network connectivity OK')
  } catch (error) {
    console.error('❌ Network connectivity issue:', error.message)
  }
}
```

---

## 🚀 **Quick Fix Implementation**

1. **Update your `src/config/supabase.js`** with the improved configuration
2. **Set environment variables** in your deployment platform
3. **Test the connection** before deploying
4. **Monitor logs** during deployment

---

## 📋 **Environment Variables Checklist**

Make sure these are set in your deployment platform:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `FIREBASE_PRIVATE_KEY` - Firebase private key
- [ ] `FIREBASE_CLIENT_EMAIL` - Firebase client email
- [ ] `JWT_SECRET` - JWT secret key
- [ ] `NODE_ENV` - Set to 'production'
- [ ] `CORS_ORIGIN` - Your frontend URL

---

## 🆘 **Still Having Issues?**

1. **Check Supabase Dashboard** - Ensure your project is active
2. **Verify Database Credentials** - Test with a simple connection
3. **Check Platform Status** - Ensure deployment platform is working
4. **Review Logs** - Look for specific error messages
5. **Test Locally** - Ensure it works in development first

