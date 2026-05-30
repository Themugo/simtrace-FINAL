# Login Credentials for Testing

## Overview
This document provides login credentials for testing all user types in the SimTrace platform.

## Important Notes

- **Real Accounts:** Admin and Customer Support are real accounts with full system access
- **Demo Accounts:** All other accounts are demo accounts with realistic test data
- **Test Data:** Demo accounts contain realistic device data, cases, and usage patterns
- **Security:** These credentials are for testing purposes only - change before production deployment

---

## 1. Individual User (Demo Account)

**Account Type:** Demo Account (Free Plan)
**Purpose:** Test individual device tracking, IMEI checking, theft reporting

### Login Credentials
```
Email: john.doe@demo-simtrace.com
Password: DemoUser123!
```

### Demo Data Included
- **Devices:** 3 devices
  - iPhone 13 (IMEI: 356938090643522) - Online, Battery 85%
  - MacBook Pro (IMEI: 356938090643523) - Online, Battery 92%
  - iPad Air (IMEI: 356938090643524) - Offline, Battery --
- **Location History:** 30 days of location data for all devices
- **IMEI Checks:** 15 historical IMEI checks
- **Alerts:** 3 alerts (device left safe zone, battery low, device offline)
- **Theft Reports:** 1 active theft report (iPad Air)

### Test Scenarios
- View device dashboard
- Check real-time device location
- View location history
- Perform IMEI check
- Report stolen device
- Set up safe zones
- Configure notifications
- Test mobile responsive design

---

## 2. Business User - Professional Plan (Demo Account)

**Account Type:** Demo Account (Professional Plan - 50 devices, $79/month)
**Purpose:** Test business device management, team collaboration, reporting

### Login Credentials
```
Email: sarah.johnson@acme-demo.com
Password: BusinessDemo123!
```

### Demo Data Included
- **Devices:** 25 devices (out of 50 limit)
  - 15 Smartphones (iPhone 13, 14, 15, Samsung Galaxy S23, etc.)
  - 8 Laptops (MacBook Pro, Dell XPS, ThinkPad, etc.)
  - 2 Tablets (iPad Air, Surface Pro)
- **Team Members:** 5 team members
  - John Smith (Admin)
  - Mike Johnson (Member)
  - Lisa Davis (Member)
  - Tom Wilson (Member)
  - Sarah Brown (Member)
- **Device Assignments:** All devices assigned to team members
- **Usage Analytics:** 30 days of usage data
- **Reports:** 5 generated reports
- **Alerts:** 12 alerts (devices offline, battery low, etc.)
- **IMEI Checks:** 150 historical checks

### Test Scenarios
- View business dashboard with plan usage
- Manage device assignments
- Invite team members
- Generate reports
- Bulk import devices
- View usage analytics
- Upgrade/downgrade plan
- Test plan limit warnings

---

## 3. Business User - Enterprise Plan (Demo Account)

**Account Type:** Demo Account (Enterprise Plan - 1,000 devices, $499/month)
**Purpose:** Test large-scale device management, RBAC, API access, compliance

### Login Credentials
```
Email: michael.chen@globaltech-demo.com
Password: EnterpriseDemo123!
```

### Demo Data Included
- **Devices:** 5,234 devices (over limit - shows upgrade prompt)
  - 2,345 Smartphones
  - 1,890 Laptops
  - 890 Tablets
  - 109 Other devices
- **Team Members:** 150 team members (over limit)
- **Regional Distribution:**
  - North America: 2,345 devices
  - Europe: 1,890 devices
  - Asia Pacific: 890 devices
  - Other: 109 devices
- **Departments:** Sales, IT, HR, Marketing, Operations
- **Compliance:** 98.5% compliance score
- **API Usage:** 45,678 API calls (91% of 50,000 limit)
- **Security Alerts:** 23 alerts
- **Audit Logs:** 30 days of audit trail

### Test Scenarios
- View executive dashboard
- Test plan over-limit warnings
- Manage RBAC and roles
- Use API endpoints
- View compliance dashboards
- Configure SSO
- Test integrations
- Generate compliance reports

---

## 4. Law Enforcement User (Demo Account)

**Account Type:** Demo Account (Agency-wide access)
**Purpose:** Test case management, stolen device tracking, agency coordination

### Login Credentials
```
Agency Email: detective.wilson@nypd-demo.gov
Agency ID: NYPD-NYC-001
Password: LawEnforcement123!
```

### Demo Data Included
- **Active Cases:** 12 active cases
  - Case #2024-001: Residential burglary (12 devices, High priority)
  - Case #2024-002: Vehicle theft (8 devices, Medium priority)
  - Case #2024-003: Store robbery (15 devices, High priority)
  - Case #2024-004: Pickpocketing (3 devices, Low priority)
  - + 8 more cases
