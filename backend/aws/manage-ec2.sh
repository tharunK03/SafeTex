#!/bin/bash

# Manage Saft ERP Backend on EC2
# This script helps you manage your deployed application

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

# Function to get instance IP
get_instance_ip() {
    if [ -f "instance-details.txt" ]; then
        INSTANCE_IP=$(grep "Public IP:" instance-details.txt | cut -d' ' -f3)
    else
        echo -e "${YELLOW}📝 Please enter your EC2 instance IP address:${NC}"
        read -p "Instance IP: " INSTANCE_IP
    fi
    
    if [ -z "$INSTANCE_IP" ]; then
        echo -e "${RED}❌ Instance IP is required${NC}"
        exit 1
    fi
}

# Function to check connection
check_connection() {
    echo -e "${YELLOW}🔍 Checking connection to EC2 instance...${NC}"
    if ssh -i $KEY_FILE -o ConnectTimeout=10 -o StrictHostKeyChecking=no $USER@$INSTANCE_IP "echo 'Connected'" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected to EC2 instance${NC}"
    else
        echo -e "${RED}❌ Cannot connect to EC2 instance${NC}"
        echo -e "${YELLOW}Please check:${NC}"
        echo -e "${YELLOW}1. Instance is running${NC}"
        echo -e "${YELLOW}2. Security group allows SSH (port 22)${NC}"
        echo -e "${YELLOW}3. Key file is correct${NC}"
        exit 1
    fi
}

# Function to show application status
show_status() {
    echo -e "${BLUE}📊 Application Status${NC}"
    echo -e "${BLUE}===================${NC}"
    
    ssh -i $KEY_FILE $USER@$INSTANCE_IP "cd $APP_DIR && pm2 status"
    
    echo -e "\n${BLUE}🌐 API Endpoints${NC}"
    echo -e "${BLUE}================${NC}"
    echo -e "Health Check: http://$INSTANCE_IP:5000/health"
    echo -e "API Base: http://$INSTANCE_IP:5000/api"
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 Application Logs${NC}"
    echo -e "${BLUE}==================${NC}"
    
    ssh -i $KEY_FILE $USER@$INSTANCE_IP "cd $APP_DIR && pm2 logs saft-backend --lines 50"
}

# Function to restart application
restart_app() {
    echo -e "${YELLOW}🔄 Restarting application...${NC}"
    
    ssh -i $KEY_FILE $USER@$INSTANCE_IP "cd $APP_DIR && pm2 restart saft-backend"
    
    echo -e "${GREEN}✅ Application restarted${NC}"
}

# Function to stop application
stop_app() {
    echo -e "${YELLOW}⏹️  Stopping application...${NC}"
    
    ssh -i $KEY_FILE $USER@$INSTANCE_IP "cd $APP_DIR && pm2 stop saft-backend"
    
    echo -e "${GREEN}✅ Application stopped${NC}"
}

# Function to start application
start_app() {
    echo -e "${YELLOW}▶️  Starting application...${NC}"
    
    ssh -i $KEY_FILE $USER@$INSTANCE_IP "cd $APP_DIR && pm2 start saft-backend"
    
    echo -e "${GREEN}✅ Application started${NC}"
}

# Function to update environment variables
update_env() {
    echo -e "${YELLOW}🔧 Updating environment variables...${NC}"
    
    # Copy local .env to server
    if [ -f ".env" ]; then
        scp -i $KEY_FILE .env $USER@$INSTANCE_IP:$APP_DIR/
        echo -e "${GREEN}✅ Environment variables updated${NC}"
        echo -e "${YELLOW}🔄 Restarting application to apply changes...${NC}"
        restart_app
    else
        echo -e "${RED}❌ .env file not found${NC}"
        echo -e "${YELLOW}Please create a .env file with your configuration${NC}"
    fi
}

# Function to connect to instance
connect() {
    echo -e "${YELLOW}🔗 Connecting to EC2 instance...${NC}"
    ssh -i $KEY_FILE $USER@$INSTANCE_IP
}

# Function to show system info
show_system_info() {
    echo -e "${BLUE}🖥️  System Information${NC}"
    echo -e "${BLUE}=====================${NC}"
    
    ssh -i $KEY_FILE $USER@$INSTANCE_IP "
        echo 'Instance ID:' \$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
        echo 'Instance Type:' \$(curl -s http://169.254.169.254/latest/meta-data/instance-type)
        echo 'Public IP:' \$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
        echo 'Private IP:' \$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
        echo 'Availability Zone:' \$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
        echo ''
        echo 'Disk Usage:'
        df -h
        echo ''
        echo 'Memory Usage:'
        free -h
        echo ''
        echo 'Node.js Version:'
        node --version
        echo ''
        echo 'NPM Version:'
        npm --version
    "
}

# Main menu
show_menu() {
    echo -e "${BLUE}🛠️  Saft ERP Backend - EC2 Management${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo -e "1. Show application status"
    echo -e "2. Show logs"
    echo -e "3. Restart application"
    echo -e "4. Stop application"
    echo -e "5. Start application"
    echo -e "6. Update environment variables"
    echo -e "7. Connect to instance (SSH)"
    echo -e "8. Show system information"
    echo -e "9. Exit"
    echo -e ""
    read -p "Select an option (1-9): " choice
}

# Main execution
main() {
    get_instance_ip
    check_connection
    
    while true; do
        show_menu
        case $choice in
            1) show_status ;;
            2) show_logs ;;
            3) restart_app ;;
            4) stop_app ;;
            5) start_app ;;
            6) update_env ;;
            7) connect ;;
            8) show_system_info ;;
            9) echo -e "${GREEN}👋 Goodbye!${NC}"; exit 0 ;;
            *) echo -e "${RED}❌ Invalid option${NC}" ;;
        esac
        echo -e "\nPress Enter to continue..."
        read
    done
}

main






