#!/bin/bash

# Monitoring Alerts Configuration Script
# This script configures monitoring alerts for SIMTrace

echo "=== SIMTRACE MONITORING ALERTS CONFIGURATION ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SENTRY_DSN="${SENTRY_DSN:-}"
SENTRY_PROJECT="${SENTRY_PROJECT:-simtrace}"
SENTRY_ORG="${SENTRY_ORG:-simtrace}"
BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Step 1: Configure Sentry Alerts
echo "=== STEP 1: CONFIGURING SENTRY ALERTS ==="
echo ""

if [ -z "$SENTRY_DSN" ]; then
    echo -e "${YELLOW}○ SENTRY_DSN not set, skipping Sentry configuration${NC}"
    echo "Please set SENTRY_DSN to configure Sentry alerts"
else
    echo -e "${GREEN}✓ SENTRY_DSN is set${NC}"
    echo ""
    echo "Sentry alert rules to configure:"
    echo "1. Error rate > 5% for 5 minutes"
    echo "2. Error rate > 10% for 1 minute (critical)"
    echo "3. New issue with tag 'production'"
    echo "4. Performance degradation (p95 > 1s)"
    echo ""
    echo "Configure these in Sentry dashboard:"
    echo "https://sentry.io/settings/$SENTRY_ORG/projects/$SENTRY_PROJECT/alerts/"
fi

echo ""

# Step 2: Configure Uptime Monitoring
echo "=== STEP 2: CONFIGURING UPTIME MONITORING ==="
echo ""

echo "Uptime monitoring endpoints to configure:"
echo "1. Backend Health: $BACKEND_URL/api/health"
echo "2. Frontend Home: $FRONTEND_URL/"
echo "3. Backend Auth: $BACKEND_URL/api/auth/me"
echo ""
echo "Alert thresholds:"
echo "- Response time > 2s (warning)"
echo "- Response time > 5s (critical)"
echo "- Uptime < 99.5% (warning)"
echo "- Uptime < 99% (critical)"
echo ""
echo "Recommended tools:"
echo "- UptimeRobot (https://uptimerobot.com)"
echo "- Pingdom (https://pingdom.com)"
echo "- StatusCake (https://statuscake.com)"

echo ""

# Step 3: Configure Database Monitoring
echo "=== STEP 3: CONFIGURING DATABASE MONITORING ==="
echo ""

echo "MongoDB Atlas monitoring alerts to configure:"
echo "1. CPU utilization > 80% (warning)"
echo "2. CPU utilization > 95% (critical)"
echo "3. Memory utilization > 80% (warning)"
echo "4. Memory utilization > 95% (critical)"
echo "5. Disk utilization > 80% (warning)"
echo "6. Disk utilization > 95% (critical)"
echo "7. Connection count > 80% of max"
echo "8. Query performance > 100ms (warning)"
echo "9. Query performance > 500ms (critical)"
echo ""
echo "Configure in MongoDB Atlas dashboard:"
echo "https://cloud.mongodb.com/"

echo ""

# Step 4: Configure Application Performance Monitoring
echo "=== STEP 4: CONFIGURING APPLICATION PERFORMANCE MONITORING ==="
echo ""

echo "Application metrics to monitor:"
echo "1. API response time (p50, p95, p99)"
echo "2. Error rate by endpoint"
echo "3. Request rate (RPS)"
echo "4. Active connections"
echo "5. Memory usage"
echo "6. CPU usage"
echo ""
echo "Alert thresholds:"
echo "- API p95 response time > 500ms (warning)"
echo "- API p95 response time > 1000ms (critical)"
echo "- Error rate > 1% (warning)"
echo "- Error rate > 5% (critical)"
echo "- Request rate > 1000/sec (scale warning)"

echo ""

# Step 5: Configure Security Monitoring
echo "=== STEP 5: CONFIGURING SECURITY MONITORING ==="
echo ""

echo "Security events to alert on:"
echo "1. Failed login attempts > 10/min from single IP"
echo "2. Failed login attempts > 100/min globally"
echo "3. Rate limit violations > 50/min"
echo "4. Suspicious API key usage"
echo "5. Unauthorized access attempts"
echo "6. Data export activities"
echo "7. Admin dashboard access"
echo ""
echo "Configure in application logs and monitoring system"

echo ""

# Step 6: Configure Business Metrics
echo "=== STEP 6: CONFIGURING BUSINESS METRICS ==="
echo ""

echo "Business metrics to monitor:"
echo "1. User registrations per hour"
echo "2. Active users (DAU, MAU)"
echo "3. Device registrations per hour"
echo "4. Subscription signups per hour"
echo "5. API calls per hour"
echo ""
echo "Alert thresholds:"
echo "- User registrations = 0 for 1 hour (warning)"
echo "- Device registrations = 0 for 1 hour (warning)"
echo "- API calls drop > 50% (warning)"

echo ""

# Step 7: Create Alert Configuration File
echo "=== STEP 7: CREATING ALERT CONFIGURATION FILE ==="
echo ""

ALERT_CONFIG_FILE="monitoring/alerts-config.json"
mkdir -p monitoring

