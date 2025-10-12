# Saft ERP Backend - Render Deployment Guide

This guide will help you deploy your Saft ERP Backend to Render, a modern cloud platform that makes deployment simple and cost-effective.

## 🚀 Why Render?

- **Simple Deployment**: Connect your Git repository and deploy in minutes
- **Automatic HTTPS**: SSL certificates included for free
- **Environment Variables**: Secure management of sensitive data
- **Auto-deploy**: Deploy automatically on every Git push
- **Free Tier**: Perfect for development and small projects
- **Custom Domains**: Easy custom domain setup
- **Zero Configuration**: No complex setup required

## 📋 Prerequisites

1. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Environment Variables**: Your current `.env` file values

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Your Repository

Your repository should contain:
- ✅ `package.json` with start script
- ✅ `render.yaml` configuration file
- ✅ All source code in `src/` directory
- ✅ Environment variables documented

### Step 2: Create Render Account and Connect Repository

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" and select "Web Service"
3. Connect your Git repository (GitHub/GitLab/Bitbucket)
4. Select your repository

### Step 3: Configure Your Service

**Basic Settings:**
- **Name**: `saft-erp-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` (if your repo has frontend and backend)
- **Build Command**: `npm install --production`
- **Start Command**: `npm start`

**Advanced Settings:**
- **Plan**: Start with `Starter` (free tier)
- **Auto-Deploy**: `Yes` (deploy on every push)
- **Health Check Path**: `/health`

### Step 4: Set Environment Variables

In the Render dashboard, go to "Environment" tab and add these variables:

#### Required Variables:
```
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://vuehwcpxvpalqyfnukes.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZWh3Y3B4dnBhbHF5Zm51a2VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjcxNDgsImV4cCI6MjA3MDc0MzE0OH0.xTaIbpiW7Z7q5lWrB1y4d6-y3_WqGBeI5vgynfAVblU
DATABASE_URL=postgresql://postgres:tharundb123@db.vuehwcpxvpalqyfnukes.supabase.co:5432/postgres
FIREBASE_PROJECT_ID=safetex-749f9
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=https://your-frontend-domain.onrender.com
```

#### Optional Variables:
```
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Start your service
   - Provide you with a URL

### Step 6: Test Your Deployment

Your API will be available at: `https://your-service-name.onrender.com`

Test endpoints:
- **Health Check**: `https://your-service-name.onrender.com/health`
- **API Base**: `https://your-service-name.onrender.com/api`

## 🔧 Configuration Files

### render.yaml (Already Created)
This file contains your service configuration for automatic deployment.

### package.json Updates
Added build script for Render deployment.

## 🌐 Custom Domain (Optional)

1. In your Render dashboard, go to "Settings"
2. Click "Custom Domains"
3. Add your domain (e.g., `api.yourdomain.com`)
4. Follow the DNS configuration instructions
5. Render will automatically provision SSL certificates

## 💰 Pricing

### Free Tier (Perfect for Development)
- **$0/month**
- 750 hours per month (enough for always-on)
- 512MB RAM
- Shared CPU
- Automatic SSL
- Custom domains

### Starter Plan (Recommended for Production)
- **$7/month**
- Always-on
- 512MB RAM
- Shared CPU
- Automatic SSL
- Custom domains
- Better performance

## 🔍 Monitoring and Logs

### View Logs
1. Go to your service dashboard
2. Click "Logs" tab
3. View real-time logs

### Health Monitoring
- Render automatically monitors your `/health` endpoint
- Service will restart if health checks fail
- Email notifications for service issues

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check your package.json has correct scripts
# Ensure all dependencies are in dependencies, not devDependencies
# Check for any build errors in the logs
```

#### 2. Environment Variables
```bash
# Double-check all required environment variables are set
# Ensure no typos in variable names
# Check that sensitive values are properly formatted
```

#### 3. Port Configuration
```bash
# Render automatically sets PORT environment variable
# Your app should use process.env.PORT || 5000
# Make sure your app listens on the correct port
```

#### 4. CORS Issues
```bash
# Update CORS_ORIGIN to your frontend URL
# For development: http://localhost:3000
# For production: https://your-frontend.onrender.com
```

### Debug Commands

#### Check Service Status
```bash
# In Render dashboard, check:
# - Service status (Running/Stopped)
# - Recent deployments
# - Log output
# - Health check status
```

#### Test API Endpoints
```bash
# Test health endpoint
curl https://your-service-name.onrender.com/health

# Test API endpoint
curl https://your-service-name.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@saft.com", "password": "admin123"}'
```

## 🔄 Auto-Deployment

### Automatic Deploys
- Every push to your main branch triggers a new deployment
- Render builds and deploys automatically
- Rollback to previous versions available

### Manual Deploys
- Click "Manual Deploy" in the dashboard
- Choose specific branch or commit
- Useful for testing specific versions

## 📊 Performance Optimization

### For Better Performance:
1. **Upgrade Plan**: Move to Starter plan for better resources
2. **Optimize Dependencies**: Remove unused packages
3. **Database Connection Pooling**: Already configured in your Supabase setup
4. **Caching**: Consider Redis for session storage
5. **CDN**: Use CloudFlare for static assets

### Resource Monitoring:
- Monitor CPU and memory usage in dashboard
- Set up alerts for resource limits
- Scale up if needed

## 🔒 Security Best Practices

### Environment Variables
- Never commit sensitive data to Git
- Use Render's secure environment variable storage
- Rotate secrets regularly

### HTTPS
- Render provides automatic HTTPS
- Force HTTPS redirects (configure in your app)
- Use secure cookies and headers

### Database Security
- Use connection strings with SSL
- Enable Row Level Security (RLS) in Supabase
- Regular security updates

## 📞 Support

### Render Support
- [Render Documentation](https://render.com/docs)
- [Community Forum](https://community.render.com)
- Email support for paid plans

### Your Application
- Check logs first for errors
- Verify environment variables
- Test endpoints individually
- Monitor database connections

## 🎉 Success!

Once deployed, your Saft ERP Backend will be:
- ✅ Available 24/7
- ✅ Automatically updated on Git pushes
- ✅ Secured with HTTPS
- ✅ Monitored for health
- ✅ Ready for production use

**Your API URL**: `https://your-service-name.onrender.com`
**Health Check**: `https://your-service-name.onrender.com/health`

## 🔗 Next Steps

1. **Update Frontend**: Point your frontend to the new API URL
2. **Custom Domain**: Set up a custom domain for your API
3. **Monitoring**: Set up additional monitoring if needed
4. **Scaling**: Upgrade plan as your usage grows
5. **Backup**: Ensure your Supabase database has proper backups

---

**Need Help?** Check the Render documentation or contact support through the Render dashboard.
