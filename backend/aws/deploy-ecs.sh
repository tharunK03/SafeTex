#!/bin/bash

# Saft ERP Backend - AWS ECS Deployment Script
# This script deploys the backend to AWS ECS Fargate

set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="saft-backend"
ECS_CLUSTER="production-saft-cluster"
ECS_SERVICE="production-saft-backend-service"
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Saft ERP Backend deployment to AWS ECS${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured for account: ${AWS_ACCOUNT_ID}${NC}"

# Get VPC and Subnet information
echo -e "${YELLOW}📋 Getting VPC and Subnet information...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --region $AWS_REGION | tr '\t' ',')

echo -e "${GREEN}✅ VPC ID: $VPC_ID${NC}"
echo -e "${GREEN}✅ Subnets: $SUBNET_IDS${NC}"

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}📦 Creating ECR repository...${NC}"
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION > /dev/null 2>&1; then
    aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
    echo -e "${GREEN}✅ ECR repository created: $ECR_REPOSITORY${NC}"
else
    echo -e "${GREEN}✅ ECR repository already exists: $ECR_REPOSITORY${NC}"
fi

# Get ECR login token
echo -e "${YELLOW}🔐 Getting ECR login token...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -t $ECR_REPOSITORY:latest .

echo -e "${YELLOW}📤 Tagging image for ECR...${NC}"
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo -e "${YELLOW}📤 Pushing image to ECR...${NC}"
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo -e "${GREEN}✅ Docker image pushed successfully${NC}"

# Update CloudFormation template with actual values
echo -e "${YELLOW}📝 Updating CloudFormation template...${NC}"
sed -i.bak "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" aws/cloudformation-template.yaml
sed -i.bak "s/YOUR_REGION/$AWS_REGION/g" aws/cloudformation-template.yaml
sed -i.bak "s|YOUR_VPC_ID|$VPC_ID|g" aws/cloudformation-template.yaml
sed -i.bak "s/YOUR_SUBNET_IDS/$SUBNET_IDS/g" aws/cloudformation-template.yaml

# Deploy CloudFormation stack
echo -e "${YELLOW}☁️  Deploying CloudFormation stack...${NC}"
STACK_NAME="$ENVIRONMENT-saft-infrastructure"

if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION > /dev/null 2>&1; then
    echo -e "${YELLOW}📝 Updating existing CloudFormation stack...${NC}"
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://aws/cloudformation-template.yaml \
        --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
                   ParameterKey=VpcId,ParameterValue=$VPC_ID \
                   ParameterKey=SubnetIds,ParameterValue="$SUBNET_IDS" \
                   ParameterKey=ImageUri,ParameterValue="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest" \
        --capabilities CAPABILITY_NAMED_IAM \
        --region $AWS_REGION
else
    echo -e "${YELLOW}📝 Creating new CloudFormation stack...${NC}"
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://aws/cloudformation-template.yaml \
        --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
                   ParameterKey=VpcId,ParameterValue=$VPC_ID \
                   ParameterKey=SubnetIds,ParameterValue="$SUBNET_IDS" \
                   ParameterKey=ImageUri,ParameterValue="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest" \
        --capabilities CAPABILITY_NAMED_IAM \
        --region $AWS_REGION
fi

# Wait for stack to complete
echo -e "${YELLOW}⏳ Waiting for CloudFormation stack to complete...${NC}"
aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $AWS_REGION || \
aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $AWS_REGION

# Get the load balancer DNS name
echo -e "${YELLOW}📋 Getting deployment information...${NC}"
LOAD_BALANCER_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" \
    --output text)

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your API is available at: http://$LOAD_BALANCER_DNS${NC}"
echo -e "${GREEN}🔗 Health check: http://$LOAD_BALANCER_DNS/health${NC}"
echo -e "${GREEN}📊 ECS Cluster: $ECS_CLUSTER${NC}"
echo -e "${GREEN}🚀 ECS Service: $ECS_SERVICE${NC}"

# Restore original template
mv aws/cloudformation-template.yaml.bak aws/cloudformation-template.yaml

echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "${BLUE}1. Set up your environment variables in AWS Systems Manager Parameter Store${NC}"
echo -e "${BLUE}2. Update your frontend to use the new API endpoint${NC}"
echo -e "${BLUE}3. Configure custom domain and SSL certificate (optional)${NC}"



