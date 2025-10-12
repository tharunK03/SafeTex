#!/bin/bash

# Saft ERP Backend - AWS Lambda Deployment Script
# This script deploys the backend to AWS Lambda using Serverless Framework

set -e

# Configuration
AWS_REGION="us-east-1"
STAGE="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Saft ERP Backend deployment to AWS Lambda${NC}"

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo -e "${RED}❌ Serverless Framework not installed. Installing...${NC}"
    npm install -g serverless
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Serverless Framework and AWS CLI configured${NC}"

# Create Lambda handler
echo -e "${YELLOW}📝 Creating Lambda handler...${NC}"
cat > src/lambda.js << 'EOF'
const serverless = require('serverless-http');
const app = require('./index');

// Export the handler
module.exports.handler = serverless(app);
EOF

# Create serverless.yml
echo -e "${YELLOW}📝 Creating serverless.yml...${NC}"
cat > serverless.yml << EOF
service: saft-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: ${AWS_REGION}
  stage: ${STAGE}
  environment:
    NODE_ENV: production
    PORT: 5000
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - ssm:GetParameter
            - ssm:GetParameters
            - ssm:GetParametersByPath
          Resource: "arn:aws:ssm:${AWS_REGION}:*:parameter/saft/*"
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource: "*"
  timeout: 30
  memorySize: 1024

functions:
  api:
    handler: src/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors:
            origin: '*'
            headers:
              - Content-Type
              - X-Amz-Date
              - Authorization
              - X-Api-Key
              - X-Amz-Security-Token
              - X-Amz-User-Agent
            allowCredentials: false
      - http:
          path: /
          method: ANY
          cors:
            origin: '*'
            headers:
              - Content-Type
              - X-Amz-Date
              - Authorization
              - X-Api-Key
              - X-Amz-Security-Token
              - X-Amz-User-Agent
            allowCredentials: false

plugins:
  - serverless-http

package:
  exclude:
    - node_modules/.cache/**
    - .git/**
    - test-*
    - *.md
    - Dockerfile
    - docker-compose.yml
    - .dockerignore
    - aws/**

custom:
  serverless-http:
    stripBasePath: true
EOF

# Install serverless-http if not already installed
if ! npm list serverless-http > /dev/null 2>&1; then
    echo -e "${YELLOW}📦 Installing serverless-http...${NC}"
    npm install serverless-http
fi

# Deploy to AWS Lambda
echo -e "${YELLOW}☁️  Deploying to AWS Lambda...${NC}"
serverless deploy --stage $STAGE --region $AWS_REGION

# Get the API Gateway URL
echo -e "${YELLOW}📋 Getting deployment information...${NC}"
API_URL=$(serverless info --stage $STAGE --region $AWS_REGION | grep "endpoint:" | awk '{print $2}')

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your API is available at: $API_URL${NC}"
echo -e "${GREEN}🔗 Health check: $API_URL/health${NC}"

echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "${BLUE}1. Set up your environment variables in AWS Systems Manager Parameter Store${NC}"
echo -e "${BLUE}2. Update your frontend to use the new API endpoint${NC}"
echo -e "${BLUE}3. Test your deployment using the health check endpoint${NC}"
echo -e "${BLUE}4. Configure custom domain (optional)${NC}"



