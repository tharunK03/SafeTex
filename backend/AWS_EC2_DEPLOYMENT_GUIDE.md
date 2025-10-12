# 🚀 Saft ERP Backend - AWS EC2 Deployment Guide

This guide will help you deploy your Saft ERP Backend to AWS EC2 with a complete setup including Node.js, PM2, and monitoring.

## 📋 Prerequisites

### 1. AWS Account Setup
- Active AWS account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- Basic knowledge of EC2 and AWS services

### 2. Required AWS Permissions
Your AWS user/role needs the following permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:*",
                "iam:PassRole"
            ],
            "Resource": "*"
        }
    ]
}
```

### 3. Local Requirements
- Your backend code ready and tested locally
- Environment variables configured
- Git repository (optional, for easy updates)

## 🚀 Quick Start

### Step 1: Deploy to EC2
```bash
cd backend/aws
chmod +x *.sh
./deploy-ec2.sh
```

This will:
- Create a new EC2 instance (t3.medium)
- Install Node.js 18, PM2, and Docker
- Configure security groups
- Set up the application environment

### Step 2: Upload Your Application
```bash
./upload-to-ec2.sh
```

This will:
- Upload your application code
- Install dependencies
- Start the application with PM2

### Step 3: Manage Your Application
```bash
./manage-ec2.sh
```

This provides an interactive menu to:
- Check application status
- View logs
- Restart/stop/start the application
- Update environment variables
- Connect to the instance

## 📊 What Gets Created

### EC2 Instance
- **Instance Type**: t3.medium (2 vCPU, 4GB RAM)
- **AMI**: Amazon Linux 2
- **Storage**: 8GB EBS (gp2)
- **Security Group**: Allows HTTP (80), HTTPS (443), SSH (22), and API (5000)

### Application Setup
- **Node.js 18**: Latest LTS version
- **PM2**: Process manager for Node.js
- **Docker**: For containerized deployments
- **Systemd Service**: Auto-start on boot
- **Logging**: Structured logging with PM2

### Security Configuration
- **SSH Access**: Key-based authentication
- **Firewall**: Configured security groups
- **User Permissions**: Proper file ownership

## 🔧 Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Launch EC2 Instance
```bash
# Create key pair
aws ec2 create-key-pair --key-name saft-backend-key --query 'KeyMaterial' --output text > saft-backend-key.pem
chmod 400 saft-backend-key.pem

# Launch instance
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --count 1 \
    --instance-type t3.medium \
    --key-name saft-backend-key \
    --security-group-ids sg-xxxxxxxxx \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=saft-backend-server}]"
```

### 2. Configure Security Group
```bash
# Create security group
aws ec2 create-security-group \
    --group-name saft-backend-sg \
    --description "Security group for Saft ERP Backend"

# Add inbound rules
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 5000 \
    --cidr 0.0.0.0/0
```

### 3. Connect and Setup
```bash
# Connect to instance
ssh -i saft-backend-key.pem ec2-user@YOUR_INSTANCE_IP

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create application directory
mkdir -p /home/ec2-user/saft-backend
cd /home/ec2-user/saft-backend
```

## 📁 File Structure on EC2

```
/home/ec2-user/saft-backend/
├── src/                    # Application source code
├── package.json           # Dependencies
├── .env                   # Environment variables
├── ecosystem.config.js    # PM2 configuration
├── logs/                  # Application logs
│   ├── err.log
│   ├── out.log
│   └── combined.log
└── deploy.sh             # Deployment script
```

## 🔧 Configuration

### Environment Variables
Update your `.env` file on the server:
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=your-database-url

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# JWT Secret
JWT_SECRET=your-jwt-secret

# CORS Configuration
CORS_ORIGIN=http://your-frontend-domain.com
```

### PM2 Configuration
The `ecosystem.config.js` file manages your application:
```javascript
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
    }
  }]
}
```

## 📊 Monitoring and Logs

### Application Status
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs saft-backend

# Monitor in real-time
pm2 monit
```

### System Monitoring
```bash
# Check system resources
htop
df -h
free -h