- **Tracked Stolen Devices:** 156 devices
  - 89 located
  - 67 not located
- **Agency Coordination:** 5 connected agencies
  - LAPD (23 shared alerts)
  - FBI (15 shared alerts)
  - Chicago PD (8 shared alerts)
  - Houston PD (pending connection)
  - Miami PD (pending connection)
- **Evidence:** 8 evidence items per case with chain of custody
- **Real-Time Alerts:** 23 shared alerts from other agencies
- **Officer Management:** 25 officers in system

### Test Scenarios
- View law enforcement dashboard
- Create new case
- Add stolen devices to case
- Track device location in real-time
- Share alerts with other agencies
- Generate court-ready reports
- View chain of custody
- Test agency-wide search
- Configure legal compliance settings

---

## 5. Telecom User (Demo Account)

**Account Type:** Demo Account (Telecom Provider)
**Purpose:** Test IMEI verification, fraud detection, API integration

### Login Credentials
```
Email: alex.rodriguez@telecom-demo.com
Password: TelecomDemo123!
```

### Demo Data Included
- **IMEI Verifications:** 12,456 verifications this month
- **Fraud Detection:** 23 fraudulent devices detected
- **API Usage:** 1.2M API requests this month
- **Performance Metrics:**
  - Average response time: 45ms
  - Success rate: 99.8%
  - Error rate: 0.2%
- **Provider Integration:** 3 telecom providers integrated
  - Provider A (T-Mobile)
  - Provider B (AT&T)
  - Provider C (Verizon)
- **Bulk Processing:** 5,000 bulk IMEI checks performed
- **SLA Monitoring:** 99.9% uptime

### Test Scenarios
- Perform IMEI verification
- View fraud detection alerts
- Monitor API usage
- Test bulk processing
- View performance metrics
- Configure provider integrations
- Monitor SLA compliance
- Generate telecom reports

---

## 6. Admin User (Real Account)

**Account Type:** Real Account (System Administrator)
**Purpose:** Full system administration, user management, system monitoring

### Login Credentials
```
Email: admin@simtrace.com
Password: AdminSecure2024!
```

### Access Level
- Full system access
- User management (create, edit, delete, suspend users)
- System configuration
- View all system logs
- Manage support tickets
- Generate system reports
- Security settings
- Billing management
- API key management

### Real Data
- All real user data
- All real device data
- All real system metrics
- All real support tickets
- All real audit logs

### Test Scenarios
- View system health dashboard
- Manage users (all types)
- View system logs
- Configure system settings
- Manage support tickets
- Generate system reports
- Monitor security
- Manage billing

---

## 7. Customer Support User (Real Account)

**Account Type:** Real Account (Customer Support)
**Purpose:** Help users, resolve issues, manage support tickets

### Login Credentials
```
Email: support@simtrace.com
Password: SupportSecure2024!
```

### Access Level
- View all user accounts
- Access user device data
- Manage support tickets
- View user activity history
- Escalate issues to admin
- Access knowledge base
- Generate support reports

### Real Data
- All real user data
- All real support tickets
- All real user activity
- All real device data

### Test Scenarios
- View user information
- Manage support tickets
- Access user device data
- View user activity history
- Escalate issues
- Generate support reports
- Test knowledge base

---

## Quick Reference Table

| User Type | Email | Password | Account Type | Demo Data |
|-----------|-------|----------|--------------|-----------|
| Individual | john.doe@demo-simtrace.com | DemoUser123! | Demo | 3 devices, location history |
| Business (Pro) | sarah.johnson@acme-demo.com | BusinessDemo123! | Demo | 25 devices, 5 team members |
| Business (Ent) | michael.chen@globaltech-demo.com | EnterpriseDemo123! | Demo | 5,234 devices, 150 team members |
| Law Enforcement | detective.wilson@nypd-demo.gov + Agency ID: NYPD-NYC-001 | LawEnforcement123! | Demo | 12 cases, 156 stolen devices |
| Telecom | alex.rodriguez@telecom-demo.com | TelecomDemo123! | Demo | 12,456 IMEI checks, fraud detection |
| Admin | admin@simtrace.com | AdminSecure2024! | Real | Full system access |
| Support | support@simtrace.com | SupportSecure2024! | Real | All user data, support tickets |

---

## Testing Checklist

### Individual User Testing
- [ ] Login successfully
- [ ] View dashboard
- [ ] Check device location
- [ ] View location history
- [ ] Perform IMEI check
- [ ] Report stolen device
- [ ] Set up safe zone
- [ ] Configure notifications
- [ ] Test mobile view

### Business User Testing
- [ ] Login successfully
- [ ] View dashboard with plan usage
- [ ] Manage device assignments
- [ ] Invite team member
- [ ] Generate report
- [ ] Bulk import devices
- [ ] View usage analytics
- [ ] Test plan upgrade
- [ ] Test plan downgrade

