#!/bin/bash

# Saft ERP Backend - AWS Elastic Beanstalk Deployment Script
# This script deploys the backend to AWS Elastic Beanstalk

set -e

# Configuration
AWS_REGION="us-east-1"
APPLICATION_NAME="saft-erp-backend"
ENVIRONMENT_NAME="saft-backend-production"
SOLUTION_STACK="64bit Amazon Linux 2023 v4.0.4 running Node.js 18"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Saft ERP Backend deployment to AWS Elastic Beanstalk${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Create .ebextensions directory and configuration
echo -e "${YELLOW}📝 Creating Elastic Beanstalk configuration...${NC}"
mkdir -p .ebextensions

# Create Node.js configuration
cat > .ebextensions/nodejs.config << 'EOF'
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: 18.19.0
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 5000
  aws:elasticbeanstalk:container:nodejs:staticfiles:
    /uploads: uploads
  aws:autoscaling:launchconfiguration:
    IamInstanceProfile: aws-elasticbeanstalk-ec2-role
EOF

# Create environment variables configuration
cat > .ebextensions/environment.config << 'EOF'
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 5000
    # Add your environment variables here
    # They will be fetched from Systems Manager Parameter Store
EOF

# Create Procfile for Elastic Beanstalk
echo -e "${YELLOW}📝 Creating Procfile...${NC}"
echo "web: node src/index.js" > Procfile

# Create .ebignore file
echo -e "${YELLOW}📝 Creating .ebignore file...${NC}"
cat > .ebignore << 'EOF'
.git
.gitignore
README.md
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.nyc_output
coverage
.nyc_output
.coverage
.vscode
.idea
*.log
test-*
vercel.json
.vercelignore
aws/
Dockerfile
docker-compose.yml
.dockerignore
node_modules/.cache
EOF

# Create application.zip
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
zip -r application.zip . -x "node_modules/*" "*.git*" "test-*" "aws/*" "*.md" "Dockerfile" "docker-compose.yml" ".dockerignore"

# Check if application exists
echo -e "${YELLOW}📋 Checking if application exists...${NC}"
if aws elasticbeanstalk describe-applications --application-names $APPLICATION_NAME --region $AWS_REGION > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application exists: $APPLICATION_NAME${NC}"
else
    echo -e "${YELLOW}📝 Creating application: $APPLICATION_NAME${NC}"
    aws elasticbeanstalk create-application \
        --application-name $APPLICATION_NAME \
        --description "Saft ERP Backend Application" \
        --region $AWS_REGION
fi

# Check if environment exists
echo -e "${YELLOW}📋 Checking if environment exists...${NC}"
if aws elasticbeanstalk describe-environments --environment-names $ENVIRONMENT_NAME --region $AWS_REGION > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Environment exists: $ENVIRONMENT_NAME${NC}"
    
    # Create application version
    VERSION_LABEL="v$(date +%Y%m%d%H%M%S)"
    echo -e "${YELLOW}📝 Creating application version: $VERSION_LABEL${NC}"
    
    aws elasticbeanstalk create-application-version \
        --application-name $APPLICATION_NAME \
        --version-label $VERSION_LABEL \
        --description "Deployment $(date)" \
        --source-bundle S3Bucket=$(aws s3 mb s3://saft-eb-deployments-$(date +%s) --region $AWS_REGION | awk '{print $2}'),S3Key=application.zip \
        --region $AWS_REGION
    
    # Upload to S3
    echo -e "${YELLOW}📤 Uploading to S3...${NC}"
    aws s3 cp application.zip s3://saft-eb-deployments-$(date +%s)/application.zip --region $AWS_REGION
    
    # Deploy to existing environment
    echo -e "${YELLOW}🚀 Deploying to existing environment...${NC}"
    aws elasticbeanstalk update-environment \
        --environment-name $ENVIRONMENT_NAME \
        --version-label $VERSION_LABEL \
        --region $AWS_REGION
else
    echo -e "${YELLOW}📝 Creating environment: $ENVIRONMENT_NAME${NC}"
    
    # Create S3 bucket for deployment
    BUCKET_NAME="saft-eb-deployments-$(date +%s)"
    aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION
    
    # Upload application
    aws s3 cp application.zip s3://$BUCKET_NAME/application.zip --region $AWS_REGION
    
    # Create application version
    VERSION_LABEL="v$(date +%Y%m%d%H%M%S)"
    aws elasticbeanstalk create-application-version \
        --application-name $APPLICATION_NAME \
        --version-label $VERSION_LABEL \
        --description "Initial deployment" \
        --source-bundle S3Bucket=$BUCKET_NAME,S3Key=application.zip \
        --region $AWS_REGION
    
    # Create environment
    aws elasticbeanstalk create-environment \
        --application-name $APPLICATION_NAME \
        --environment-name $ENVIRONMENT_NAME \
        --version-label $VERSION_LABEL \
        --solution-stack-name "$SOLUTION_STACK" \
        --region $AWS_REGION
fi

# Wait for deployment to complete
echo -e "${YELLOW}⏳ Waiting for deployment to complete...${NC}"
aws elasticbeanstalk wait environment-updated --environment-names $ENVIRONMENT_NAME --region $AWS_REGION

# Get environment URL
echo -e "${YELLOW}📋 Getting deployment information...${NC}"
ENVIRONMENT_URL=$(aws elasticbeanstalk describe-environments \
    --environment-names $ENVIRONMENT_NAME \
    --region $AWS_REGION \
    --query "Environments[0].EndpointURL" \
    --output text)

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your API is available at: http://$ENVIRONMENT_URL${NC}"
echo -e "${GREEN}🔗 Health check: http://$ENVIRONMENT_URL/health${NC}"
echo -e "${GREEN}📊 Environment: $ENVIRONMENT_NAME${NC}"

# Clean up
rm -f application.zip

echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "${BLUE}1. Set up your environment variables in the Elastic Beanstalk console${NC}"
echo -e "${BLUE}2. Update your frontend to use the new API endpoint${NC}"
echo -e "${BLUE}3. Test your deployment using the health check endpoint${NC}"
echo -e "${BLUE}4. Configure SSL certificate (optional)${NC}"



