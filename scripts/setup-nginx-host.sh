#!/bin/bash

# ============================================
# Nginx Reverse Proxy Setup for Ubuntu Host
# Social Forge Production Server
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Nginx Reverse Proxy Setup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Server IP
SERVER_IP="164.92.78.16"

# Update system
echo -e "${GREEN}[1/8] Updating system...${NC}"
apt-get update
apt-get upgrade -y

# Install Nginx
echo -e "${GREEN}[2/8] Installing Nginx...${NC}"
apt-get install -y nginx apache2-utils

# Backup original nginx config
echo -e "${GREEN}[3/8] Backing up original config...${NC}"
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Test Nginx configuration
echo -e "${GREEN}[8/8] Testing Nginx configuration...${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Nginx configuration is valid!${NC}"
    systemctl restart nginx
    systemctl enable nginx
    echo -e "${GREEN}✓ Nginx setup completed!${NC}"
else
    echo -e "${RED}Nginx configuration test failed!${NC}"
    exit 1
fi