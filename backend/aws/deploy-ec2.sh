#!/bin/bash

# Saft ERP Backend - AWS EC2 Deployment Script
# This script helps you deploy the backend to AWS EC2

set -e

# Configuration
AWS_REGION="us-east-1"
INSTANCE_TYPE="t3.medium"
KEY_NAME="saft-backend-key"
SECURITY_GROUP_NAME="saft-backend-sg"
AMI_ID="ami-0c02fb55956c7d316" # Amazon Linux 2 AMI

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Saft ERP Backend - AWS EC2 Deployment${NC}"
echo -e "${BLUE}==========================================${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Function to create key pair
create_key_pair() {
    echo -e "${YELLOW}🔑 Creating EC2 key pair...${NC}"
    
    if aws ec2 describe-key-pairs --key-names $KEY_NAME --region $AWS_REGION > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Key pair $KEY_NAME already exists${NC}"
    else
        aws ec2 create-key-pair --key-name $KEY_NAME --region $AWS_REGION --query 'KeyMaterial' --output text > ${KEY_NAME}.pem
        chmod 400 ${KEY_NAME}.pem
        echo -e "${GREEN}✅ Key pair created: ${KEY_NAME}.pem${NC}"
    fi
}

# Function to create security group
create_security_group() {
    echo -e "${YELLOW}🔒 Creating security group...${NC}"
    
    # Get VPC ID
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)
    echo -e "${BLUE}📋 Using VPC: $VPC_ID${NC}"
    
    # Check if security group exists
    if aws ec2 describe-security-groups --group-names $SECURITY_GROUP_NAME --region $AWS_REGION > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Security group $SECURITY_GROUP_NAME already exists${NC}"
        SG_ID=$(aws ec2 describe-security-groups --group-names $SECURITY_GROUP_NAME --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION)
    else
        # Create security group
        SG_ID=$(aws ec2 create-security-group \
            --group-name $SECURITY_GROUP_NAME \
            --description "Security group for Saft ERP Backend" \
            --vpc-id $VPC_ID \
            --region $AWS_REGION \
            --query 'GroupId' --output text)
        
        # Add inbound rules
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 22 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 80 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 443 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 5000 \
            --cidr 0.0.0.0/0 \
            --region $AWS_REGION
        
        echo -e "${GREEN}✅ Security group created: $SG_ID${NC}"
    fi
}

# Function to launch EC2 instance
launch_instance() {
    echo -e "${YELLOW}🖥️  Launching EC2 instance...${NC}"
    
    # Create user data script
    cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y git

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /home/ec2-user/saft-backend
chown ec2-user:ec2-user /home/ec2-user/saft-backend

# Create PM2 ecosystem file
cat > /home/ec2-user/saft-backend/ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'saft-backend',
    script: 'src/index.js',
    cwd: '/home/ec2-user/saft-backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/home/ec2-user/saft-backend/logs/err.log',
    out_file: '/home/ec2-user/saft-backend/logs/out.log',
    log_file: '/home/ec2-user/saft-backend/logs/combined.log',
    time: true
  }]
}
PM2EOF

# Create logs directory
mkdir -p /home/ec2-user/saft-backend/logs
chown ec2-user:ec2-user /home/ec2-user/saft-backend/logs

# Create systemd service for PM2
cat > /etc/systemd/system/saft-backend.service << 'SERVICEEOF'
[Unit]
Description=Saft ERP Backend
After=network.target

[Service]
Type=forking
User=ec2-user
WorkingDirectory=/home/ec2-user/saft-backend
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable saft-backend.service

echo "EC2 setup completed" > /home/ec2-user/setup-complete.txt
EOF

    # Launch instance
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id $AMI_ID \
        --count 1 \
        --instance-type $INSTANCE_TYPE \
        --key-name $KEY_NAME \
        --security-group-ids $SG_ID \
        --user-data file://user-data.sh \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=saft-backend-server}]" \
        --region $AWS_REGION \
        --query 'Instances[0].InstanceId' --output text)
    
    echo -e "${GREEN}✅ Instance launched: $INSTANCE_ID${NC}"
    
    # Wait for instance to be running
    echo -e "${YELLOW}⏳ Waiting for instance to be running...${NC}"
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION
    
    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --region $AWS_REGION \
        --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
    
    echo -e "${GREEN}✅ Instance is running at: $PUBLIC_IP${NC}"
    
    # Wait for setup to complete
    echo -e "${YELLOW}⏳ Waiting for setup to complete (this may take 2-3 minutes)...${NC}"
    sleep 180
    
    # Test connection
    echo -e "${YELLOW}🔍 Testing connection...${NC}"
    if ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP "test -f /home/ec2-user/setup-complete.txt"; then
        echo -e "${GREEN}✅ Instance setup completed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Setup may still be in progress. Please wait a few more minutes.${NC}"
    fi
    
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo -e "${BLUE}1. Upload your application:${NC}"
    echo -e "${BLUE}   scp -i ${KEY_NAME}.pem -r . ec2-user@$PUBLIC_IP:/home/ec2-user/saft-backend/${NC}"
    echo -e "${BLUE}2. Connect to instance:${NC}"
    echo -e "${BLUE}   ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP${NC}"
    echo -e "${BLUE}3. Install dependencies and start application:${NC}"
    echo -e "${BLUE}   cd /home/ec2-user/saft-backend${NC}"
    echo -e "${BLUE}   npm install${NC}"
    echo -e "${BLUE}   pm2 start ecosystem.config.js${NC}"
    echo -e "${BLUE}4. Your API will be available at: http://$PUBLIC_IP:5000${NC}"
    
    # Save instance details
    cat > instance-details.txt << EOF
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
Key Pair: ${KEY_NAME}.pem
Security Group: $SG_ID
Region: $AWS_REGION
API URL: http://$PUBLIC_IP:5000
EOF
    
    echo -e "${GREEN}📄 Instance details saved to instance-details.txt${NC}"
}

# Main execution
main() {
    create_key_pair
    create_security_group
    launch_instance
}

main






