import { useState, useEffect } from "react";
import { socketClient, RealtimeEvent } from "../socketClient";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(socketClient.getStatus());

  useEffect(() => {
    const unsubscribe = socketClient.subscribe("connection_status", (event) => {
      setIsConnected(!!event.payload.connected);
    });
    return () => unsubscribe();
  }, []);

  return { isConnected, socket: socketClient };
}

export function useRealtimeEvents(filterEventType?: string) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const eventName = filterEventType || "*";
    const unsubscribe = socketClient.subscribe(eventName, (event) => {
      setEvents((prev) => [event, ...prev.slice(0, 49)]);
    });
    return () => unsubscribe();
  }, [filterEventType]);

  return { events };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<
    Array<{ id: string; title: string; message: string; type: string; read: boolean; timestamp: string }>
  >([
    {
      id: "notif_1",
      title: "Real-Time Tracking Online",
      message: "SimTrace Real-Time Intelligence Stream initialized successfully.",
      type: "SYSTEM_MESSAGE",
      read: false,
      timestamp: new Date().toISOString(),
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return { notifications, markAsRead, clearAll, unreadCount: notifications.filter((n) => !n.read).length };
}
