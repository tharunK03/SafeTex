# Render Deployment Checklist

## ✅ Pre-Deployment (Completed)
- [x] Repository is on GitHub
- [x] render.yaml configuration created
- [x] package.json updated with build script
- [x] Code committed and pushed to main branch
- [x] PORT environment variable configured in app

## 🚀 Deployment Steps

### 1. Render Account Setup
- [ ] Sign up at [render.com](https://render.com)
- [ ] Verify email address
- [ ] Connect GitHub account

### 2. Create Web Service
- [ ] Click "New +" → "Web Service"
- [ ] Select repository: `tharunK03/SafeTex`
- [ ] Configure service settings:
  - [ ] Name: `saft-erp-backend`
  - [ ] Environment: `Node`
  - [ ] Region: Choose closest to your users
  - [ ] Branch: `main`
  - [ ] Root Directory: `backend`
  - [ ] Build Command: `npm install --production`
  - [ ] Start Command: `npm start`
  - [ ] Plan: `Starter` (free tier)

### 3. Environment Variables
Set these in the Render dashboard:

#### Required Variables:
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000` (auto-set by Render)
- [ ] `SUPABASE_URL` = `https://vuehwcpxvpalqyfnukes.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZWh3Y3B4dnBhbHF5Zm51a2VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjcxNDgsImV4cCI6MjA3MDc0MzE0OH0.xTaIbpiW7Z7q5lWrB1y4d6-y3_WqGBeI5vgynfAVblU`
- [ ] `DATABASE_URL` = `postgresql://postgres:tharundb123@db.vuehwcpxvpalqyfnukes.supabase.co:5432/postgres`
- [ ] `FIREBASE_PROJECT_ID` = `safetex-749f9`
- [ ] `JWT_SECRET` = `your-super-secret-jwt-key-change-this-in-production`
- [ ] `CORS_ORIGIN` = `https://your-frontend-domain.onrender.com`

#### Optional Variables:
- [ ] `FIREBASE_PRIVATE_KEY` = (if you have Firebase admin setup)
- [ ] `FIREBASE_CLIENT_EMAIL` = (if you have Firebase admin setup)
- [ ] `SMTP_HOST` = (if you want email functionality)
- [ ] `SMTP_PORT` = (if you want email functionality)
- [ ] `SMTP_USER` = (if you want email functionality)
- [ ] `SMTP_PASS` = (if you want email functionality)

### 4. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Check deployment logs for any errors
- [ ] Verify service is running

## 🧪 Post-Deployment Testing

### Health Check
- [ ] Visit: `https://your-service-name.onrender.com/health`
- [ ] Should return: `{"status":"OK","message":"Saft ERP API is running"}`

### API Testing
- [ ] Test login endpoint:
  ```bash
  curl -X POST https://your-service-name.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@saft.com", "password": "admin123"}'
  ```
- [ ] Should return success with token

### Frontend Integration
- [ ] Update frontend API URL to your Render URL
- [ ] Test complete login flow
- [ ] Verify all API endpoints work

## 🔧 Troubleshooting

### Common Issues:
- [ ] Build fails → Check package.json dependencies
- [ ] Service won't start → Check logs for errors
- [ ] Database connection fails → Verify DATABASE_URL
- [ ] CORS errors → Update CORS_ORIGIN environment variable
- [ ] 404 errors → Check API routes and health endpoint

### Debug Steps:
- [ ] Check Render logs in dashboard
- [ ] Verify all environment variables are set
- [ ] Test health endpoint
- [ ] Check database connectivity
- [ ] Verify CORS configuration

## 🎉 Success Indicators
- [ ] Service shows "Live" status in Render dashboard
- [ ] Health endpoint returns 200 OK
- [ ] Login endpoint works with demo credentials
- [ ] Frontend can connect to API
- [ ] All API endpoints respond correctly

## 📞 Next Steps After Deployment
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring alerts
- [ ] Set up automated backups
- [ ] Update frontend configuration
- [ ] Test all user workflows
- [ ] Document API endpoints for team

---

**Your API URL will be:** `https://your-service-name.onrender.com`
**Health Check:** `https://your-service-name.onrender.com/health`
