# SIMTrace Web Application

Official web application for SIMTrace device tracking and security system.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit + RTK Query
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **Real-time**: Socket.io Client
- **Maps**: Leaflet / Google Maps
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Authentication**: Official email/OTP + Biometric (WebAuthn)

## Project Structure

```
frontend/
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
│   │   ├── auth/         # Authentication components
│   │   └── dashboard/    # Dashboard components
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── devices/      # Device management pages
│   │   └── profile/      # Profile pages
│   ├── layouts/          # Layout components
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
├── public/               # Static assets
├── index.html            # HTML entry point
├── package.json
└── vite.config.ts        # Vite configuration
```

## Features

### End User Layer (Web Service)
- **Authentication**: Login with official email/OTP, WebAuthn biometric authentication
- **Device Dashboard**: Real-time device tracking with interactive map
- **Device Management**: Add, remove, edit devices from any device
- **Theft Reporting**: Quick theft reporting flow with location
- **Alerts**: Real-time alert notifications
- **Panic Mode**: One-click panic activation
- **Device History**: View device location history
- **Recovery Status**: Track recovery progress
- **Subscription**: Manage subscription and billing
- **Profile**: User profile management

### Key Features for Lost Phone Scenario
- **Device-Agnostic Access**: Access service from any device (desktop, laptop, tablet, another phone)
- **Official Email/OTP Only**: No personal data required for authentication
- **Immediate Access**: No need to recover lost phone to access service
- **Full Functionality**: Complete device management capabilities on web
- **Real-Time Updates**: Live device location tracking
- **Emergency Actions**: Panic mode and theft reporting from any device

### Security Features
- Official email/OTP authentication (no personal data)
- WebAuthn biometric authentication (fingerprint/face on supported devices)
- End-to-end encryption for sensitive communications
- Secure session management
- Auto-logout on suspicious activity
- IP-based access controls
- Time-based access controls

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Security Notes

- All API calls use HTTPS
- Sensitive data encrypted in transit and at rest
- Authentication tokens stored securely (httpOnly cookies)
- Biometric authentication via WebAuthn
- No personal data used for authentication (official email/OTP only)
- Device-agnostic access for emergency situations
