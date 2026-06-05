# Authentication Audit Report

## Overview

This document outlines the authentication system audit for SIMTrace, identifying all login methods, account types, and ensuring no overlap issues or conflicts across layers.

## Authentication Layers

### 1. Backend Authentication

**Main Routes (`backend/routes/auth.ts`)**
- POST /api/auth/register - User registration
- POST /api/auth/login - Email/password login
- GET /api/auth/me - Get current user
- PATCH /api/auth/update-profile - Update user profile
- POST /api/auth/change-password - Change password
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password with token
- POST /api/auth/refresh - Refresh JWT token
- POST /api/auth/logout-all - Revoke all sessions

**OAuth Routes (`backend/routes/oauth.ts`)**
- GET /api/auth/oauth/google - Initiate Google OAuth
- GET /api/auth/oauth/google/callback - Google OAuth callback
- GET /api/auth/oauth/providers - Check available OAuth providers

**Authentication Middleware (`backend/middleware/auth.ts`)**
- `authenticate` - JWT and API key authentication
- `requireAdmin` - Admin role check
- `requireRole(...roles)` - Custom role check
- `requireSelfOrAdmin` - Self or admin access
- `requireRecordOwner` - Record ownership check
- `requireDeviceOwner` - Device ownership check
- `requireOrgAdmin` - Organization admin check
- `authenticateSocket` - Socket.io authentication
- `signToken` - JWT token generation

### 2. Frontend Authentication

**Auth Context (`lib/auth.tsx`)**
- `login(email, password)` - Email/password login
- `register(name, email, password, phone)` - User registration
- `logout()` - Logout
- Token refresh (every 6 hours)
- Token storage in localStorage

**Login Page (`app/login/page.tsx`)**
- Email and password authentication
- Redirects based on role (admin → dashboard, user → devices)

### 3. Mobile App Authentication

**Login Screen (`mobile/src/screens/auth/LoginScreen.tsx`)**
- Official email and OTP authentication
- Biometric authentication (fingerprint/face)
- Credential storage in SecureStore
- Redux state management

**Auth Slice (`mobile/src/store/slices/authSlice.ts`)**
- Login, verifyEmail, verifyOtp actions
- Biometric enable/disable
- Token storage in SecureStore
- Session management

## User Roles and Permissions

### Role Hierarchy
1. **super_admin** - Full system access
2. **admin** - Administrative access
3. **moderator** - Content moderation
4. **user** - Standard user access

### Permission Matrix

| Action | User | Moderator | Admin | Super Admin |
|--------|------|-----------|-------|-------------|
| View own devices | ✅ | ✅ | ✅ | ✅ |
| View all devices | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ |
| Delete devices | ✅ (own) | ✅ (own) | ✅ (all) | ✅ (all) |
| Report stolen | ✅ | ✅ | ✅ | ✅ |
| View analytics | ❌ | ❌ | ✅ | ✅ |

## Login Methods

### 1. Email/Password (Frontend & Backend)
- **Frontend:** `lib/auth.tsx` → `app/login/page.tsx`
- **Backend:** `backend/routes/auth.ts` → POST /api/auth/login
- **Flow:** User enters email/password → Frontend calls API → Backend validates with bcrypt → Returns JWT token

### 2. Email/OTP (Mobile)
- **Mobile:** `mobile/src/screens/auth/LoginScreen.tsx`
- **Backend:** Uses same auth routes
- **Flow:** User enters official email and 8-digit OTP → Mobile app calls API → Backend validates → Returns JWT token

### 3. Biometric (Mobile)
- **Mobile:** `mobile/src/screens/auth/LoginScreen.tsx`
- **Flow:** User enables biometric → Credentials stored in SecureStore → Biometric auth retrieves credentials → Auto-login

### 4. OAuth (Google)
- **Frontend:** Can be integrated
- **Backend:** `backend/routes/oauth.ts`
- **Flow:** User clicks "Continue with Google" → Redirects to Google → Callback with profile → Find/create user → Return JWT token

## Identified Issues and Fixes

### Issue 1: Dead Code - v1 and v2 Routes
**Problem:** 
- `backend/routes/v1/auth.ts` and `backend/routes/v2/auth.ts` reference non-existent controller `../../controllers/auth.js`
- These routes are not mounted in `server.ts`
- Creates confusion and potential maintenance issues

**Fix:**
- Removed `backend/routes/v1/` and `backend/routes/v2/` directories
- All authentication now uses main `backend/routes/auth.ts`
- Eliminates overlap and confusion

### Issue 2: Inconsistent Login Methods
**Problem:**
- Frontend uses email/password
- Mobile uses email/OTP
- No clear documentation on which method to use

**Status:**
- Both methods are valid for different platforms
- Frontend (web) uses email/password for convenience
- Mobile uses email/OTP for security (official email requirement)
- Documented in this audit

### Issue 3: Token Refresh Inconsistency
**Problem:**
- Frontend refreshes every 6 hours
- Mobile does not have auto-refresh
- Backend token expires in 7 days

**Status:**
- Frontend auto-refresh is appropriate
- Mobile should implement similar refresh mechanism
- Backend 7-day expiry is reasonable

## Authentication Flow Consistency

### Web Flow
1. User enters email/password
2. Frontend calls POST /api/auth/login
3. Backend validates credentials
4. Backend returns JWT token (7-day expiry)
5. Frontend stores token in localStorage
6. Frontend auto-refreshes every 6 hours
7. Token sent in Authorization header for all requests

### Mobile Flow
1. User enters official email/OTP
2. Mobile app calls POST /api/auth/login
3. Backend validates credentials
4. Backend returns JWT token (7-day expiry)
5. Mobile app stores token in SecureStore
6. Biometric auth retrieves stored credentials
7. Token sent in Authorization header for all requests

## Security Measures

### Backend
- Password hashing with bcrypt (cost factor 12)
- JWT token with 7-day expiry
- Token version for session revocation
- API key authentication for partners
- Rate limiting on auth endpoints (20 req/15min)
- CSRF protection for OAuth

### Frontend
- Token storage in localStorage
- Auto-refresh before expiry
- HTTPS only in production
- CORS configuration

### Mobile
- Token storage in SecureStore (encrypted)
- Biometric authentication
- Credential encryption
- No token storage in plain text

## Recommendations

### Immediate
1. ✅ Remove dead v1/v2 routes (completed)
2. Implement token refresh in mobile app
3. Add consistent error messages across platforms

### Future
1. Add 2FA support for web users
2. Implement session management UI
3. Add audit logging for all auth events
4. Consider OAuth for mobile app
5. Add password strength requirements

## Conclusion

The authentication system is well-structured with clear separation of concerns:
- **Backend:** Single source of truth for authentication logic
- **Frontend:** Email/password login with auto-refresh
- **Mobile:** Email/OTP with biometric support

No critical overlap issues found. The removal of v1/v2 routes eliminates confusion and ensures a single authentication path through the main auth routes.

## Version History

- **v1.0** - June 5, 2026 - Initial authentication audit
