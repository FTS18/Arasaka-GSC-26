import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const { user } = useAuth();
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) return;

    // Ask for Notification Permissions early
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${host}/api/ws/live`;
    
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => console.log("WebSocket Telemetry Active");

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update') {
          // Trigger a global JS event that React components can intercept
          window.dispatchEvent(new CustomEvent('janrakshak-live-update', { detail: data }));
          
          // Native Push Notification Logic
          if (data.source === 'matching' && data.target_volunteer_id === user.id) {
             if (Notification.permission === 'granted') {
                 new Notification('NEW ASSIGNMENT', {
                     body: 'You have been assigned an urgent task. Please check your dashboard.',
                     vibrate: [300, 100, 300, 100, 300]
                 });
             }
             toast.error("NEW ASSIGNMENT: URGENT TASK RECEIVED", { style: { backgroundColor: 'var(--signal-red)', color: 'white' }});
          }
        }
      } catch (err) {
        console.error("WS Parse error", err);
      }
    };

    socket.onclose = () => console.log("WebSocket Disconnected");
    setWs(socket);

    return () => socket.close();
  }, [user]);

  return (
    <WebSocketContext.Provider value={{ ws }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
