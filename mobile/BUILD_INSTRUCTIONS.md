# Mobile App Build Instructions

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Expo CLI** - Install globally: `npm install -g expo-cli`
3. **EAS CLI** - Install globally: `npm install -g eas-cli`
4. **Expo Account** - Create account at https://expo.dev
5. **Android Studio** (for local Android builds) OR use EAS Build

## Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Login to Expo:
```bash
npx expo login
```

## Build Options

### Option 1: EAS Build (Recommended for Production)

EAS Build is the easiest way to build production APKs/IPAs.

1. Configure EAS:
```bash
npx eas build:configure
```

2. Build Android APK:
```bash
npx eas build --platform android --profile production
```

3. Build iOS IPA (requires Apple Developer account):
```bash
npx eas build --platform ios --profile production
```

The built files will be available in your Expo dashboard at https://expo.dev

### Option 2: Local Android Build

1. Install Android Studio and set up Android SDK
2. Set up environment variables:
   - `ANDROID_HOME` - Path to Android SDK
   - `ANDROID_SDK_ROOT` - Path to Android SDK

3. Build APK:
```bash
npx expo run:android
```

This will install the app on a connected Android device/emulator.

To generate a standalone APK:
```bash
npx expo build:android
```

### Option 3: Development Build

For testing without full build:
```bash
npx expo start
```

Then scan the QR code with Expo Go app on your phone.

## Configuration Files

### app.json
Contains app configuration including:
- App name and slug
- Version
- Icons and splash screens
- Permissions
- Plugins

### eas.json (create if not exists)
```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Troubleshooting

### PowerShell Execution Policy Error
If you get "running scripts is disabled" error in PowerShell:

**Option 1:** Run in Command Prompt (cmd) instead of PowerShell

**Option 2:** Temporarily allow scripts:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Option 3:** Use node directly:
```bash
node node_modules/expo/bin/cli.js start
```

### Missing Dependencies
```bash
npm install
```

### Android SDK Issues
Ensure Android Studio is installed and environment variables are set:
```bash
echo $ANDROID_HOME
echo $ANDROID_SDK_ROOT
```

### Build Fails
Check Expo build logs at https://expo.dev for detailed error messages.

## Post-Build

1. Download APK from Expo dashboard (if using EAS Build)
2. Test APK on Android device
3. Upload APK to public directory for download page:
   - Place APK at: `public/simtrace-android.apk`
   - Update download page link if needed

## Continuous Integration

For automated builds, set up GitHub Actions with EAS Build:

```yaml
name: Build Mobile App
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd mobile && npm install
      - run: cd mobile && npx eas build --platform android --non-interactive
```

## Notes

- The mobile app uses Expo SDK 50
- Background services require proper permissions in app.json
- For production, use EAS Build for best results
- iOS builds require Apple Developer account ($99/year)
- Android builds are free with EAS Build
