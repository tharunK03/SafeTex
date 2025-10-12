#!/bin/bash

# Quick Deploy Script for Saft ERP Backend to AWS EC2
# This script provides a simple menu for EC2 deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Saft ERP Backend - Quick EC2 Deployment${NC}"
echo -e "${BLUE}==========================================${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Function to show menu
show_menu() {
    echo -e "\n${BLUE}📋 Deployment Options:${NC}"
    echo -e "1. 🆕 Deploy new EC2 instance"
    echo -e "2. 📤 Upload to existing instance"
    echo -e "3. 🛠️  Manage existing instance"
    echo -e "4. 📖 View deployment guide"
    echo -e "5. ❌ Exit"
    echo -e ""
    read -p "Select an option (1-5): " choice
}

# Function to deploy new instance
deploy_new() {
    echo -e "${YELLOW}🚀 Starting new EC2 deployment...${NC}"
    ./deploy-ec2.sh
}

# Function to upload to existing instance
upload_existing() {
    echo -e "${YELLOW}📤 Uploading to existing instance...${NC}"
    ./upload-to-ec2.sh
}

# Function to manage existing instance
manage_existing() {
    echo -e "${YELLOW}🛠️  Managing existing instance...${NC}"
    ./manage-ec2.sh
}

# Function to show guide
show_guide() {
    echo -e "${YELLOW}📖 Opening deployment guide...${NC}"
    if command -v open > /dev/null; then
        open ../AWS_EC2_DEPLOYMENT_GUIDE.md
    elif command -v xdg-open > /dev/null; then
        xdg-open ../AWS_EC2_DEPLOYMENT_GUIDE.md
    else
        echo -e "${BLUE}Please open: ../AWS_EC2_DEPLOYMENT_GUIDE.md${NC}"
    fi
}

# Main execution
while true; do
    show_menu
    case $choice in
        1) deploy_new ;;
        2) upload_existing ;;
        3) manage_existing ;;
        4) show_guide ;;
        5) echo -e "${GREEN}👋 Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${RED}❌ Invalid option${NC}" ;;
    esac
    echo -e "\nPress Enter to continue..."
    read
done






