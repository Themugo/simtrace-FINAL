# Intelligent Onboarding Design

## Overview

This document outlines the intelligent onboarding flow that automatically scans device identifiers and creates accounts using phone number verification, similar to WhatsApp's onboarding experience.

## User Flow

### Step 1: Welcome Screen
- Display SIMTrace logo and welcome message
- Brief explanation of the onboarding process
- "Continue" button to proceed

### Step 2: Permission Request
- Request permission to access device information
- Request permission to access phone number
- Explain what data will be collected:
  - Phone number (for verification)
  - IMEI number (device identification)
  - Device model and brand
  - Android/iOS version
  - Device serial number
  - MAC address (if available)
  - Device DNA (unique fingerprint)
- "Allow" and "Deny" buttons
- If denied, fall back to manual entry

### Step 3: Phone Number Verification
- Auto-detect phone number from device
- Display detected number with option to edit
- Send verification code via SMS
- User enters 6-digit code
- Verify code and proceed

### Step 4: Device Scanning
- Display scanning animation
- Automatically collect device identifiers:
  - IMEI 1 (primary SIM)
  - IMEI 2 (dual SIM if available)
  - Device serial number
  - Android/iOS version
  - Device model and brand
  - MAC address (WiFi)
  - Device DNA (unique fingerprint)
  - Screen resolution
  - CPU info
  - Total storage
  - Available storage
- Display progress indicators for each scan

### Step 5: Device Information Display
- Display all collected device information in a clean UI
- Allow user to review and confirm
- Option to edit any information
- "Confirm and Create Account" button

### Step 6: Account Creation
- Automatically create account using verified phone number
- Generate unique user ID
- Create subscription (free tier)
- Register device with all collected identifiers
- Display success message

### Step 7: Dashboard
- Redirect to dashboard
- Show registered device
- Display device status (active, tracking enabled)
- Brief tutorial of key features

## Technical Implementation

### Mobile App (React Native)

**Required Permissions:**
```json
{
  "android": {
    "permissions": [
      "READ_PHONE_STATE",
      "READ_SMS",
      "RECEIVE_SMS",
      "android.permission.READ_PHONE_NUMBERS"
    ]
  },
  "ios": {
    "infoPlist": {
      "NSContactsUsageDescription": "We need access to verify your phone number",
      "NSCameraUsageDescription": "We need camera access for QR code scanning"
    }
  }
}
```

**Device Scanning Libraries:**
- `react-native-device-info` - Device information
- `react-native-imei` - IMEI number
- `react-native-sms-android` - SMS verification
- `react-native-fingerprint-scanner` - Device DNA

**New Screens:**
1. `OnboardingWelcomeScreen.tsx`
2. `PermissionRequestScreen.tsx`
3. `PhoneVerificationScreen.tsx`
4. `DeviceScanningScreen.tsx`
5. `DeviceReviewScreen.tsx`
6. `AccountCreationScreen.tsx`

### Backend API

**New Endpoints:**
- POST /api/auth/verify-phone - Send verification code
- POST /api/auth/confirm-phone - Verify code and create account
- POST /api/devices/auto-register - Auto-register device with scanned data
- GET /api/devices/dna - Get device DNA fingerprint

**Phone Verification Service:**
- Use Africa's Talking SMS API
- Send 6-digit verification code
- Code expires in 5 minutes
- Max 3 attempts per phone number

**Device DNA Algorithm:**
- Combine multiple device identifiers
- Create SHA-256 hash
- Store as unique device fingerprint
- Use for device identification and anti-fraud

## Security Considerations

### Data Collection
- Only collect with explicit user consent
- Clearly explain what data is collected
- Allow user to review before submission
- Provide option to decline specific data points

### Phone Verification
- Use SMS verification (not WhatsApp for now)
- Code expires in 5 minutes
- Rate limit verification attempts
- Prevent phone number enumeration

### Device Identifiers
- IMEI is sensitive - handle carefully
- Encrypt IMEI in database
- Never display full IMEI in UI (show last 4 digits only)
- Device DNA is one-way hash - cannot reverse

### Privacy
- Comply with GDPR and local regulations
- Allow user to delete device data
- Provide data export on request
- Clear retention policy

## Fallback Options

### If Permission Denied
- Fall back to manual IMEI entry
- Manual phone number entry
- Manual device information entry
- Same verification process

### If Phone Number Not Available
- Allow email verification
- Manual phone number entry
- Skip auto-scanning, use manual entry

### If Device Scanning Fails
- Show error message
- Allow manual entry
- Provide troubleshooting tips

## UI/UX Design

### Visual Style
- Clean, modern design
- Progress indicators
- Smooth animations
- Clear call-to-action buttons
- Consistent with SIMTrace branding

### Progress Tracking
- Step indicator (1 of 7)
- Progress bar
- Estimated time remaining
- Ability to go back to previous steps

### Error Handling
- Clear error messages
- Retry buttons
- Help links
- Support contact option

## Success Metrics

### Onboarding Completion Rate
- Target: >80% completion
- Measure: Users who complete all 7 steps

### Time to Complete
- Target: <3 minutes
- Measure: Average time from start to dashboard

### Error Rate
- Target: <5% error rate
- Measure: Users who encounter errors during onboarding

### User Satisfaction
- Target: >4.5/5 stars
- Measure: Post-onboarding survey

## Implementation Phases

### Phase 1: Core Onboarding (Week 1)
- Welcome screen
- Permission request
- Phone verification
- Basic device scanning

### Phase 2: Advanced Scanning (Week 2)
- Device DNA extraction
- Full device information collection
- Device review screen

### Phase 3: Auto Account Creation (Week 3)
- Backend API for auto-registration
- Account creation flow
- Dashboard integration

### Phase 4: Polish and Testing (Week 4)
- UI/UX improvements
- Error handling
- Fallback options
- Beta testing

## Comparison with Current Flow

### Current Flow
1. User manually enters IMEI
2. User manually enters email/OTP
3. User manually enters device details
4. Manual account creation
5. Manual device registration

### New Intelligent Flow
1. Auto-detect phone number
2. SMS verification (like WhatsApp)
3. Auto-scan all device identifiers
4. Auto-create account
5. Auto-register device
6. User reviews and confirms

### Benefits
- Faster onboarding (3 min vs 10 min)
- Higher completion rate
- Better user experience
- More accurate device data
- Demonstrates advanced intelligence
- Competitive advantage

## Technical Challenges

### Platform Differences
- iOS has stricter permissions
- Android IMEI access restricted in Android 10+
- Need platform-specific implementations

### Device DNA Consistency
- Must be consistent across app reinstalls
- Must be unique per device
- Must not change with OS updates

### SMS Verification
- SMS delivery delays
- International SMS costs
- SMS spam filtering

### Privacy Regulations
- GDPR compliance
- Local data protection laws
- User consent requirements

## Future Enhancements

### WhatsApp Verification
- Use WhatsApp Business API
- Send verification via WhatsApp message
- Higher delivery rate than SMS
- Lower cost than SMS

### QR Code Scanning
- Alternative to manual entry
- Scan device QR code
- Quick device registration

### NFC Scanning
- Tap device to register
- For devices with NFC tags
- Instant registration

### Voice Verification
- Verify phone number via call
- Alternative to SMS
- Better accessibility

## Conclusion

This intelligent onboarding flow will significantly improve the user experience by:
- Reducing onboarding time by 70%
- Increasing completion rate by 30%
- Demonstrating advanced technology
- Providing competitive advantage
- Improving data accuracy

Implementation will take 4 weeks with proper testing and validation.
