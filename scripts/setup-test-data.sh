#!/bin/bash

# BookaMOT SaaS - Test Data Setup Script
# Automates the setup of test data:
# 1. Cleans the database (with confirmation)
# 2. Seeds with test garages and users
# 3. Lists created data
#
# Usage: bash scripts/setup-test-data.sh
# Or: npm run setup:test-data

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      BookaMOT SaaS - Test Data Setup Script                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# STEP 1: Confirmation
echo -e "${YELLOW}⚠️  WARNING: This will delete ALL existing data!${NC}"
echo ""
echo "This script will:"
echo "  1. Delete all data from the database"
echo "  2. Seed with 4 test garages"
echo "  3. Create 4 test garage owner accounts"
echo "  4. Display created data"
echo ""
echo -e "${YELLOW}Test Credentials:${NC}"
echo "  Password: password123"
echo ""

read -p "Do you want to continue? (yes/no): " -r CONFIRM

if [[ ! $CONFIRM =~ ^[Yy][Ee][Ss]$ ]]; then
  echo -e "${RED}❌ Setup cancelled.${NC}"
  exit 0
fi

echo ""

# STEP 2: Clean database
echo -e "${YELLOW}📋 STEP 1/3: Cleaning database...${NC}"
echo ""

if npm run db:clean > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database cleaned successfully!${NC}"
else
  echo -e "${RED}❌ Failed to clean database!${NC}"
  exit 1
fi

echo ""

# STEP 3: Seed database
echo -e "${YELLOW}📋 STEP 2/3: Seeding test data...${NC}"
echo ""

if npm run db:seed > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database seeded successfully!${NC}"
else
  echo -e "${RED}❌ Failed to seed database!${NC}"
  exit 1
fi

echo ""

# STEP 4: Display created data
echo -e "${YELLOW}📋 STEP 3/3: Displaying created data...${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}GARAGE OWNERS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

npm run query:garages

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ALL USERS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

npm run query:users

echo ""

# STEP 5: Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    SETUP COMPLETED                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Test data setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Test Credentials:${NC}"
echo ""
echo "Garage Owners (can login at /garage/login):"
echo "  • john.smith@test.com / password123 (Stevenage MOT Centre)"
echo "  • sarah.johnson@test.com / password123 (Hitchin Auto Services)"
echo "  • david.brown@test.com / password123 (Letchworth Garage)"
echo "  • emma.wilson@test.com / password123 (London Central MOT)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Login with a garage owner account"
echo "  2. Create a customer account"
echo "  3. Book an MOT service"
echo "  4. Test the review system"
echo ""

