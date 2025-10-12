# Saft ERP Backend - AWS Deployment Guide

This guide provides comprehensive instructions for deploying the Saft ERP Backend to AWS using multiple deployment options.

## 🏗️ Architecture Overview

Your backend will be deployed using:
- **AWS ECS Fargate**: Container orchestration (Recommended)
- **Application Load Balancer**: Traffic distribution and SSL termination
- **AWS ECR**: Container image registry
- **AWS Systems Manager Parameter Store**: Secure environment variable storage
- **AWS CloudWatch**: Logging and monitoring
- **AWS CloudFormation**: Infrastructure as Code

## 📋 Prerequisites

### 1. AWS Account Setup
- Active AWS account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- Docker installed locally
- Git installed

### 2. Required AWS Permissions
Your AWS user/role needs the following permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecs:*",
                "ecr:*",
                "ec2:*",
                "elasticloadbalancing:*",
                "iam:*",
                "ssm:*",
                "cloudformation:*",
                "logs:*"
            ],
            "Resource": "*"
        }
    ]
}
```

### 3. Environment Variables
You'll need the following environment variables from your current setup:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `JWT_SECRET`
- `SMTP_HOST` (optional)
- `SMTP_PORT` (optional)
- `SMTP_USER` (optional)
- `SMTP_PASS` (optional)
- `CORS_ORIGIN`

## 🚀 Deployment Options

### Option 1: AWS ECS Fargate (Recommended)

**Best for**: Production workloads, auto-scaling, high availability

#### Step 1: Setup Environment Variables
```bash
cd backend/aws
chmod +x setup-parameters.sh
./setup-parameters.sh
```

#### Step 2: Deploy to ECS
```bash
chmod +x deploy-ecs.sh
./deploy-ecs.sh
```

#### What this creates:
- ECS Cluster with Fargate
- Application Load Balancer
- ECR Repository
- CloudWatch Log Groups
- IAM Roles and Policies
- Security Groups
- Target Groups

### Option 2: AWS Lambda (Serverless)

**Best for**: Cost optimization, pay-per-request, simple APIs

#### Setup Serverless Framework
```bash
npm install -g serverless
npm install serverless-http
```

#### Create serverless.yml
```yaml
service: saft-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: production
  environment:
    NODE_ENV: production
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - ssm:GetParameter
            - ssm:GetParameters
          Resource: "arn:aws:ssm:*:*:parameter/saft/*"

functions:
  api:
    handler: src/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    timeout: 30
    memorySize: 1024

plugins:
  - serverless-http
```

#### Deploy to Lambda
```bash
serverless deploy
```

### Option 3: AWS Elastic Beanstalk

**Best for**: Quick deployment, managed platform

#### Create application.zip
```bash
cd backend
zip -r application.zip . -x "node_modules/*" "*.git*" "test-*"
```

#### Deploy via AWS Console
1. Go to Elastic Beanstalk console
2. Create new application
3. Choose "Web server environment"
4. Platform: Node.js
5. Upload `application.zip`
6. Configure environment variables

### Option 4: AWS EC2

**Best for**: Full control, custom configurations

#### Launch EC2 Instance
```bash
# Launch t3.medium instance with Amazon Linux 2
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --instance-type t3.medium \
    --key-name your-key-pair \
    --security-group-ids sg-xxxxxxxxx \
    --subnet-id subnet-xxxxxxxxx
```

#### Setup EC2 Instance
```bash
# Connect to instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone your-repo
cd saft/backend
# Copy your .env file
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables Setup

The deployment scripts automatically configure the following:

#### Supabase Configuration
- Database connection
- Real-time features
- Authentication

#### Firebase Configuration
- Admin SDK
- Authentication
- User management

#### Security Configuration
- JWT secrets
- CORS settings
- Rate limiting

### Database Considerations

Your current setup uses Supabase PostgreSQL. For production:

1. **Connection Pooling**: Already configured for different platforms
2. **SSL**: Enabled with `rejectUnauthorized: false`
3. **Row Level Security**: Enabled on all tables
4. **Backups**: Handled by Supabase

### File Storage

For production file storage (PDFs, uploads), consider:

1. **AWS S3**: For scalable file storage
2. **CloudFront**: For CDN distribution
3. **Update uploads handling**: Modify your code to use S3

## 📊 Monitoring and Logging

### CloudWatch Integration
- Application logs: `/ecs/production-saft-backend`
- Metrics: CPU, Memory, Request count
- Alarms: Set up for error rates and latency

### Health Checks
- Endpoint: `/health`
- Interval: 30 seconds
- Timeout: 5 seconds
- Unhealthy threshold: 3

## 🔒 Security Best Practices

### 1. Network Security
- VPC with private subnets
- Security groups with minimal access
- Application Load Balancer for SSL termination

### 2. Secrets Management
- AWS Systems Manager Parameter Store
- SecureString parameters for sensitive data
- IAM roles for access control

### 3. Container Security
- Non-root user in container
- Minimal base image (Alpine)
- Regular security updates

## 💰 Cost Optimization

### ECS Fargate Costs
- **CPU**: $0.04048 per vCPU per hour
- **Memory**: $0.004445 per GB per hour
- **Estimated monthly cost**: $30-50 for small to medium workload

### Cost Optimization Tips
1. Use Fargate Spot for non-critical workloads
2. Right-size your container resources
3. Set up auto-scaling policies
4. Monitor usage with Cost Explorer

## 🚨 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check ECS service events
aws ecs describe-services --cluster production-saft-cluster --services production-saft-backend-service

# Check CloudWatch logs
aws logs describe-log-streams --log-group-name /ecs/production-saft-backend
```

#### 2. Database Connection Issues
```bash
# Test database connection
aws ssm get-parameter --name /saft/database-url --with-decryption
```

#### 3. Health Check Failures
```bash
# Check if application is responding
curl http://your-alb-dns/health
```

### Debug Commands

#### View ECS Service Status
```bash
aws ecs describe-services \
    --cluster production-saft-cluster \
    --services production-saft-backend-service \
    --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount}'
```

#### View Recent Logs
```bash
aws logs tail /ecs/production-saft-backend --follow
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push image
        run: |
          docker build -t saft-backend .
          docker tag saft-backend:latest $ECR_REGISTRY/saft-backend:latest
          docker push $ECR_REGISTRY/saft-backend:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster production-saft-cluster --service production-saft-backend-service --force-new-deployment
```

## 📞 Support

For deployment issues:
1. Check CloudWatch logs first
2. Verify environment variables in Parameter Store
3. Test database connectivity
4. Review ECS service events

## 🔗 Useful Links

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)



