import * as Notifications from 'expo-notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-push-token' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notif-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

import notificationService from '../services/notificationService';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NotificationService', () => {
  it('should initialize and set notification handler', async () => {
    await notificationService.initialize();
    expect(Notifications.setNotificationHandler).toHaveBeenCalled();
  });

  it('should request permissions on initialize', async () => {
    await notificationService.initialize();
    expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
  });

  it('should send a local notification', async () => {
    await notificationService.sendLocalNotification('Test Title', 'Test Body', { key: 'val' });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Test Title',
          body: 'Test Body',
          data: { key: 'val' },
          sound: true,
        }),
        trigger: null,
      })
    );
  });

  it('should schedule a notification for a future date', async () => {
    const futureDate = new Date(Date.now() + 60000);
    const id = await notificationService.scheduleNotification(
      'Scheduled',
      'Scheduled body',
      futureDate,
      { screen: 'alerts' }
    );
    expect(id).toBe('notif-id');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Scheduled',
          body: 'Scheduled body',
        }),
        trigger: { date: futureDate },
      })
    );
  });

  it('should cancel a notification', async () => {
    await notificationService.cancelNotification('notif-id');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-id');
  });

  it('should cancel all notifications', async () => {
    await notificationService.cancelAllNotifications();
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });

  it('should add notification listener', () => {
    const listener = jest.fn();
    notificationService.addNotificationListener(listener);
    expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(listener);
  });

  it('should add notification response listener', () => {
    const listener = jest.fn();
    notificationService.addNotificationResponseListener(listener);
    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(listener);
  });
});
