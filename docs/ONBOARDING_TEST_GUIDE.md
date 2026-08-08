# Intelligent Onboarding Testing Guide

## Overview

This document provides instructions for testing the intelligent onboarding flow that auto-scans device identifiers and creates accounts using phone number verification.

## Prerequisites

### Environment Setup
- Android Studio or Xcode installed
- Physical Android or iOS device (recommended for testing)
- Expo development environment
- Backend API running locally or on staging
- Africa's Talking SMS API configured (or use dev mode)

### Required Environment Variables
```
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_africas_talking_username
AT_SENDER_ID=SIMTRACE
BACKEND_URL=http://localhost:4000
```

## Test Scenarios

### Scenario 1: Full Onboarding Flow (Happy Path)

**Steps:**
1. Install fresh app on device
2. Launch app - should see OnboardingWelcomeScreen
3. Tap "Get Started" - should see PermissionRequestScreen
4. Tap "Allow" - should grant permissions
5. Should see PhoneVerificationScreen with auto-detected phone number
6. Tap "Send Code" - should receive SMS with 6-digit code
7. Enter code and tap "Verify Code" - should verify successfully
8. Should see DeviceScanningScreen with progress animation
9. Should see DeviceReviewScreen with scanned device information
10. Review information and tap "Confirm and Create Account"
11. Should see AccountCreationScreen with summary
12. Tap "Create Account" - should create account and register device
13. Should see success message and redirect to Dashboard

**Expected Results:**
- All screens display correctly
- Permissions granted successfully
- SMS code received within 30 seconds
- Code verification succeeds
- Device scanning completes within 10 seconds
- All device information displayed
- Account created successfully
- Device registered in database
- User redirected to Dashboard

### Scenario 2: Permission Denied

**Steps:**
1. Launch app
2. On PermissionRequestScreen, tap "Enter Manually"
3. Should navigate to manual entry flow

**Expected Results:**
- Graceful fallback to manual entry
- User can still complete onboarding manually

### Scenario 3: Invalid Verification Code

**Steps:**
1. Complete phone verification step
2. Enter incorrect 6-digit code
3. Tap "Verify Code"

**Expected Results:**
- Error message displayed
- User can retry
- Code expires after 5 minutes

### Scenario 4: Device Scanning Failure

**Steps:**
1. Complete phone verification
2. Simulate device scanning failure (disable permissions)
3. Should navigate to manual entry

**Expected Results:**
- Error handling works
- Fallback to manual entry
- User can still complete onboarding

### Scenario 5: Network Error During SMS

**Steps:**
1. Disable network connection
2. Try to send verification code

**Expected Results:**
- Appropriate error message
- User can retry when network restored
- Code not consumed

### Scenario 6: Device Already Registered

**Steps:**
1. Complete onboarding with device
2. Try to register same device again

**Expected Results:**
- Error message: "Device already registered"
- User can register different device

## Manual Testing Checklist

### Welcome Screen
- [ ] Logo displays correctly
- [ ] Feature list displays correctly
- [ ] "Get Started" button works
- [ ] Privacy policy link works

### Permission Request Screen
- [ ] Permission descriptions clear
- [ ] "Allow" button requests permissions
- [ ] "Enter Manually" button works
- [ ] Privacy link works
- [ ] Back button works

### Phone Verification Screen
- [ ] Phone number auto-detected (if available)
- [ ] Phone number can be edited
- [ ] "Send Code" button works
- [ ] SMS received within 30 seconds
- [ ] Code input accepts 6 digits
- [ ] "Verify Code" button works
- [ ] Correct code succeeds
- [ ] Incorrect code fails
- [ ] Resend button works after countdown
- [ ] Countdown timer works correctly

### Device Scanning Screen
- [ ] Progress bar updates correctly
- [ ] Current scan step displays
- [ ] Scan completes within 10 seconds
- [ ] All scan steps marked complete
- [ ] Navigation to next screen works

### Device Review Screen
- [ ] All device information displayed
- [ ] IMEI masked (last 4 digits only)
- [ ] Information can be edited
- [ ] "Confirm and Create Account" button works
- [ ] "Go Back" button works
- [ ] Privacy note displayed

### Account Creation Screen
- [ ] Account summary displays correctly
- [ ] Device information correct
- [ ] Plan information correct
- [ ] "Create Account" button works
- [ ] Loading state displays
- [ ] Success message displays
- [ ] Redirect to Dashboard works

### Backend API Testing

### POST /api/auth/verify-phone
```bash
curl -X POST http://localhost:4000/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+254700000000"}'
```

**Expected Response:**
```json
{
  "message": "Verification code sent successfully",
  "expiresAt": "2026-06-06T12:05:00.000Z"
}
```

### POST /api/auth/confirm-phone
```bash
curl -X POST http://localhost:4000/api/auth/confirm-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+254700000000", "code": "123456"}'
```

