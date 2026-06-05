# SIMTrace Mobile App

Native iOS and Android applications for SIMTrace device tracking and security.

## Overview

The SIMTrace mobile app provides real-time device tracking, security alerts, and recovery features for users on the go. Built with React Native for cross-platform compatibility.

## Features

### Core Features
- **Real-time Device Tracking**: Live location updates with GPS, WiFi, and cell tower triangulation
- **Security Alerts**: Push notifications for theft alerts, location changes, and security events
- **Device Management**: Register and manage multiple devices
- **Theft Reporting**: Quick theft report submission with evidence upload
- **Recovery Network**: View recovery cases and track progress
- **Insurance Integration**: View insurance policies and file claims

### Advanced Features
- **Satellite Tracking**: Fallback to satellite location when GPS unavailable
- **AI Risk Prediction**: View device risk scores and security recommendations
- **Reward System**: Claim rewards for device recovery
- **Enterprise Support**: Corporate device fleet management
- **Offline Mode**: Sync data when connection restored
- **Biometric Authentication**: Secure login with fingerprint/face ID

## Tech Stack

- **Framework**: React Native 0.72+
- **Navigation**: React Navigation 6
- **State Management**: Redux Toolkit + RTK Query
- **Maps**: Google Maps SDK (iOS/Android)
- **Push Notifications**: Firebase Cloud Messaging
- **Biometrics**: React Native Biometrics
- **Location**: React Native Geolocation
- **Networking**: Axios
- **Storage**: AsyncStorage + SecureStorage
- **Charts**: Victory Native

## Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── DeviceCard.js
│   │   ├── MapView.js
│   │   ├── AlertCard.js
│   │   └── ...
│   ├── screens/             # Screen components
│   │   ├── Dashboard/
│   │   ├── Devices/
│   │   ├── Tracking/
│   │   ├── Alerts/
│   │   ├── Recovery/
│   │   ├── Insurance/
│   │   ├── Rewards/
│   │   ├── Settings/
│   │   └── ...
│   ├── navigation/          # Navigation configuration
│   │   ├── AppNavigator.js
│   │   ├── TabNavigator.js
│   │   └── AuthNavigator.js
│   ├── store/               # Redux store
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── devicesSlice.js
│   │   │   ├── alertsSlice.js
│   │   │   └── ...
│   │   └── index.js
│   ├── services/            # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── deviceService.js
│   │   ├── locationService.js
│   │   └── ...
│   ├── utils/               # Utility functions
│   │   ├── helpers.js
│   │   ├── constants.js
│   │   └── validators.js
│   ├── hooks/               # Custom hooks
│   │   ├── useLocation.js
│   │   ├── useAuth.js
│   │   └── ...
│   └── assets/              # Images, fonts, etc.
├── android/                 # Android native code
├── ios/                     # iOS native code
├── __tests__/               # Test files
├── App.js                   # App entry point
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Firebase account (for push notifications)

### Installation

```bash
cd mobile-app
npm install
```

### iOS Setup

```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

### Android Setup

```bash
npx react-native run-android
```

## Configuration

### Environment Variables

Create `.env` file:

```
API_BASE_URL=https://api.simtrace.com
GOOGLE_MAPS_API_KEY=your_google_maps_key
FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```

### Firebase Setup

1. Create Firebase project
2. Add iOS and Android apps
3. Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)
4. Place files in respective project folders
5. Enable Cloud Messaging for push notifications

### Google Maps Setup

1. Create Google Cloud project
2. Enable Maps SDK for iOS and Android
3. Create API key with restrictions
4. Add API key to environment variables

## API Integration

The mobile app communicates with the SIMTrace backend API:

- Authentication: JWT tokens stored in SecureStorage
- Real-time: Socket.io for live updates
- Location: Background location tracking with permissions
- Push: Firebase Cloud Messaging for alerts

## Security

- Biometric authentication for sensitive features
- Secure storage for tokens and sensitive data
- Certificate pinning for API calls
- Encrypted local storage
- App integrity checks

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run linting
npm run lint
```

## Building for Production

### iOS

```bash
cd ios
xcodebuild -workspace SimTrace.xcworkspace -scheme SimTrace -configuration Release archive -archivePath build/SimTrace.xcarchive
```

### Android

```bash
cd android
./gradlew assembleRelease
```

## Deployment

### iOS App Store

1. TestFlight beta testing
2. App Store submission
3. Review and approval

### Google Play Store

1. Internal testing track
2. Closed testing track
3. Open testing track
4. Production release

## Roadmap

### Phase 1 (Current)
- Core tracking and alerts
- Device management
- Basic recovery features

### Phase 2 (Next)
- Satellite tracking integration
- AI risk prediction display
- Reward claiming
- Insurance integration

### Phase 3 (Future)
- Offline mode with sync
- Enterprise fleet management
- Partner marketplace
- Advanced analytics

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

Proprietary - SIMTrace Inc.

## Support

For support, contact mobile@simtrace.com
