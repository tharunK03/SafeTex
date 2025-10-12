#!/bin/bash

# Saft ERP Frontend Deployment Script for AWS EC2
# Run this script on your EC2 instance

echo "🚀 Starting Saft ERP Frontend Deployment..."

# Install Nginx
echo "📦 Installing Nginx..."
sudo yum update -y
sudo yum install -y nginx

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd /home/ec2-user/saft-frontend
npm install

# Update API configuration
echo "🔧 Updating API configuration..."
sed -i 's|http://localhost:5000|http://13.233.109.196:5000|g' src/services/api.js

# Build production version
echo "🏗️ Building production version..."
npm run build

# Create Nginx configuration
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/conf.d/saft.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 13.233.109.196;
    
    # Serve frontend
    location / {
        root /home/ec2-user/saft-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Start and enable Nginx
echo "🔄 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Test the deployment
echo "🧪 Testing deployment..."
curl -s http://localhost/health || echo "Backend not responding"
curl -s http://localhost/ | head -5 || echo "Frontend not responding"

echo "✅ Frontend deployment completed!"
echo "🌐 Your application is now available at: http://13.233.109.196"
echo "🔗 API Health Check: http://13.233.109.196/health"






