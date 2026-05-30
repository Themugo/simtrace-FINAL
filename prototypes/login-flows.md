# Login Flows - SimTrace Platform

## Overview
This document defines the login and authentication flows for the SimTrace platform.

## Login Flow 1: Email/Password Login

### Individual User Login

**Screen 1: Login Page**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Welcome Back                           │
│                                         │
│  Email: [_________________]             │
│  Password: [_________________]          │
│                                         │
│  [ ] Remember me                        │
│  Forgot password?                       │
│                                         │
│  [        Sign In        ]             │
│                                         │
│  Don't have an account? Sign up         │
│                                         │
└─────────────────────────────────────────┘
```

**Flow:**
1. User enters email and password
2. Clicks "Sign In"
3. System validates credentials
4. If valid, redirect to dashboard
5. If invalid, show error message

**Error States:**
- Invalid email: "Please enter a valid email address"
- Invalid password: "Incorrect password"
- Account not found: "No account found with this email"
- Account locked: "Account locked. Please contact support"

---

### Business User Login

**Screen 1: Login Page**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace Business               │
├─────────────────────────────────────────┤
│                                         │
│  Business Login                         │
│                                         │
│  Company Email: [_______________]      │
│  Password: [_________________]          │
│                                         │
│  [ ] Remember me                        │
│  Forgot password?                       │
│                                         │
│  [        Sign In        ]             │
│                                         │
│  Need a business account? Contact sales │
│                                         │
└─────────────────────────────────────────┘
```

**Flow:**
1. User enters company email and password
2. Clicks "Sign In"
3. System validates credentials
4. Checks if account is active business account
5. If valid, redirect to business dashboard
6. If invalid, show error message

---

### Enterprise User Login (SSO)

**Screen 1: SSO Login Page**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace Enterprise             │
├─────────────────────────────────────────┤
│                                         │
│  Enterprise Login                       │
│                                         │
│  Sign in with your organization         │
│                                         │
│  [  Sign in with SSO  ]                │
│                                         │
│  Or sign in with email                  │
│                                         │
│  Email: [_________________]             │
│  Password: [_________________]          │
│                                         │
│  [        Sign In        ]             │
│                                         │
└─────────────────────────────────────────┘
```

**Flow:**
1. User clicks "Sign in with SSO"
2. Redirect to organization's SSO provider
3. User authenticates with SSO
4. SSO provider redirects back with token
5. System validates token
6. If valid, create session and redirect to dashboard

---

## Login Flow 2: Social Login

**Screen 1: Social Login Options**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Sign In                               │
│                                         │
│  [  Continue with Google  ]            │
│  [  Continue with Apple   ]             │
│  [  Continue with Facebook ]           │
│                                         │
│  ──────────────────────────────────    │
│                                         │
│  Or sign in with email                  │
│                                         │
│  Email: [_________________]             │
│  Password: [_________________]          │
│                                         │
│  [        Sign In        ]             │
│                                         │
└─────────────────────────────────────────┘
```

**Flow:**
1. User selects social login option
2. Redirect to social provider
3. User authenticates with social provider
4. Social provider redirects back with token
5. System checks if account exists
6. If exists, create session and redirect
7. If not exists, create account and redirect

---

## Login Flow 3: Two-Factor Authentication (2FA)

**Screen 1: 2FA Setup (First Time)**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Set Up Two-Factor Authentication      │
│                                         │
│  Choose your 2FA method:               │
│                                         │
│  ( ) Authenticator App                  │
│  ( ) SMS                                │
│  ( ) Email                              │
│                                         │
│  [        Continue        ]             │
│                                         │
└─────────────────────────────────────────┘
```

**Screen 2: Authenticator App Setup**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Set Up Authenticator App               │
│                                         │
│  1. Download an authenticator app       │
│     (Google Authenticator, Authy)       │
│                                         │
│  2. Scan this QR code:                 │
│                                         │
│     [   QR CODE IMAGE   ]              │
│                                         │
│  3. Enter the 6-digit code:             │
│                                         │
│     [______]                            │
│                                         │
│  [        Verify        ]              │
│                                         │
└─────────────────────────────────────────┘
```

**Screen 3: 2FA Verification (On Login)**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Two-Factor Authentication              │
│                                         │
│  Enter the 6-digit code from your       │
│  authenticator app:                     │
│                                         │
│  [______]                               │
│                                         │
│  [        Verify        ]              │
│                                         │
│  Lost access to your authenticator?     │
│  Use backup code                        │
│                                         │
└─────────────────────────────────────────┘
```

**Flow:**
1. User enters email/password
2. System validates credentials
3. If 2FA enabled, show 2FA screen
4. User enters 2FA code
5. System validates code
6. If valid, create session and redirect
7. If invalid, show error and retry

---

## Login Flow 4: Password Recovery

**Screen 1: Forgot Password**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Reset Your Password                    │
│                                         │
│  Enter your email address and we'll     │
│  send you a link to reset your password │
│                                         │
│  Email: [_________________]             │
│                                         │
│  [      Send Reset Link    ]            │
│                                         │
│  Back to login                          │
│                                         │
└─────────────────────────────────────────┘
```

