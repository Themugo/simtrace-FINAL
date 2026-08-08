// App.tsx - Main app entry point
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { store } from './src/store';
import LoginScreen from './src/screens/auth/LoginScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
// Legal screens
import TermsScreen from './src/screens/legal/TermsScreen';
import PrivacyPolicyScreen from './src/screens/legal/PrivacyPolicyScreen';
// Onboarding screens
import OnboardingWelcomeScreen from './src/screens/onboarding/OnboardingWelcomeScreen';
import PermissionRequestScreen from './src/screens/onboarding/PermissionRequestScreen';
import PhoneVerificationScreen from './src/screens/onboarding/PhoneVerificationScreen';
import DeviceScanningScreen from './src/screens/onboarding/DeviceScanningScreen';
import DeviceReviewScreen from './src/screens/onboarding/DeviceReviewScreen';
import AccountCreationScreen from './src/screens/onboarding/AccountCreationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Terms"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen 
            name="Terms" 
            component={TermsScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
          <Stack.Screen name="PermissionRequest" component={PermissionRequestScreen} />
          <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
          <Stack.Screen name="DeviceScanning" component={DeviceScanningScreen} />
          <Stack.Screen name="DeviceReview" component={DeviceReviewScreen} />
          <Stack.Screen name="AccountCreation" component={AccountCreationScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
