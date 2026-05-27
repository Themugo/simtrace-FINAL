# SIMTrace Mobile App

Official mobile application for SIMTrace device tracking and security system.

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit + RTK Query
- **Navigation**: React Navigation
- **UI Components**: React Native Paper / NativeBase
- **Real-time**: Socket.io Client
- **Maps**: React Native Maps
- **Push Notifications**: Expo Notifications
- **Biometrics**: Expo Local Authentication
- **Secure Storage**: Expo SecureStore
- **Location**: Expo Location
- **Camera**: Expo Camera (for QR code scanning)
- **Forms**: React Hook Form + Zod

## Project Structure

```
mobile/
├── src/
│   ├── api/              # API integration layer
│   │   ├── client.ts     # Axios client configuration
│   │   ├── auth.ts       # Authentication API
│   │   ├── devices.ts    # Device management API
│   │   ├── alerts.ts     # Alert API
│   │   └── socket.ts     # Socket.io client
│   ├── components/       # Reusable components
│   │   ├── common/       # Common UI components
│   │   ├── device/       # Device-related components
│   │   └── auth/         # Authentication components
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── dashboard/    # Dashboard screens
│   │   ├── devices/      # Device management screens
│   │   ├── alerts/       # Alert screens
│   │   └── profile/      # Profile screens
│   ├── navigation/       # Navigation configuration
│   ├── store/            # Redux store
│   │   ├── slices/       # Redux slices
│   │   └── hooks.ts      # Custom hooks
│   ├── utils/            # Utility functions
│   │   ├── validation.ts # Validation schemas
│   │   ├── encryption.ts # Encryption utilities
│   │   └── helpers.ts    # Helper functions
│   ├── types/            # TypeScript types
│   ├── constants/        # App constants
│   └── theme/            # Theme configuration
├── assets/               # Images, fonts, etc.
├── App.tsx               # App entry point
├── package.json
└── app.json              # Expo configuration
```

## Features

### User Layer (First Layer)
- **Authentication**: Login with official email/OTP, biometric authentication
- **Device Dashboard**: Real-time device tracking with map view
- **Device Management**: Add, remove, edit devices
- **Theft Reporting**: Quick theft reporting flow
- **Alerts**: Real-time alert notifications
- **Panic Mode**: One-tap panic activation
- **Guardian System**: Parent-child tracking
- **Recovery Status**: Track recovery progress
- **Subscription**: Manage subscription and billing
- **Profile**: User profile management

### Security Features
- Official email/OTP authentication
- Biometric authentication (fingerprint/face)
- Secure storage for sensitive data
- End-to-end encryption for sensitive communications
- Session management
- Auto-logout on suspicious activity

### Offline Support
- Offline mode with cached data
- Automatic sync when online
- Queue actions for later execution

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

## Build

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## Security Notes

- All API calls use HTTPS
- Sensitive data stored in SecureStore
- Authentication tokens stored securely
- Biometric authentication for sensitive actions
- No personal data used for authentication (official email/OTP only)
