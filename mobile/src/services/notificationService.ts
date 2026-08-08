// services/notificationService.ts - Push notification configuration and handling
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  async initialize(): Promise<void> {
    // Request permissions
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }

    // Get push token
    const token = await this.getPushToken();
    console.log('Push token:', token);
    
    // Send token to backend
    await this.registerTokenWithBackend(token);
  }

  async getPushToken(): Promise<string> {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with actual Expo project ID
    });
    return tokenData.data;
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    // Import API client dynamically
    const apiClient = (await import('@api/client')).default;
    
    try {
      await apiClient.post('/notifications/register', {
        pushToken: token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  async scheduleNotification(
    title: string,
    body: string,
    date: Date,
    data?: any
  ): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: {
        date,
      },
    });
    
    return identifier;
  }

  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  addNotificationListener(listener: (notification: Notifications.NotificationEvent) => void): void {
    Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): void {
    Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export default new NotificationService();