### Law Enforcement Testing
- [ ] Login with agency ID
- [ ] View dashboard
- [ ] Create new case
- [ ] Add stolen device
- [ ] Track device location
- [ ] Share alert with agency
- [ ] Generate court report
- [ ] View chain of custody
- [ ] Test agency search

### Telecom Testing
- [ ] Login successfully
- [ ] Perform IMEI verification
- [ ] View fraud alerts
- [ ] Monitor API usage
- [ ] Test bulk processing
- [ ] View performance metrics
- [ ] Configure provider integration
- [ ] Monitor SLA

### Admin Testing
- [ ] Login successfully
- [ ] View system health
- [ ] Manage users
- [ ] View system logs
- [ ] Configure settings
- [ ] Manage support tickets
- [ ] Generate reports
- [ ] Monitor security

### Support Testing
- [ ] Login successfully
- [ ] View user information
- [ ] Manage support tickets
- [ ] Access user devices
- [ ] View user activity
- [ ] Escalate issue
- [ ] Generate reports
- [ ] Access knowledge base

---

## Data Seeding Script

To create these demo accounts and data, use the following seed script:

```javascript
// backend/scripts/seed-demo-data.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to database
mongoose.connect(process.env.MONGO_URI);

// Demo accounts data
const demoAccounts = [
  {
    email: 'john.doe@demo-simtrace.com',
    password: bcrypt.hashSync('DemoUser123!', 10),
    role: 'individual',
    plan: 'free',
    devices: [
      { imei: '356938090643522', name: 'iPhone 13', type: 'smartphone', status: 'online', battery: 85 },
      { imei: '356938090643523', name: 'MacBook Pro', type: 'laptop', status: 'online', battery: 92 },
      { imei: '356938090643524', name: 'iPad Air', type: 'tablet', status: 'offline', battery: null }
    ]
  },
  {
    email: 'sarah.johnson@acme-demo.com',
    password: bcrypt.hashSync('BusinessDemo123!', 10),
    role: 'business',
    plan: 'professional',
    devices: generateBusinessDevices(25),
    teamMembers: generateTeamMembers(5)
  },
  {
    email: 'michael.chen@globaltech-demo.com',
    password: bcrypt.hashSync('EnterpriseDemo123!', 10),
    role: 'business',
    plan: 'enterprise',
    devices: generateEnterpriseDevices(5234),
    teamMembers: generateTeamMembers(150)
  },
  {
    email: 'detective.wilson@nypd-demo.gov',
    password: bcrypt.hashSync('LawEnforcement123!', 10),
    role: 'law_enforcement',
    agencyId: 'NYPD-NYC-001',
    cases: generateLawEnforcementCases(12),
    trackedDevices: generateStolenDevices(156)
  },
  {
    email: 'alex.rodriguez@telecom-demo.com',
    password: bcrypt.hashSync('TelecomDemo123!', 10),
    role: 'telecom',
    imeiVerifications: 12456,
    fraudDetection: 23,
    apiUsage: 1200000
  }
];

// Real accounts (admin and support)
const realAccounts = [
  {
    email: 'admin@simtrace.com',
    password: bcrypt.hashSync('AdminSecure2024!', 10),
    role: 'admin'
  },
  {
    email: 'support@simtrace.com',
    password: bcrypt.hashSync('SupportSecure2024!', 10),
    role: 'support'
  }
];

// Seed function
async function seedData() {
  try {
    // Clear existing demo data
    await User.deleteMany({ email: /@demo/ });
    
    // Insert demo accounts
    await User.insertMany(demoAccounts);
    
    // Ensure real accounts exist
    for (const account of realAccounts) {
      await User.findOneAndUpdate(
        { email: account.email },
        account,
        { upsert: true }
      );
    }
    
    console.log('Demo data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
```

Run the seed script:
```bash
cd backend
node scripts/seed-demo-data.js
```

---

## Security Notes

### Before Production Deployment
1. **Change all real account passwords**
2. **Remove all demo accounts** or change passwords
3. **Disable demo account creation** in production
4. **Implement proper authentication** (OAuth, SSO)
5. **Enable rate limiting** on login endpoints
6. **Implement account lockout** after failed attempts
7. **Enable 2FA** for all admin accounts
8. **Audit all user accounts** before going live

### Demo Account Security
- Demo accounts should only exist in staging/development
- Use IP whitelisting for demo account access
- Set demo account passwords to expire regularly
- Log all demo account activity
- Limit demo account API usage
- Implement session timeouts for demo accounts

---

## Contact

For questions about these test credentials:
- Development Team: dev@simtrace.com
- QA Team: qa@simtrace.com
- Security Team: security@simtrace.com
