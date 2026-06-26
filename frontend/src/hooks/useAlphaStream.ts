import { useState, useEffect } from 'react';

/**
 * @file useAlphaStream.ts
 * @description High-frequency hook for consuming Smart Money signals via Redis-WebSocket Bridge.
 * Ensures the UI thread stays fluid by handling incoming signals as atomic state updates.
 */

export interface AlphaSignal {
  id: string;
  type: 'SMART_MONEY' | 'WHALE' | 'DEV_ACTION';
  action: 'BUY' | 'SELL' | 'MINT' | 'REMOVE_LP';
  address: string;
  amountUsd: number;
  timestamp: number;
}

export const useAlphaStream = (wsUrl: string = "ws://localhost:8080/ws/alpha") => {
  const [signals, setSignals] = useState<AlphaSignal[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log("🟢 [AlphaStream] Connected to Bridge");
      };

      ws.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          const signal: AlphaSignal = {
            id: rawData.id || Math.random().toString(36).substr(2, 9),
            type: rawData.type,
            action: rawData.action,
            address: rawData.addr,
            amountUsd: parseFloat(rawData.amount),
            timestamp: Date.now()
          };

          setSignals(prev => [signal, ...prev].slice(0, 50));
          
          // Optional: Trigger haptic or audio feedback for High-Priority signals
          if (signal.type === 'SMART_MONEY' && signal.amountUsd > 100000) {
            console.log("🚨 [ALPHA SIGNAL] High-priority whale movement detected.");
          }
        } catch (err) {
          console.error("❌ [AlphaStream] Parse error:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.warn("🟡 [AlphaStream] Connection lost. Reconnecting...");
        reconnectTimeout = setTimeout(connect, 3000); // Exponential backoff recommended for production
      };

      ws.onerror = (err) => {
        console.error("❌ [AlphaStream] WebSocket Error:", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [wsUrl]);

  return { signals, isConnected };
};