**Expected Response:**
```json
{
  "message": "Phone verified successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User 0000",
    "phoneNumber": "+254700000000",
    "email": "+254700000000@simtrace.site",
    "role": "user",
    "phoneVerified": true
  }
}
```

### POST /api/devices/auto-register
```bash
curl -X POST http://localhost:4000/api/devices/auto-register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt_token_here" \
  -d '{
    "deviceInfo": {
      "imei": "123456789012345",
      "serialNumber": "SN123456",
      "model": "Pixel 6",
      "brand": "Google",
      "osVersion": "13.0",
      "platform": "android",
      "deviceDna": "abc123...",
      "screenResolution": "1080x2400",
      "totalStorage": 128000000000,
      "availableStorage": 64000000000,
      "cpuInfo": "arm64-v8a"
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Device registered successfully",
  "device": {
    "owner": "user_id",
    "imei": "123456789012345",
    "model": "Pixel 6",
    "brand": "Google",
    "status": "active",
    "trackingEnabled": true
  }
}
```

## Performance Testing

### Onboarding Completion Time
- **Target:** < 3 minutes
- **Measurement:** Time from welcome screen to dashboard
- **Acceptable:** < 5 minutes

### SMS Delivery Time
- **Target:** < 30 seconds
- **Measurement:** Time from "Send Code" to SMS received
- **Acceptable:** < 60 seconds

### Device Scanning Time
- **Target:** < 10 seconds
- **Measurement:** Time from scanning start to complete
- **Acceptable:** < 20 seconds

## Security Testing

### Permission Handling
- [ ] Permissions only requested when needed
- [ ] Clear explanation of why permissions needed
- [ ] User can deny permissions gracefully
- [ ] Fallback to manual entry when denied

### Data Protection
- [ ] IMEI masked in UI (last 4 digits only)
- [ ] Device DNA is one-way hash
- [ ] Sensitive data encrypted in SecureStore
- [ ] No sensitive data in logs

### SMS Security
- [ ] Code expires after 5 minutes
- [ ] Rate limiting on SMS requests
- [ ] Max 3 attempts per phone number
- [ ] Code not displayed in logs

## Accessibility Testing

### Screen Reader Support
- [ ] All screens readable by screen reader
- [ ] Buttons have accessible labels
- [ ] Progress indicators announced
- [ ] Error messages announced

### Visual Accessibility
- [ ] Sufficient color contrast
- [ ] Text size adjustable
- [ ] Touch targets at least 44x44px
- [ ] Clear visual hierarchy

## Edge Cases

### No Phone Number Available
- User can manually enter phone number
- Auto-detect shows "Not available"
- Manual entry works correctly

### Dual SIM Device
- Both IMEIs scanned
- Both displayed in review
- Both registered in database

### No IMEI Access (Android 10+)
- Falls back to device DNA
- Serial number used as identifier
- User can manually enter IMEI

### Network Offline
- Appropriate error message
- User can retry when online
- No data loss

### SMS Not Delivered
- User can resend code
- Countdown timer works
- Code not consumed

## Known Limitations

### IMEI Access
- Android 10+ restricts IMEI access
- iOS restricts IMEI access
- Requires native module for production
- Currently uses placeholder

### SMS Delivery
- Dependent on Africa's Talking API
- International SMS may be delayed
- Some carriers may block SMS

### Device DNA
- Simple hash function (not crypto-grade)
- May change with OS updates
- Should use SHA-256 in production

## Production Deployment Checklist

- [ ] Native modules for IMEI access integrated
- [ ] Production SMS API configured
- [ ] Device DNA uses SHA-256
- [ ] Error tracking (Sentry) configured
- [ ] Analytics implemented
- [ ] A/B testing framework ready
- [ ] Rollback mechanism in place

## Success Metrics

### Onboarding Completion Rate
- **Target:** >80%
- **Measurement:** Users who complete all 7 steps
- **Current:** To be measured

### Time to Complete
- **Target:** <3 minutes
- **Measurement:** Average time from start to dashboard
- **Current:** To be measured

### Error Rate
- **Target:** <5%
- **Measurement:** Users who encounter errors during onboarding
- **Current:** To be measured

### User Satisfaction
- **Target:** >4.5/5 stars
- **Measurement:** Post-onboarding survey
- **Current:** To be measured

## Bug Reporting

When reporting bugs, include:
1. Device model and OS version
2. App version
3. Step where bug occurred
4. Expected behavior
5. Actual behavior
6. Screenshots/video if possible
7. Logs from device

## Next Steps

1. Complete manual testing checklist
2. Fix any identified issues
3. Implement native modules for IMEI access
4. Upgrade device DNA to SHA-256
5. Add analytics tracking
6. Conduct beta testing
7. Monitor production metrics
8. Iterate based on feedback
