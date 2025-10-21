#!/bin/bash

# Quick test script to verify all fixes
set -e

echo "🧪 Testing Docker Compose configurations..."

# Test 1: Copy .env.example
echo "1. Creating .env file..."
cp .env.example .env
echo "✅ .env created"

# Test 2: Validate docker-compose.yml
echo ""
echo "2. Validating docker-compose.yml..."
docker compose config -q
echo "✅ docker-compose.yml is valid"

# Test 3: Validate docker-compose.prod.yml
echo ""
echo "3. Validating docker-compose.prod.yml..."
docker compose -f docker-compose.prod.yml config -q
echo "✅ docker-compose.prod.yml is valid"

# Test 4: Check Dockerfile syntax
echo ""
echo "4. Testing Dockerfile syntax..."
docker build --target development -f server/Dockerfile server/ --no-cache -t test-backend:dev 2>&1 | grep -i "error" && exit 1 || echo "✅ Backend Dockerfile is valid"

echo ""
echo "5. Testing Client Dockerfile syntax..."
docker build --target development -f client/Dockerfile client/ --no-cache -t test-client:dev 2>&1 | grep -i "error" && exit 1 || echo "✅ Client Dockerfile is valid"

echo ""
echo "🎉 All tests passed!"
echo ""
echo "Ready to push to GitHub! 🚀"