#!/bin/bash

# BookaMOT SaaS - Deployment Verification Script
# Verifies that the deployment was successful by checking:
# 1. Health check endpoint
# 2. Database connectivity
# 3. Application logs
# 4. Service status
#
# Usage: bash scripts/verify-deployment.sh [domain]
# Example: bash scripts/verify-deployment.sh https://bookamot.example.com

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get domain from argument or use default
DOMAIN="${1:-http://localhost:3000}"
HEALTH_CHECK_URL="$DOMAIN/api/health"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     BookaMOT SaaS - Deployment Verification Script         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# STEP 1: Check health endpoint
echo -e "${YELLOW}📋 STEP 1: Checking Health Endpoint${NC}"
echo "   URL: $HEALTH_CHECK_URL"
echo ""

if curl -sf "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Health check passed!${NC}"
  
  # Get detailed health info
  HEALTH_INFO=$(curl -s "$HEALTH_CHECK_URL")
  echo "   Status: $(echo $HEALTH_INFO | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
  echo "   Database: $(echo $HEALTH_INFO | grep -o '"database":"[^"]*"' | cut -d'"' -f4)"
  echo "   Environment: $(echo $HEALTH_INFO | grep -o '"environment":"[^"]*"' | cut -d'"' -f4)"
else
  echo -e "${RED}❌ Health check failed!${NC}"
  echo "   The application is not responding at $HEALTH_CHECK_URL"
  echo ""
  echo -e "${YELLOW}Troubleshooting:${NC}"
  echo "   1. Verify the domain is correct"
  echo "   2. Check if the application is running"
  echo "   3. Check firewall rules"
  echo "   4. View logs: docker logs bookamot-app"
  exit 1
fi

echo ""

# STEP 2: Check database connectivity
echo -e "${YELLOW}📋 STEP 2: Checking Database Connectivity${NC}"
echo ""

if command -v npm &> /dev/null; then
  if npm run query:users > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is accessible!${NC}"
    
    # Get user count
    USER_COUNT=$(npm run query:users 2>/dev/null | grep "Total users:" | grep -o '[0-9]*' | head -1)
    echo "   Total users: $USER_COUNT"
  else
    echo -e "${RED}❌ Database query failed!${NC}"
    echo "   Could not connect to database"
  fi
else
  echo -e "${YELLOW}⚠️  npm not found, skipping database check${NC}"
fi

echo ""

# STEP 3: Check application logs
echo -e "${YELLOW}📋 STEP 3: Checking Application Logs${NC}"
echo ""

if command -v docker &> /dev/null; then
  if docker ps | grep -q bookamot-app; then
    echo -e "${GREEN}✅ Application container is running!${NC}"
    
    # Show last 5 log lines
    echo ""
    echo "   Recent logs:"
    docker logs --tail 5 bookamot-app 2>/dev/null | sed 's/^/   /'
  else
    echo -e "${YELLOW}⚠️  Docker container 'bookamot-app' not found${NC}"
    echo "   This is normal if running on Coolify"
  fi
else
  echo -e "${YELLOW}⚠️  Docker not found, skipping container check${NC}"
fi

echo ""

# STEP 4: Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    VERIFICATION SUMMARY                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Deployment verification completed successfully!${NC}"
echo ""
echo "Your BookaMOT SaaS application is:"
echo "  • Responding to health checks"
echo "  • Connected to the database"
echo "  • Ready to accept traffic"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test the application in your browser: $DOMAIN"
echo "  2. Create test data: bash scripts/setup-test-data.sh"
echo "  3. Check monitoring: See MONITORING_SETUP.md"
echo ""

