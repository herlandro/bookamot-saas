#!/bin/bash

# MOT Features Test Script
# Tests all MOT features endpoints

set -e

BASE_URL="http://localhost:3002"
VEHICLE_ID="cmgwto283000742vxvp0obbwi"  # Replace with actual vehicle ID
TOKEN="YOUR_AUTH_TOKEN"  # Replace with actual token

echo "🚀 MOT Features Test Suite"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Get MOT History
echo -e "${YELLOW}Test 1: Get MOT History${NC}"
echo "GET /api/vehicles/$VEHICLE_ID/mot-history"
curl -s -X GET "$BASE_URL/api/vehicles/$VEHICLE_ID/mot-history" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' | head -20
echo ""
echo ""

# Test 2: Refresh MOT Data
echo -e "${YELLOW}Test 2: Refresh MOT Data (Manual)${NC}"
echo "POST /api/vehicles/$VEHICLE_ID/mot-history"
curl -s -X POST "$BASE_URL/api/vehicles/$VEHICLE_ID/mot-history" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' | head -20
echo ""
echo ""

# Test 3: Get Notifications
echo -e "${YELLOW}Test 3: Get MOT Notifications${NC}"
echo "GET /api/notifications/mot"
curl -s -X GET "$BASE_URL/api/notifications/mot?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 4: Generate JSON Report
echo -e "${YELLOW}Test 4: Generate JSON Report${NC}"
echo "GET /api/vehicles/$VEHICLE_ID/mot-report?format=json"
curl -s -X GET "$BASE_URL/api/vehicles/$VEHICLE_ID/mot-report?format=json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.' | head -30
echo ""
echo ""

# Test 5: Generate CSV Report
echo -e "${YELLOW}Test 5: Generate CSV Report${NC}"
echo "GET /api/vehicles/$VEHICLE_ID/mot-report?format=csv"
curl -s -X GET "$BASE_URL/api/vehicles/$VEHICLE_ID/mot-report?format=csv" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | head -20
echo ""
echo ""

# Test 6: Trigger Alert Check
echo -e "${YELLOW}Test 6: Trigger Alert Check${NC}"
echo "POST /api/alerts/check-mot"
curl -s -X POST "$BASE_URL/api/alerts/check-mot" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "📝 Notes:"
echo "  - Replace VEHICLE_ID with an actual vehicle ID from your database"
echo "  - Replace TOKEN with a valid authentication token"
echo "  - Ensure the application is running on http://localhost:3002"
echo ""

