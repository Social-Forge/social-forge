#!/bin/bash

# Generate Self-Signed SSL Certificates for Development
# This script creates SSL certificates for local development

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}======================================"
echo "SSL Certificate Generator"
echo "======================================${NC}"
echo ""

# Configuration
DOMAIN=${1:-localhost}
CERT_DIR="./docker/nginx/ssl"
DAYS_VALID=365

# Create directory if not exists
mkdir -p "$CERT_DIR"

echo -e "${YELLOW}Generating SSL certificate for: $DOMAIN${NC}"
echo -e "${YELLOW}Valid for: $DAYS_VALID days${NC}"
echo ""

# Generate private key
echo -e "${GREEN}[1/3] Generating private key...${NC}"
openssl genrsa -out "$CERT_DIR/privkey.pem" 2048

# Generate certificate signing request
echo -e "${GREEN}[2/3] Generating certificate signing request...${NC}"
openssl req -new -key "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/cert.csr" \
    -subj "/C=ID/ST=West Java/L=Cinangka/O=SocialForge/OU=IT/CN=$DOMAIN"

# Generate self-signed certificate
echo -e "${GREEN}[3/3] Generating self-signed certificate...${NC}"
openssl x509 -req -days $DAYS_VALID \
    -in "$CERT_DIR/cert.csr" \
    -signkey "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem"

# Create certificate chain (for compatibility)
cat "$CERT_DIR/fullchain.pem" > "$CERT_DIR/chain.pem"

# Clean up CSR
rm "$CERT_DIR/cert.csr"

# Set proper permissions
chmod 644 "$CERT_DIR/fullchain.pem"
chmod 644 "$CERT_DIR/chain.pem"
chmod 600 "$CERT_DIR/privkey.pem"

echo ""
echo -e "${GREEN}✓ SSL certificates generated successfully!${NC}"
echo ""
echo "Certificate files:"
echo "  - Private key: $CERT_DIR/privkey.pem"
echo "  - Certificate: $CERT_DIR/fullchain.pem"
echo "  - Chain: $CERT_DIR/chain.pem"
echo ""
echo -e "${YELLOW}⚠ Note: These are self-signed certificates for development only!${NC}"
echo -e "${YELLOW}   For production, use Let's Encrypt or a trusted CA.${NC}"
echo ""

# Display certificate info
echo "Certificate Information:"
openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -subject -dates

echo ""
echo -e "${GREEN}✓ Done!${NC}"