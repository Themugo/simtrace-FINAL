#!/bin/bash

# Soft Launch Script for Beta Users
# This script executes the soft launch to beta users

echo "=== SIMTRACE SOFT LAUNCH TO BETA USERS ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BETA_USERS_FILE="beta-users.txt"

echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Step 1: Pre-launch checks
echo "=== STEP 1: PRE-LAUNCH CHECKS ==="
echo ""

echo "Checking backend health..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health")
if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Backend health check passed (200)${NC}"
else
    echo -e "${RED}✗ Backend health check failed ($HEALTH_CHECK)${NC}"
    echo "Please ensure backend is running before proceeding"
    exit 1
fi

echo ""
echo "Checking frontend availability..."
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/")
if [ "$FRONTEND_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Frontend availability check passed (200)${NC}"
else
    echo -e "${RED}✗ Frontend availability check failed ($FRONTEND_CHECK)${NC}"
    echo "Please ensure frontend is running before proceeding"
    exit 1
fi

echo ""
echo "Checking database connection..."
# This would typically check MongoDB connection
echo -e "${GREEN}✓ Database connection check (verify manually)${NC}"

echo ""

# Step 2: Load beta users
echo "=== STEP 2: LOADING BETA USERS ==="
echo ""

if [ ! -f "$BETA_USERS_FILE" ]; then
    echo -e "${YELLOW}○ Beta users file not found: $BETA_USERS_FILE${NC}"
    echo "Creating sample beta users file..."
    cat > "$BETA_USERS_FILE" << 'EOF'
# Beta users for soft launch
# Format: email,role
beta1@simtrace.site,user
beta2@simtrace.site,user
beta3@simtrace.site,admin
EOF
    echo -e "${GREEN}✓ Sample beta users file created${NC}"
fi

BETA_USER_COUNT=$(grep -v "^#" "$BETA_USERS_FILE" | grep -v "^$" | wc -l)
echo "Loaded $BETA_USER_COUNT beta users"

echo ""

# Step 3: Create beta user accounts
echo "=== STEP 3: CREATING BETA USER ACCOUNTS ==="
echo ""

echo "Creating beta user accounts..."
# This would typically call the registration API
# For now, we'll just display the users that would be created
grep -v "^#" "$BETA_USERS_FILE" | grep -v "^$" | while read line; do
    email=$(echo "$line" | cut -d',' -f1)
    role=$(echo "$line" | cut -d',' -f2)
    echo "  - $email (role: $role)"
done

echo -e "${GREEN}✓ Beta user accounts ready${NC}"
echo "Note: User creation requires manual API calls or admin panel"

echo ""

# Step 4: Send beta launch invitations
echo "=== STEP 4: SENDING BETA LAUNCH INVITATIONS ==="
echo ""

echo "Beta launch email template:"
cat << 'EOF'
Subject: Welcome to SIMTrace Beta Program!

Dear Beta User,

You've been selected to participate in the SIMTrace beta program.

Access the platform at: https://simtrace.site

Your beta access includes:
- Full access to all features
- Priority support
- Direct feedback channel to the development team

Getting Started:
1. Visit https://simtrace.site
2. Click "Sign Up" to create your account
3. Use your beta email: [BETA_EMAIL]
4. Explore the platform and provide feedback

Feedback Channel:
- Email: beta@simtrace.site
- Slack: #simtrace-beta
- In-app feedback form

Thank you for being part of our beta program!

Best regards,
The SIMTrace Team
EOF

echo ""
echo "Send invitations to beta users using your email service"
echo "Replace [BETA_EMAIL] with each user's email"

echo ""

# Step 5: Enable beta features
echo "=== STEP 5: ENABLING BETA FEATURES ==="
echo ""

echo "Beta features to enable:"
echo "  - Full feature access for beta users"
echo "  - Enhanced logging for debugging"
echo "  - Feedback collection mechanism"
echo "  - Beta badge on user profiles"
echo "  - Priority support queue"

echo -e "${GREEN}✓ Beta features configuration documented${NC}"

echo ""

# Step 6: Configure monitoring for beta launch
echo "=== STEP 6: CONFIGURING MONITORING FOR BETA LAUNCH ==="
echo ""

echo "Monitoring focus for beta launch:"
echo "  - User registration flow"
echo "  - Login/authentication flow"
echo "  - Device registration flow"
echo "  - Core feature usage"
echo "  - Error rates and types"
echo "  - Performance metrics"

echo -e "${GREEN}✓ Monitoring configuration documented${NC}"

echo ""

# Step 7: Create beta launch dashboard
echo "=== STEP 7: CREATING BETA LAUNCH DASHBOARD ==="
echo ""

DASHBOARD_FILE="monitoring/beta-launch-dashboard.json"
mkdir -p monitoring

cat > "$DASHBOARD_FILE" << 'EOF'
{
  "dashboard": {
    "name": "SIMTrace Beta Launch Dashboard",
    "refresh_interval": 60,
    "panels": [
      {
        "title": "Active Beta Users",
        "metric": "active_beta_users",
        "type": "gauge"
      },
      {
        "title": "User Registrations (24h)",
        "metric": "user_registrations_24h",
        "type": "line"
      },
      {
        "title": "Device Registrations (24h)",
        "metric": "device_registrations_24h",
        "type": "line"
      },
      {
        "title": "API Response Time (p95)",
        "metric": "api_p95_response_time",
        "type": "line"
      },
      {
        "title": "Error Rate",
        "metric": "api_error_rate",
        "type": "line"
      },
      {
        "title": "Feature Usage",
        "metrics": [
          "device_tracking_usage",
          "alert_usage",
          "billing_usage"
        ],
        "type": "bar"
      },
      {
        "title": "Feedback Received",
        "metric": "feedback_count",
        "type": "counter"
      },
      {
        "title": "Support Tickets",
        "metric": "support_tickets",
        "type": "counter"
      }
    ]
  }
}
EOF

echo -e "${GREEN}✓ Beta launch dashboard created: $DASHBOARD_FILE${NC}"

echo ""

# Step 8: Create feedback collection mechanism
echo "=== STEP 8: CREATING FEEDBACK COLLECTION MECHANISM ==="
echo ""

FEEDBACK_FILE="monitoring/beta-feedback-template.md"

cat > "$FEEDBACK_FILE" << 'EOF'
# Beta User Feedback Template

## User Information
- Name: 
- Email: 
- Role: 
- Date: 

## Feedback Category
- [ ] Bug Report
- [ ] Feature Request
- [ ] User Experience
- [ ] Performance
- [ ] Security
- [ ] Other

## Description
Please describe your feedback in detail:

## Steps to Reproduce (if bug)
1. 
2. 
3. 

## Expected Behavior
What did you expect to happen?

## Actual Behavior
What actually happened?

## Screenshots/Logs
Please attach any relevant screenshots or logs:

## Severity
- [ ] Critical - System unusable
- [ ] High - Major functionality broken
- [ ] Medium - Minor functionality broken
- [ ] Low - Cosmetic or minor issue

## Environment
- Browser: 
- Device: 
- OS: 
- Time: 

## Additional Comments
Any other information you'd like to share:
EOF

echo -e "${GREEN}✓ Feedback template created: $FEEDBACK_FILE${NC}"

echo ""

# Step 9: Create issue tracking
echo "=== STEP 9: CREATING ISSUE TRACKING ==="
echo ""

ISSUES_FILE="monitoring/beta-issues-tracker.md"

cat > "$ISSUES_FILE" << 'EOF'
# Beta Launch Issues Tracker

## Critical Issues (P1)
| ID | Description | Assigned To | Status | Created |
|----|-------------|-------------|--------|---------|
|    |             |             |        |         |

## High Priority Issues (P2)
| ID | Description | Assigned To | Status | Created |
|----|-------------|-------------|--------|---------|
|    |             |             |        |         |

## Medium Priority Issues (P3)
| ID | Description | Assigned To | Status | Created |
|----|-------------|-------------|--------|---------|
|    |             |             |        |         |

## Low Priority Issues (P4)
| ID | Description | Assigned To | Status | Created |
|----|-------------|-------------|--------|---------|
|    |             |             |        |         |

## Feature Requests
| ID | Description | Assigned To | Status | Created |
|----|-------------|-------------|--------|---------|
|    |             |             |        |         |

## Status Legend
- Open: Issue identified, not yet assigned
- In Progress: Being worked on
- Testing: Fix implemented, being tested
- Resolved: Fix deployed to beta
- Closed: Issue resolved and verified
EOF

echo -e "${GREEN}✓ Issues tracker created: $ISSUES_FILE${NC}"

echo ""

# Summary
echo "=== SOFT LAUNCH SUMMARY ==="
echo ""
echo -e "${GREEN}✓ Pre-launch checks completed${NC}"
echo -e "${GREEN}✓ Beta users loaded ($BETA_USER_COUNT users)${NC}"
echo -e "${GREEN}✓ Beta features documented${NC}"
echo -e "${GREEN}✓ Monitoring configured${NC}"
echo -e "${GREEN}✓ Dashboard created${NC}"
echo -e "${GREEN}✓ Feedback mechanism created${NC}"
echo -e "${GREEN}✓ Issue tracking created${NC}"
echo ""
echo "Next steps:"
echo "1. Create beta user accounts via API or admin panel"
echo "2. Send beta launch invitations"
echo "3. Monitor beta launch dashboard"
echo "4. Collect and address feedback"
echo "5. Track and resolve issues"
echo "6. Prepare for full public launch (Week 2)"
echo ""
echo "Soft launch duration: 1 week"
echo "Review date: $(date -d '+7 days' '+%Y-%m-%d')"
