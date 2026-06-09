import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import offlineService from '../services/offlineService';

jest.mock('../api/devices', () => ({
  deviceService: {
    addDevice: jest.fn(() => Promise.resolve({ id: 'mock-device' })),
    updateDevice: jest.fn(() => Promise.resolve({ id: 'mock-device' })),
    reportTheft: jest.fn(() => Promise.resolve()),
    markRecovered: jest.fn(() => Promise.resolve({ id: 'mock-device' })),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true });
});

describe('OfflineService', () => {
  it('should initialize with empty queue when no stored queue', async () => {
    await offlineService.initialize();
    expect(offlineService.getQueueLength()).toBe(0);
  });

  it('should load stored queue on initialize', async () => {
    const storedQueue = JSON.stringify([
      { id: '1', type: 'add_device', payload: {}, timestamp: 100, synced: false },
    ]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedQueue);
    await offlineService.initialize();
    expect(offlineService.getQueueLength()).toBe(1);
  });

  it('should add action to queue via queueAction', async () => {
    await offlineService.queueAction('add_device', { name: 'test' });
    expect(offlineService.getQueueLength()).toBe(1);
  });

  it('should save queue to AsyncStorage when adding action', async () => {
    await offlineService.queueAction('add_device', { name: 'test' });
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const key = (AsyncStorage.setItem as jest.Mock).mock.calls[0][0];
    const value = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
    expect(value).toHaveLength(1);
    expect(value[0].type).toBe('add_device');
    expect(value[0].synced).toBe(false);
  });

  it('should report online network status', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true });
    await offlineService.initialize();
    expect(offlineService.getNetworkStatus()).toBe(true);
  });

  it('should report offline network status', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false, isInternetReachable: false });
    await offlineService.initialize();
    expect(offlineService.getNetworkStatus()).toBe(false);
  });

  it('should cache and retrieve devices', async () => {
    const devices = [{ id: '1', name: 'Device 1' }];
    await offlineService.cacheDevices(devices);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@simtrace_offline_devices',
      JSON.stringify(devices)
    );
  });

  it('should get cached devices', async () => {
    const devices = [{ id: '1', name: 'Device 1' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(devices));
    const result = await offlineService.getCachedDevices();
    expect(result).toEqual(devices);
  });

  it('should return empty array when no cached devices', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await offlineService.getCachedDevices();
    expect(result).toEqual([]);
  });

  it('should clear cache', async () => {
    await offlineService.clearCache();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@simtrace_offline_devices');
  });
});
