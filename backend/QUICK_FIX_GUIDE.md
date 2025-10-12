# 🚨 Quick Fix Guide - Supabase Connection Issues

## Problem Identified
Your backend is failing with `TypeError: fetch failed` because your `.env` file contains placeholder values instead of actual Supabase credentials.

## Current Issue
Your `.env` file has:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
```

## Solution

### Option 1: Interactive Setup (Recommended)
```bash
cd backend
node setup-env.js
```

### Option 2: Manual Setup
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the following values:
   - Project URL (e.g., `https://your-project-id.supabase.co`)
   - API Key (anon/public) (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - Database URL (e.g., `postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres`)

5. Edit your `.env` file:
```bash
nano .env
```

6. Replace the placeholder values with your actual credentials:
```
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key
DATABASE_URL=postgresql://postgres:your-actual-password@db.your-actual-project-id.supabase.co:5432/postgres
```

### Option 3: Copy from Backup
If you have a working `.env.backup` file:
```bash
cp .env.backup .env
```

## Test the Fix
After updating your `.env` file:

1. **Test Supabase connection:**
```bash
node test-supabase-connection.js
```

2. **Restart your backend:**
```bash
npm run dev
```

3. **Test API endpoints:**
```bash
curl http://localhost:5000/health
```

## Firebase Setup (If Needed)
If you also need to set up Firebase:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Project Settings → Service Accounts
4. Generate a new private key
5. Copy the values to your `.env` file

## Common Issues

### 1. Supabase Project Not Found
- Verify your project URL is correct
- Check if your project is active in Supabase dashboard

### 2. Database Connection Failed
- Verify your database password
- Check if your IP is whitelisted (if using IP restrictions)

### 3. API Key Invalid
- Make sure you're using the `anon` key, not the `service_role` key
- Check if the key is not expired or revoked

## After Fixing
Once your environment is working:

1. **Test all endpoints:**
```bash
# Health check
curl http://localhost:5000/health

# Test with authentication (you'll need a valid token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/products
```

2. **Deploy to AWS:**
```bash
cd aws
./setup-parameters.sh  # Set up AWS parameters
./deploy-ecs.sh        # Deploy to AWS ECS
```

## Need Help?
If you're still having issues:
1. Check the Supabase dashboard for any service outages
2. Verify your network connection
3. Try creating a new Supabase project
4. Check the browser console for any CORS issues



