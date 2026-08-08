export interface RealtimeEvent<T = any> {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  payload: T;
  severity: "info" | "warning" | "error" | "critical";
}

type EventListener = (event: RealtimeEvent) => void;

class SocketClient {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private isConnected: boolean = false;
  private reconnectInterval: any = null;

  constructor() {
    this.init();
  }

  private init() {
    this.isConnected = true;
    // Simulate real-time connection heartbeat
    this.reconnectInterval = setInterval(() => {
      this.notify("connection_status", {
        eventId: `conn_${Date.now()}`,
        eventType: "SYSTEM_HEALTH_CHECK",
        timestamp: new Date().toISOString(),
        source: "socket-client",
        payload: { connected: this.isConnected },
        severity: "info",
      });
    }, 15000);
  }

  public subscribe(eventType: string, callback: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  public notify(eventType: string, event: RealtimeEvent) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event));
    }
    // Also notify wildcard subscribers
    const wildcardCallbacks = this.listeners.get("*");
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach((cb) => cb(event));
    }
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const socketClient = new SocketClient();
