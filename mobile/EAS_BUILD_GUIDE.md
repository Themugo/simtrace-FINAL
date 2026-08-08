# EAS Build Guide - Step by Step

This guide will walk you through building the SimTrace Android APK using EAS Build.

## Prerequisites Checklist

- [ ] Node.js v18 or higher installed
- [ ] Git installed
- [ ] Expo account (free) - Create at https://expo.dev
- [ ] EAS CLI installed globally

## Step 1: Install EAS CLI

Open Command Prompt (cmd) or PowerShell and run:

```bash
npm install -g eas-cli
```

Verify installation:
```bash
eas --version
```

## Step 2: Login to Expo

Navigate to the mobile directory:
```bash
cd mobile
```

Login to your Expo account:
```bash
eas login
```

This will:
1. Open your browser
2. Ask you to log in to Expo
3. Authorize EAS CLI
4. Return to terminal when complete

## Step 3: Configure EAS Build

Initialize EAS configuration:
```bash
eas build:configure
```

This will:
1. Check your project configuration
2. Verify app.json settings
3. Create/update eas.json if needed
4. Show you the configuration

**Note:** We already have an `eas.json` file configured, so this step should just verify it.

## Step 4: Build Android APK

Run the build command:
```bash
eas build --platform android --profile production
```

This will:
1. Upload your project to Expo servers
2. Build the APK on Expo's infrastructure
3. Take approximately 15-30 minutes
4. Provide a build URL to track progress

**What to expect:**
- You'll see progress updates in the terminal
- A URL will be provided to view the build in Expo dashboard
- You can check the build status at https://expo.dev

## Step 5: Monitor Build

While the build is running:
1. Open the provided URL in your browser
2. Monitor the build logs
3. Wait for "Build succeeded" status

**Build time:** 15-30 minutes typically

## Step 6: Download APK

Once the build is complete:

1. Go to https://expo.dev
2. Navigate to your project
3. Click on "Builds"
4. Find the Android build
5. Click "Download" to get the APK file

## Step 7: Test APK

1. Enable "Install from unknown sources" on your Android device
2. Transfer the APK to your device
3. Install the APK
4. Test the app:
   - Open the app
   - Go through onboarding
   - Login with test credentials (see USER_CREDENTIALS.md)
   - Test device tracking
   - Test panic mode

## Step 8: Upload to Public Directory

Once tested and working:

1. Rename the APK to `simtrace-android.apk`
2. Copy it to the `public` directory in the project root:
   ```
   cp downloaded-apk.apk ../public/simtrace-android.apk
   ```
3. Commit and push:
   ```bash
   git add public/simtrace-android.apk
   git commit -m "Add production Android APK"
   git push origin main
   ```

## Troubleshooting

### "eas: command not found"
Install EAS CLI globally:
```bash
npm install -g eas-cli
```

### "Not logged in"
Login again:
```bash
eas login
```

### Build fails
Check the build logs at https://expo.dev for specific error messages. Common issues:
- Missing dependencies - run `npm install`
- Configuration errors - check app.json and eas.json
- Account issues - verify Expo account is active

### PowerShell execution policy error
Use Command Prompt (cmd) instead of PowerShell, or run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Alternative: Use the Batch Script

We've provided a Windows batch script to simplify the process:

```bash
cd mobile
build-android.bat
```

This script will:
1. Install dependencies
2. Run EAS build for Android
3. Provide instructions for downloading

## Cost Information

- EAS Build for Android: **FREE**
- EAS Build for iOS: Requires Apple Developer account ($99/year)
- Builds are unlimited for free tier

## Next Steps After Build

1. Test the APK thoroughly
2. Upload to public directory
3. Update download page if needed
4. Deploy to production
5. Monitor app performance

## Support

If you encounter issues:
- Check EAS Build documentation: https://docs.expo.dev/build/introduction/
- Check Expo forums: https://forums.expo.dev/
- Review build logs at https://expo.dev

## Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build Android APK
eas build --platform android --profile production

# Build iOS (requires Apple account)
eas build --platform ios --profile production

# View builds
eas build:list

# Cancel a build
eas build cancel [build-id]
```

---

**Estimated Total Time:** 30-45 minutes (including build time)
**Difficulty:** Easy
**Cost:** Free
