"""
Custom React hook for WebSocket connections to real-time seat updates.
"""

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SeatData {
  tour_id: string;
  max_people: number;
  bookings_count: number;
  available_seats: number;
  is_housefull: boolean;
}

export interface UseWebSocketOptions {
  onError?: (error: string) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export function useWebSocket(
  tourId: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    onError,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
  } = options;

  const [connected, setConnected] = useState(false);
  const [seatData, setSeatData] = useState<SeatData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!tourId) return;

    // Get the protocol (ws or wss) based on current page protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/seats/${tourId}/`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'initial' || message.type === 'seat_update') {
            setSeatData(message.data);
          } else if (message.type === 'booking_confirmed') {
            // Handle booking confirmation if needed
            setSeatData(message.data);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        const errorMsg = 'WebSocket connection error';
        setError(errorMsg);
        setConnected(false);
        if (onError) {
          onError(errorMsg);
        }
        console.error(errorMsg, event);
      };

      ws.onclose = () => {
        setConnected(false);

        // Attempt to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          const errorMsg = 'WebSocket disconnected after multiple reconnection attempts';
          setError(errorMsg);
          if (onError) {
            onError(errorMsg);
          }
        }
      };

      wsRef.current = ws;
    } catch (err) {
      const errorMsg = `Failed to connect WebSocket: ${err}`;
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      console.error(errorMsg);
    }
  }, [tourId, reconnectAttempts, reconnectDelay, onError]);

  // Connect on mount or when tourId changes
  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [tourId, connect]);

  // Function to manually send data (for future extensibility)
  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // Function to manually disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return {
    connected,
    seatData,
    error,
    send,
    disconnect,
  };
}