# Check application logs
tail -f /home/ec2-user/saft-backend/logs/combined.log
```

### Health Checks
```bash
# Test API endpoint
curl http://YOUR_INSTANCE_IP:5000/health

# Test specific endpoints
curl http://YOUR_INSTANCE_IP:5000/api/products
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Upload new code
./upload-to-ec2.sh

# Or manually
scp -i saft-backend-key.pem -r src/ ec2-user@YOUR_INSTANCE_IP:/home/ec2-user/saft-backend/
ssh -i saft-backend-key.pem ec2-user@YOUR_INSTANCE_IP "cd /home/ec2-user/saft-backend && pm2 restart saft-backend"
```

### Update Dependencies
```bash
ssh -i saft-backend-key.pem ec2-user@YOUR_INSTANCE_IP "cd /home/ec2-user/saft-backend && npm update && pm2 restart saft-backend"
```

### Backup
```bash
# Backup application
tar -czf saft-backend-backup-$(date +%Y%m%d).tar.gz /home/ec2-user/saft-backend/

# Backup database (if using local database)
pg_dump your_database > backup.sql
```

## 🔒 Security Best Practices

### 1. Instance Security
- Use key-based SSH authentication
- Keep the instance updated
- Use security groups to restrict access
- Consider using a bastion host for production

### 2. Application Security
- Use environment variables for secrets
- Enable HTTPS with SSL certificates
- Implement rate limiting
- Regular security updates

### 3. Database Security
- Use connection pooling
- Enable SSL for database connections
- Regular backups
- Monitor access logs

## 💰 Cost Optimization

### Instance Sizing
- **t3.micro**: $8.50/month (1 vCPU, 1GB RAM) - Development
- **t3.small**: $17/month (2 vCPU, 2GB RAM) - Small production
- **t3.medium**: $34/month (2 vCPU, 4GB RAM) - Medium production
- **t3.large**: $68/month (2 vCPU, 8GB RAM) - Large production

### Cost Optimization Tips
1. Use Spot Instances for development
2. Right-size your instance based on usage
3. Use Reserved Instances for production
4. Monitor and optimize storage usage
5. Set up billing alerts

## 🚨 Troubleshooting

### Common Issues

#### 1. Cannot Connect to Instance
```bash
# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# Check instance status
aws ec2 describe-instances --instance-ids i-xxxxxxxxx
```

#### 2. Application Not Starting
```bash
# Check PM2 logs
pm2 logs saft-backend

# Check system logs
sudo journalctl -u saft-backend.service

# Check Node.js version
node --version
```

#### 3. Database Connection Issues
```bash
# Test database connection
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Check network connectivity
telnet your-database-host 5432
```

### Debug Commands

#### Check Application Status
```bash
pm2 status
pm2 logs saft-backend --lines 100
pm2 monit
```

#### Check System Resources
```bash
htop
df -h
free -h
netstat -tlnp
```

#### Check Application Health
```bash
curl -v http://localhost:5000/health
curl -v http://YOUR_INSTANCE_IP:5000/health
```

## 🔗 Useful Commands

### PM2 Commands
```bash
pm2 start ecosystem.config.js    # Start application
pm2 stop saft-backend           # Stop application
pm2 restart saft-backend        # Restart application
pm2 reload saft-backend         # Reload without downtime
pm2 delete saft-backend         # Delete application
pm2 save                        # Save current process list
pm2 startup                     # Generate startup script
```

### System Commands
```bash
sudo systemctl start saft-backend    # Start service
sudo systemctl stop saft-backend     # Stop service
sudo systemctl restart saft-backend  # Restart service
sudo systemctl status saft-backend   # Check service status
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review PM2 logs for application errors
3. Check system logs for infrastructure issues
4. Verify security group and network configuration

## 🔗 Next Steps

After successful deployment:
1. **Configure Domain**: Set up a custom domain with Route 53
2. **SSL Certificate**: Install SSL certificate for HTTPS
3. **Load Balancer**: Add Application Load Balancer for high availability
4. **Monitoring**: Set up CloudWatch monitoring
5. **Backup**: Implement automated backups
6. **CI/CD**: Set up automated deployment pipeline

Your Saft ERP Backend is now running on AWS EC2! 🎉