cat > "$ALERT_CONFIG_FILE" << 'EOF'
{
  "alerts": {
    "uptime": {
      "backend_health": {
        "endpoint": "/api/health",
        "threshold_warning": "response_time > 2s",
        "threshold_critical": "response_time > 5s",
        "notification": "email, slack"
      },
      "frontend_home": {
        "endpoint": "/",
        "threshold_warning": "response_time > 2s",
        "threshold_critical": "response_time > 5s",
        "notification": "email, slack"
      }
    },
    "performance": {
      "api_response_time": {
        "metric": "api_p95_response_time",
        "threshold_warning": "500ms",
        "threshold_critical": "1000ms",
        "notification": "email, slack"
      },
      "error_rate": {
        "metric": "api_error_rate",
        "threshold_warning": "1%",
        "threshold_critical": "5%",
        "notification": "email, slack, pagerduty"
      }
    },
    "database": {
      "cpu_utilization": {
        "metric": "mongodb_cpu",
        "threshold_warning": "80%",
        "threshold_critical": "95%",
        "notification": "email, slack"
      },
      "memory_utilization": {
        "metric": "mongodb_memory",
        "threshold_warning": "80%",
        "threshold_critical": "95%",
        "notification": "email, slack"
      },
      "disk_utilization": {
        "metric": "mongodb_disk",
        "threshold_warning": "80%",
        "threshold_critical": "95%",
        "notification": "email, slack"
      }
    },
    "security": {
      "failed_logins": {
        "metric": "failed_login_rate",
        "threshold_warning": "10/min per IP",
        "threshold_critical": "100/min globally",
        "notification": "email, slack, pagerduty"
      },
      "rate_limit_violations": {
        "metric": "rate_limit_violations",
        "threshold_warning": "50/min",
        "threshold_critical": "100/min",
        "notification": "email, slack"
      }
    },
    "business": {
      "user_registrations": {
        "metric": "user_registrations_per_hour",
        "threshold_warning": "0 for 1 hour",
        "notification": "email"
      },
      "device_registrations": {
        "metric": "device_registrations_per_hour",
        "threshold_warning": "0 for 1 hour",
        "notification": "email"
      }
    }
  },
  "notification_channels": {
    "email": {
      "enabled": true,
      "recipients": ["devops@simtrace.site", "cto@simtrace.site"]
    },
    "slack": {
      "enabled": true,
      "webhook": "SLACK_WEBHOOK_URL"
    },
    "pagerduty": {
      "enabled": true,
      "integration_key": "PAGERDUTY_INTEGRATION_KEY"
    }
  }
}
EOF

echo -e "${GREEN}✓ Alert configuration file created: $ALERT_CONFIG_FILE${NC}"

echo ""

# Step 8: Create Status Page Configuration
echo "=== STEP 8: CREATING STATUS PAGE CONFIGURATION ==="
echo ""

STATUS_PAGE_FILE="monitoring/status-page-config.json"

cat > "$STATUS_PAGE_FILE" << 'EOF'
{
  "status_page": {
    "name": "SIMTrace Status",
    "url": "https://status.simtrace.site",
    "services": [
      {
        "name": "API Backend",
        "description": "REST API and WebSocket services",
        "endpoint": "/api/health",
        "group": "Core Services"
      },
      {
        "name": "Web Application",
        "description": "Frontend web application",
        "endpoint": "/",
        "group": "Core Services"
      },
      {
        "name": "Mobile API",
        "description": "Mobile app API endpoints",
        "endpoint": "/api/health",
        "group": "Core Services"
      },
      {
        "name": "Database",
        "description": "MongoDB database cluster",
        "group": "Infrastructure"
      },
      {
        "name": "Email Service",
        "description": "SendGrid email delivery",
        "group": "Third-Party Services"
      },
      {
        "name": "Payment Processing",
        "description": "Stripe payment gateway",
        "group": "Third-Party Services"
      },
      {
        "name": "M-Pesa Integration",
        "description": "M-Pesa payment gateway",
        "group": "Third-Party Services"
      }
    ],
    "incident_history": true,
    "subscribe_to_updates": true,
    "auto_refresh": 60
  }
}
EOF

echo -e "${GREEN}✓ Status page configuration created: $STATUS_PAGE_FILE${NC}"

echo ""

# Summary
echo "=== MONITORING ALERTS CONFIGURATION SUMMARY ==="
echo ""
echo -e "${GREEN}✓ Configuration files created${NC}"
echo ""
echo "Manual configuration required:"
echo "1. Configure Sentry alerts in Sentry dashboard"
echo "2. Set up uptime monitoring (UptimeRobot, Pingdom, or StatusCake)"
echo "3. Configure MongoDB Atlas alerts"
echo "4. Set up Slack webhook for notifications"
echo "5. Configure PagerDuty integration for critical alerts"
echo "6. Deploy status page (status.simtrace.site)"
echo ""
echo "Next steps:"
echo "1. Update notification channels in alerts-config.json"
echo "2. Deploy status page configuration"
echo "3. Test alert notifications"
echo "4. Execute soft launch to beta users"
