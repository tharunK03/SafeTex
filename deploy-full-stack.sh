#!/bin/bash

# Full Stack Deployment Script for SAFT Application
# This script deploys both backend and frontend to EC2

set -e

EC2_IP="13.233.109.196"
KEY_PATH="/Users/tharun/Downloads/safe.pem"
EC2_USER="ec2-user"

echo "🚀 Starting Full Stack Deployment to EC2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    print_error "SSH key file not found at $KEY_PATH"
    exit 1
fi

# Set proper permissions for SSH key
chmod 400 "$KEY_PATH"

print_status "Step 1: Checking EC2 instance status..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
    echo 'EC2 instance is accessible'
    echo 'Current directory:'
    pwd
    echo 'Node.js version:'
    node --version
    echo 'NPM version:'
    npm --version
    echo 'PM2 status:'
    pm2 status || echo 'PM2 not running'
"

print_status "Step 2: Stopping existing backend processes..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
    cd /home/ec2-user
    pm2 stop all || true
    pm2 delete all || true
    pkill -f 'node.*index.js' || true
    sleep 2
"

print_status "Step 3: Uploading backend code..."
# Create backend directory structure
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
    mkdir -p /home/ec2-user/saft-backend
    mkdir -p /home/ec2-user/saft-frontend
"

# Upload backend files (excluding node_modules)
rsync -avz --progress --exclude 'node_modules' --exclude '.git' --exclude 'uploads' \
    -e "ssh -i $KEY_PATH -o StrictHostKeyChecking=no" \
    backend/ "$EC2_USER@$EC2_IP:/home/ec2-user/saft-backend/"

print_status "Step 4: Installing backend dependencies..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
    cd /home/ec2-user/saft-backend
    echo 'Installing backend dependencies...'
    npm install --production
    echo 'Backend dependencies installed'
"

print_status "Step 5: Setting up backend environment..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
    cd /home/ec2-user/saft-backend
    echo 'Setting up environment variables...'
    cat > .env << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres

# Server Configuration
PORT=5000
NODE_ENV=production

# Firebase Configuration (if needed)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-client-email
EOF
    echo 'Environment file created. Please update with your actual credentials.'
"

print_status "Step 6: Starting backend with PM2..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
    cd /home/ec2-user/saft-backend
    echo 'Starting backend with PM2...'
    pm2 start src/index.js --name 'saft-backend' --instances 1
    pm2 save
    pm2 startup
    echo 'Backend started with PM2'
    pm2 status
"

print_status "Step 7: Building frontend locally..."
cd frontend
echo "Installing frontend dependencies..."
npm install

echo "Building frontend for production..."
npm run build

print_status "Step 8: Uploading frontend build..."
# Upload frontend build
rsync -avz --progress \
    -e "ssh -i $KEY_PATH -o StrictHostKeyChecking=no" \
    dist/ "$EC2_USER@$EC2_IP:/home/ec2-user/saft-frontend/"

print_status "Step 9: Installing and configuring Nginx..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
    echo 'Installing Nginx...'
    sudo yum update -y
    sudo yum install -y nginx
    
    echo 'Configuring Nginx...'
    sudo tee /etc/nginx/conf.d/saft.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name $EC2_IP;
    
    # Serve frontend static files
    location / {
        root /home/ec2-user/saft-frontend;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Handle CORS
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    
    if (\$request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
}
EOF

    echo 'Starting Nginx...'
    sudo systemctl enable nginx
    sudo systemctl start nginx
    sudo systemctl status nginx --no-pager
"

print_status "Step 10: Testing deployment..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
    echo 'Testing backend health...'
    curl -f http://localhost:5000/api/health || echo 'Backend health check failed'
    
    echo 'Testing Nginx...'
    curl -f http://localhost/ || echo 'Frontend not accessible'
    
    echo 'Checking PM2 status...'
    pm2 status
    
    echo 'Checking Nginx status...'
    sudo systemctl status nginx --no-pager
"

print_status "✅ Deployment completed!"
print_status "🌐 Frontend URL: http://$EC2_IP"
print_status "🔧 Backend API: http://$EC2_IP/api"
print_status ""
print_warning "IMPORTANT: Please update the .env file on EC2 with your actual Supabase credentials:"
print_warning "1. SSH into your EC2: ssh -i $KEY_PATH $EC2_USER@$EC2_IP"
print_warning "2. Edit: nano /home/ec2-user/saft-backend/.env"
print_warning "3. Update SUPABASE_URL and SUPABASE_ANON_KEY with your actual values"
print_warning "4. Restart backend: pm2 restart saft-backend"





