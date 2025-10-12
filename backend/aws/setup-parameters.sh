#!/bin/bash

# Setup AWS Systems Manager Parameter Store for Saft ERP Backend
# This script helps you securely store environment variables

set -e

AWS_REGION="us-east-1"
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Setting up AWS Systems Manager Parameter Store${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Function to create or update parameter
create_or_update_parameter() {
    local param_name=$1
    local param_value=$2
    local is_secure=${3:-false}
    
    if [ "$is_secure" = true ]; then
        aws ssm put-parameter \
            --name "$param_name" \
            --value "$param_value" \
            --type "SecureString" \
            --overwrite \
            --region $AWS_REGION
    else
        aws ssm put-parameter \
            --name "$param_name" \
            --value "$param_value" \
            --type "String" \
            --overwrite \
            --region $AWS_REGION
    fi
    
    echo -e "${GREEN}✅ Created/Updated parameter: $param_name${NC}"
}

# Function to prompt for sensitive value
prompt_for_sensitive() {
    local param_name=$1
    local prompt_text=$2
    local is_password=${3:-false}
    
    if [ "$is_password" = true ]; then
        read -s -p "$prompt_text: " value
        echo
    else
        read -p "$prompt_text: " value
    fi
    
    if [ -n "$value" ]; then
        create_or_update_parameter "$param_name" "$value" true
    else
        echo -e "${YELLOW}⚠️  Skipping $param_name (empty value)${NC}"
    fi
}

echo -e "${YELLOW}📝 Please provide the following environment variables:${NC}"
echo -e "${BLUE}Note: Sensitive values will be stored as SecureString parameters${NC}"

# Supabase Configuration
echo -e "\n${BLUE}🔗 Supabase Configuration${NC}"
read -p "Supabase URL: " SUPABASE_URL
if [ -n "$SUPABASE_URL" ]; then
    create_or_update_parameter "/saft/supabase-url" "$SUPABASE_URL"
fi

prompt_for_sensitive "/saft/supabase-anon-key" "Supabase Anonymous Key"

read -p "Database URL (postgresql://...): " DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    create_or_update_parameter "/saft/database-url" "$DATABASE_URL" true
fi

# Firebase Configuration
echo -e "\n${BLUE}🔥 Firebase Configuration${NC}"
read -p "Firebase Project ID: " FIREBASE_PROJECT_ID
if [ -n "$FIREBASE_PROJECT_ID" ]; then
    create_or_update_parameter "/saft/firebase-project-id" "$FIREBASE_PROJECT_ID"
fi

prompt_for_sensitive "/saft/firebase-private-key" "Firebase Private Key (with newlines as \\n)"

read -p "Firebase Client Email: " FIREBASE_CLIENT_EMAIL
if [ -n "$FIREBASE_CLIENT_EMAIL" ]; then
    create_or_update_parameter "/saft/firebase-client-email" "$FIREBASE_CLIENT_EMAIL"
fi

# JWT Configuration
echo -e "\n${BLUE}🔑 JWT Configuration${NC}"
prompt_for_sensitive "/saft/jwt-secret" "JWT Secret" true

# SMTP Configuration (Optional)
echo -e "\n${BLUE}📧 SMTP Configuration (Optional)${NC}"
read -p "SMTP Host (press Enter to skip): " SMTP_HOST
if [ -n "$SMTP_HOST" ]; then
    create_or_update_parameter "/saft/smtp-host" "$SMTP_HOST"
    
    read -p "SMTP Port: " SMTP_PORT
    if [ -n "$SMTP_PORT" ]; then
        create_or_update_parameter "/saft/smtp-port" "$SMTP_PORT"
    fi
    
    read -p "SMTP User: " SMTP_USER
    if [ -n "$SMTP_USER" ]; then
        create_or_update_parameter "/saft/smtp-user" "$SMTP_USER"
    fi
    
    prompt_for_sensitive "/saft/smtp-pass" "SMTP Password" true
fi

# CORS Configuration
echo -e "\n${BLUE}🌐 CORS Configuration${NC}"
read -p "CORS Origin (your frontend URL): " CORS_ORIGIN
if [ -n "$CORS_ORIGIN" ]; then
    create_or_update_parameter "/saft/cors-origin" "$CORS_ORIGIN"
fi

# List all created parameters
echo -e "\n${GREEN}📋 Created Parameters:${NC}"
aws ssm get-parameters-by-path --path "/saft" --region $AWS_REGION --query "Parameters[*].[Name,Type]" --output table

echo -e "\n${GREEN}🎉 Parameter setup completed!${NC}"
echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "${BLUE}1. Run the ECS deployment script: ./deploy-ecs.sh${NC}"
echo -e "${BLUE}2. Update your frontend configuration to use the new API endpoint${NC}"
echo -e "${BLUE}3. Test your deployment using the health check endpoint${NC}"



