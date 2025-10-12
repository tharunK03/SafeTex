#!/bin/bash

# Saft Backend Vercel Deployment Script
# This script helps deploy your backend to Vercel

echo "🚀 Saft Backend Vercel Deployment Script"
echo "========================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up environment variables..."
echo "You'll need to set these environment variables in Vercel:"
echo ""
echo "Required Variables:"
echo "- DATABASE_URL"
echo "- SUPABASE_URL" 
echo "- SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo "- FIREBASE_PROJECT_ID"
echo "- FIREBASE_PRIVATE_KEY"
echo "- FIREBASE_CLIENT_EMAIL"
echo "- JWT_SECRET"
echo "- CORS_ORIGIN"
echo "- NODE_ENV"
echo ""

read -p "Have you set up all environment variables? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set up environment variables first. Run: vercel env add <VARIABLE_NAME>"
    exit 1
fi

echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Test your API endpoints"
echo "2. Update your frontend to use the new backend URL"
echo "3. Check the deployment logs if needed: vercel logs"
echo ""
echo "🔗 Your backend is now live on Vercel!"