**Screen 2: Email Sent**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Check Your Email                       │
│                                         │
│  We've sent a password reset link to    │
│  your email address.                    │
│                                         │
│  The link will expire in 1 hour.        │
│                                         │
│  Didn't receive the email?              │
│  Resend email                           │
│                                         │
│  Back to login                          │
│                                         │
└─────────────────────────────────────────┘
```

**Screen 3: Reset Password**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Create New Password                    │
│                                         │
│  New Password: [_________________]      │
│  Confirm Password: [_________________]  │
│                                         │
│  Password requirements:                 │
│  • At least 12 characters               │
│  • Uppercase and lowercase letters      │
│  • At least one number                   │
│  • At least one special character       │
│                                         │
│  [      Reset Password    ]             │
│                                         │
└─────────────────────────────────────────┘
```

**Flow:**
1. User clicks "Forgot password"
2. Enters email address
3. System sends reset email
4. User clicks reset link in email
5. User enters new password
6. System updates password
7. User can login with new password

---

## Login Flow 5: Sign Up

**Screen 1: Sign Up**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Create Your Account                   │
│                                         │
│  Email: [_________________]             │
│  Password: [_________________]          │
│  Confirm Password: [_________________]  │
│                                         │
│  [ ] I agree to the Terms of Service    │
│  [ ] I agree to the Privacy Policy      │
│                                         │
│  [       Create Account    ]             │
│                                         │
│  Already have an account? Sign in       │
│                                         │
└─────────────────────────────────────────┘
```

**Screen 2: Email Verification**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Verify Your Email                      │
│                                         │
│  We've sent a verification link to      │
│  your email address.                    │
│                                         │
│  Please click the link to verify your    │
│  account.                               │
│                                         │
│  The link will expire in 24 hours.      │
│                                         │
│  Didn't receive the email?              │
│  Resend email                           │
│                                         │
└─────────────────────────────────────────┘
```

**Screen 3: Profile Setup**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace                        │
├─────────────────────────────────────────┤
│                                         │
│  Complete Your Profile                  │
│                                         │
│  First Name: [_________________]        │
│  Last Name: [_________________]         │
│  Phone: [_________________]             │
│  Country: [_______________]             │
│                                         │
│  [       Continue        ]              │
│                                         │
└─────────────────────────────────────────┘
```

**Flow:**
1. User enters email and password
2. System creates account
3. System sends verification email
4. User clicks verification link
5. User completes profile
6. Redirect to dashboard

---

## Login Flow 6: Admin Login

**Screen 1: Admin Login**

```
┌─────────────────────────────────────────┐
│  [Logo] SimTrace Admin                  │
├─────────────────────────────────────────┤
│                                         │
│  Admin Login                            │
│                                         │
│  Admin Email: [_______________]         │
│  Password: [_________________]          │
│                                         │
│  [ ] Remember me                        │
│                                         │
│  [        Sign In        ]             │
│                                         │
└─────────────────────────────────────────┘
```

**Flow:**
1. Admin enters credentials
2. System validates credentials
3. Checks if user has admin role
4. If valid, redirect to admin dashboard
5. If invalid, show error message

---

## Security Features

### Session Management

- **Session Timeout:** 30 minutes of inactivity
- **Remember Me:** 7 days (with secure token)
- **Concurrent Sessions:** Maximum 3 sessions per user
- **Session Revocation:** Can revoke all sessions

### Password Requirements

- **Minimum Length:** 12 characters
- **Complexity:** Uppercase, lowercase, number, special character
- **History:** Cannot reuse last 10 passwords
- **Expiration:** 90 days (optional for enterprise)

### Rate Limiting

- **Login Attempts:** 5 attempts per 15 minutes
- **Password Reset:** 3 requests per hour
- **2FA Attempts:** 3 attempts per 15 minutes

### Account Lockout

- **Lockout Threshold:** 5 failed attempts
- **Lockout Duration:** 30 minutes
- **Unlock:** Manual by admin or wait for duration

### Audit Logging

- **Login Events:** All login attempts logged
- **Password Changes:** All password changes logged
- **2FA Events:** All 2FA events logged
- **Session Events:** All session events logged

---

## Error Handling

### Common Errors

| Error | Message | Action |
|-------|---------|--------|
| Invalid email | "Please enter a valid email address" | Show inline error |
| Invalid password | "Incorrect password" | Show inline error |
| Account not found | "No account found with this email" | Show inline error, offer sign up |
| Account locked | "Account locked. Please contact support" | Show inline error, provide support link |
| 2FA required | "Two-factor authentication required" | Redirect to 2FA screen |
| Session expired | "Your session has expired. Please sign in again" | Redirect to login |
| Password mismatch | "Passwords do not match" | Show inline error |
| Weak password | "Password does not meet requirements" | Show requirements |
| Email already exists | "An account with this email already exists" | Show inline error, offer login |

---

## Accessibility

### Keyboard Navigation

- Tab through all form fields
- Enter to submit forms
- Escape to cancel
- Focus indicators visible

### Screen Reader Support

- ARIA labels on all form fields
- Error announcements
- Success announcements
- Progress announcements

### High Contrast Mode

- Support for high contrast themes
- Color blind friendly design
- Focus indicators

---

## Mobile Considerations

### Mobile Login

- Touch-friendly form fields
- Large tap targets (min 44x44px)
- Auto-fill support
- Biometric authentication (Face ID, Touch ID)

### Mobile 2FA

- Push notifications for 2FA
- Biometric approval
- SMS fallback
- Authenticator app support

---

## Internationalization

### Language Selection

- Language selector on login page
- Auto-detect browser language
- Remember language preference

### Localization

- Localized error messages
- Localized date/time formats
- Localized number formats
- RTL support for Arabic, Hebrew
