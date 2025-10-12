#!/bin/bash

# Upload Saft ERP Backend to EC2 Instance
# This script uploads your application code to the EC2 instance

set -e

# Configuration
KEY_FILE="saft-backend-key.pem"
INSTANCE_IP=""
USER="ec2-user"
APP_DIR="/home/ec2-user/saft-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📤 Uploading Saft ERP Backend to EC2${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check if instance details exist
if [ -f "instance-details.txt" ]; then
    INSTANCE_IP=$(grep "Public IP:" instance-details.txt | cut -d' ' -f3)
    echo -e "${GREEN}✅ Found instance IP: $INSTANCE_IP${NC}"
else
    echo -e "${YELLOW}📝 Please enter your EC2 instance IP address:${NC}"
    read -p "Instance IP: " INSTANCE_IP
fi

if [ -z "$INSTANCE_IP" ]; then
    echo -e "${RED}❌ Instance IP is required${NC}"
    exit 1
fi

# Check if key file exists
if [ ! -f "$KEY_FILE" ]; then
    echo -e "${RED}❌ Key file $KEY_FILE not found${NC}"
    echo -e "${YELLOW}Please make sure you have the correct key file${NC}"
    exit 1
fi

# Set correct permissions for key file
chmod 400 $KEY_FILE

echo -e "${YELLOW}📦 Preparing application for upload...${NC}"

# Create a temporary directory for upload
TEMP_DIR="saft-backend-upload"
rm -rf $TEMP_DIR
mkdir $TEMP_DIR

# Copy application files (exclude unnecessary files)
echo -e "${YELLOW}📋 Copying application files...${NC}"
cp -r src $TEMP_DIR/
cp package.json $TEMP_DIR/
cp package-lock.json $TEMP_DIR/
cp .env $TEMP_DIR/ 2>/dev/null || echo "⚠️  .env file not found, will need to be created on server"
cp ecosystem.config.js $TEMP_DIR/ 2>/dev/null || echo "⚠️  ecosystem.config.js not found, will use default"

# Create .env template if it doesn't exist
if [ ! -f "$TEMP_DIR/.env" ]; then
    cat > $TEMP_DIR/.env << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=production

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Supabase PostgreSQL Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=your-database-url

# JWT Secret
JWT_SECRET=your-jwt-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://your-frontend-domain.com
EOF
    echo -e "${YELLOW}📝 Created .env template - please update with your actual values${NC}"
fi

# Create ecosystem.config.js if it doesn't exist
if [ ! -f "$TEMP_DIR/ecosystem.config.js" ]; then
    cat > $TEMP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'saft-backend',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF
fi

# Create deployment script
cat > $TEMP_DIR/deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying Saft ERP Backend..."

# Stop existing application
pm2 stop saft-backend 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create logs directory
mkdir -p logs

# Start application
echo "🔄 Starting application..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "✅ Deployment completed!"
echo "📊 Application status:"
pm2 status
EOF

chmod +x $TEMP_DIR/deploy.sh

echo -e "${YELLOW}📤 Uploading files to EC2 instance...${NC}"

# Upload files to EC2
scp -i $KEY_FILE -r $TEMP_DIR/* $USER@$INSTANCE_IP:$APP_DIR/

echo -e "${GREEN}✅ Files uploaded successfully${NC}"

# Connect to instance and deploy
echo -e "${YELLOW}🔧 Deploying application on EC2...${NC}"
ssh -i $KEY_FILE $USER@$INSTANCE_IP "cd $APP_DIR && chmod +x deploy.sh && ./deploy.sh"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Your API is now available at: http://$INSTANCE_IP:5000${NC}"
echo -e "${BLUE}🔗 Health check: http://$INSTANCE_IP:5000/health${NC}"

# Clean up
rm -rf $TEMP_DIR

echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}1. Update your .env file with actual credentials${NC}"
echo -e "${YELLOW}2. Restart the application: pm2 restart saft-backend${NC}"
echo -e "${YELLOW}3. Check logs: pm2 logs saft-backend${NC}"
echo -e "${YELLOW}4. Update your frontend to use the new API URL${NC}"






