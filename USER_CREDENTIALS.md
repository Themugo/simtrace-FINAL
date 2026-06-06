# SimTrace User Credentials for Live Testing

## Test User Accounts

The following test accounts have been created for live testing of the SimTrace system:

### 1. Admin Account
- **Email:** admin@simtrace.site
- **Password:** Admin@123
- **Role:** admin
- **Phone:** +254700000001
- **Access:** Full admin access to all features including pricing management, user management, and system settings

### 2. Regular User Account
- **Email:** user@simtrace.site
- **Password:** User@123
- **Role:** user
- **Phone:** +254700000002
- **Access:** Standard user features - device registration, tracking, reporting

### 3. Police Officer Account
- **Email:** police@simtrace.site
- **Password:** Police@123
- **Role:** law_enforcement
- **Phone:** +254700000003
- **Access:** Police integration features - case management, nationwide alerts, recovery workflows

### 4. Telecom Admin Account
- **Email:** telecom@simtrace.site
- **Password:** Telecom@123
- **Role:** telecom
- **Phone:** +254700000004
- **Access:** Telecom integration features - SIM card tracking, network activity, cell tower triangulation

## How to Seed These Users

Run the following command to seed these users into your database:

```bash
cd backend
MONGO_URI="your_mongodb_connection_string" npx ts-node scripts/seed-users.ts
```

## Testing Checklist

### Admin Features
- [ ] Login as admin@simtrace.site
- [ ] Access admin dashboard
- [ ] Test pricing management (waivers, discounts)
- [ ] Test user management
- [ ] View system statistics

### Regular User Features
- [ ] Login as user@simtrace.site
- [ ] Register a device
- [ ] Test device tracking
- [ ] Report a stolen device
- [ ] Test panic mode

### Police Features
- [ ] Login as police@simtrace.site
- [ ] Create police station
- [ ] File police report
- [ ] Create nationwide alert
- [ ] Test recovery workflow
- [ ] View police statistics

### Telecom Features
- [ ] Login as telecom@simtrace.site
- [ ] Register SIM card
- [ ] Track SIM card location
- [ ] Flag SIM as stolen
- [ ] View network activity
- [ ] Test cell tower triangulation

## Live Tracking Test

To test live tracking functionality:

1. Register a device using the regular user account
2. Use the mobile app to send location pings
3. Monitor the device location in real-time on the dashboard
4. Test remote lock functionality
5. Test evidence capture

## Recovery Process Test

To test the recovery process:

1. Report a device as stolen using the regular user account
2. File a police report using the police account
3. Create a nationwide alert
4. Track the device location
5. Update recovery stages
6. Test device return process

## Security Notes

- All passwords are temporary and should be changed after initial testing
- These accounts are for testing purposes only
- Do not use these credentials in production
- Enable two-factor authentication for production accounts

## Support

For any issues with these test accounts, contact the system administrator.
