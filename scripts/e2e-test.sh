#!/bin/bash

# SimTrace End-to-End Test Script
# Tests the deployed frontend and backend

set -e

FRONTEND_URL="${FRONTEND_URL:-https://simtrace-final.vercel.app}"
BACKEND_URL="${BACKEND_URL:-https://simtrace-backend.onrender.com}"

echo "=========================================="
echo "SimTrace End-to-End Test"
echo "=========================================="
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}FAILED${NC}"
        ((FAILED++))
    fi
}

# ============================================
# BACKEND HEALTH CHECKS
# ============================================
echo "Backend Health Checks"
echo "----------------------"

run_test "Backend is accessible" "curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/api/health | grep -q '200'"
run_test "Backend returns uptime" "curl -s $BACKEND_URL/api/health | grep -q 'uptime'"
run_test "Backend returns environment" "curl -s $BACKEND_URL/api/health | grep -q 'environment'"
run_test "Backend returns services status" "curl -s $BACKEND_URL/api/health | grep -q 'services'"
run_test "Billing plans endpoint" "curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/api/billing/plans | grep -q '200'"
run_test "Billing plans has data" "curl -s $BACKEND_URL/api/billing/plans | grep -q 'plans'"

echo ""

# ============================================
# FRONTEND ACCESSIBILITY
# ============================================
echo "Frontend Accessibility"
echo "----------------------"

run_test "Frontend is accessible" "curl -s -o /dev/null -w '%{http_code}' $FRONTEND_URL | grep -q '200'"
run_test "Frontend returns HTML" "curl -s $FRONTEND_URL | grep -q '<!DOCTYPE html>'"

echo ""

# ============================================
# API ENDPOINT TESTS
# ============================================
echo "API Endpoint Tests"
echo "------------------"

run_test "404 handling" "curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/api/non-existent | grep -q '404'"
run_test "CORS headers present" "curl -s -I $BACKEND_URL/api/health | grep -q 'access-control-allow-credentials'"
run_test "Security headers present" "curl -s -I $BACKEND_URL/api/health | grep -q 'x-content-type-options'"
run_test "Rate limit headers present" "curl -s -I $BACKEND_URL/api/health | grep -q 'ratelimit-limit'"

echo ""

# ============================================
# PERFORMANCE TESTS
# ============================================
echo "Performance Tests"
echo "-----------------"

run_test "Backend response time < 5s" "curl -s -o /dev/null -w '%{time_total}' $BACKEND_URL/api/health | awk '{print \$1 < 5}'"
run_test "Frontend response time < 3s" "curl -s -o /dev/null -w '%{time_total}' $FRONTEND_URL | awk '{print \$1 < 3}'"

echo ""

# ============================================
# SUMMARY
# ============================================
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the logs.${NC}"
    exit 1
fi
