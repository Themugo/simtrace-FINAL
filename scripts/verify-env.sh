#!/bin/bash

# Environment Variables Verification Script
# This script verifies all required environment variables are set

echo "=== SIMTRACE ENVIRONMENT VARIABLES VERIFICATION ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for results
REQUIRED_SET=0
REQUIRED_TOTAL=0
OPTIONAL_SET=0
OPTIONAL_TOTAL=0

# Function to check variable
check_var() {
    local var_name=$1
    local is_required=$2
    local description=$3
    
    if [ -z "${!var_name}" ]; then
        if [ "$is_required" = "required" ]; then
            echo -e "${RED}✗ MISSING${NC} $var_name - $description"
        else
            echo -e "${YELLOW}○ OPTIONAL${NC} $var_name - $description (not set)"
        fi
    else
        if [ "$is_required" = "required" ]; then
            echo -e "${GREEN}✓ SET${NC} $var_name - $description"
            ((REQUIRED_SET++))
        else
            echo -e "${GREEN}✓ SET${NC} $var_name - $description"
            ((OPTIONAL_SET++))
        fi
    fi
    
    if [ "$is_required" = "required" ]; then
        ((REQUIRED_TOTAL++))
    else
        ((OPTIONAL_TOTAL++))
    fi
}

echo "=== REQUIRED VARIABLES ==="
echo ""

# Backend Required Variables
check_var "NODE_ENV" "required" "Environment (development/production)"
check_var "PORT" "required" "Backend port"
check_var "MONGO_URI" "required" "MongoDB connection string"
check_var "JWT_SECRET" "required" "JWT signing secret"
check_var "BACKEND_URL" "required" "Backend API URL"
check_var "FRONTEND_URL" "required" "Frontend URL"

echo ""
echo "=== AUTHENTICATION & SECURITY ==="
echo ""

check_var "BCRYPT_ROUNDS" "required" "Password hashing rounds"
check_var "JWT_EXPIRY" "required" "JWT token expiry time"

echo ""
echo "=== EMAIL SERVICES ==="
echo ""

check_var "SENDGRID_API_KEY" "required" "SendGrid API key for emails"
check_var "FROM_EMAIL" "required" "Sender email address"

echo ""
echo "=== PAYMENT SERVICES ==="
echo ""

check_var "STRIPE_SECRET_KEY" "required" "Stripe secret key"
check_var "STRIPE_WEBHOOK_SECRET" "required" "Stripe webhook secret"
check_var "STRIPE_PUBLISHABLE_KEY" "required" "Stripe publishable key"

echo ""
echo "=== M-PESA ==="
echo ""

check_var "MPESA_ENV" "required" "M-Pesa environment (sandbox/production)"
check_var "MPESA_CONSUMER_KEY" "required" "M-Pesa consumer key"
check_var "MPESA_CONSUMER_SECRET" "required" "M-Pesa consumer secret"
check_var "MPESA_SHORTCODE" "required" "M-Pesa shortcode"

echo ""
echo "=== OPTIONAL VARIABLES ==="
echo ""

# OAuth
check_var "GOOGLE_CLIENT_ID" "optional" "Google OAuth client ID"
check_var "GOOGLE_CLIENT_SECRET" "optional" "Google OAuth client secret"
check_var "GOOGLE_REDIRECT_URI" "optional" "Google OAuth redirect URI"

echo ""
echo "=== MONITORING & LOGGING ==="
echo ""

check_var "SENTRY_DSN" "optional" "Sentry DSN for error tracking"
check_var "SENTRY_ENVIRONMENT" "optional" "Sentry environment name"

echo ""
echo "=== REDIS (if used) ==="
echo ""

check_var "REDIS_URL" "optional" "Redis connection URL"
check_var "REDIS_PASSWORD" "optional" "Redis password"

echo ""
echo "=== CORS ==="
echo ""

check_var "ALLOWED_ORIGINS" "optional" "CORS allowed origins (comma-separated)"

echo ""
echo "=== SUMMARY ==="
echo ""

if [ $REQUIRED_SET -eq $REQUIRED_TOTAL ]; then
    echo -e "${GREEN}✓ ALL REQUIRED VARIABLES SET ($REQUIRED_SET/$REQUIRED_TOTAL)${NC}"
else
    echo -e "${RED}✗ MISSING REQUIRED VARIABLES ($REQUIRED_SET/$REQUIRED_TOTAL)${NC}"
    echo ""
    echo "Please set the missing required variables before proceeding with launch."
    exit 1
fi

echo ""
echo -e "${GREEN}✓ OPTIONAL VARIABLES SET ($OPTIONAL_SET/$OPTIONAL_TOTAL)${NC}"

echo ""
echo "=== VERIFICATION COMPLETE ==="
echo ""
echo "Next steps:"
echo "1. Test database connection"
echo "2. Test backup restoration"
echo "3. Configure monitoring alerts"
echo "4. Execute soft launch"
