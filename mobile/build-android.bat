@echo off
echo Building SimTrace Android APK...
echo.

cd mobile

echo Installing dependencies...
call npm install

echo.
echo Starting EAS Build for Android...
echo This will open your browser to Expo.dev
echo.

call npx eas build --platform android --profile production

echo.
echo Build complete! Check your Expo dashboard for the APK.
echo https://expo.dev
echo.
pause
