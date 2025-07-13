import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { getAuthToken } from "@/lib/auth";
import { createValidWebSocketUrl } from "@/lib/websocket-utils";

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionAttempts: number;
  sendMessage: (type: string, data: any) => void;
  lastMessage: any;
  forceReconnect: () => void;
}

const WebSocketContext = createContext<SocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  // TEMPORARY: Disable WebSocket to prevent infinite error loop
  const [websocketDisabled] = useState(true);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldConnectRef = useRef(true);
  const messageQueueRef = useRef<any[]>([]);
  const isConnectingRef = useRef(false);

  const connect = () => {
    // TEMPORARY: WebSocket disabled to prevent error spam
    if (websocketDisabled) {
      console.log('🚫 WebSocket temporarily disabled');
      return;
    }
    
    // Prevent multiple simultaneous connections
    if (isConnectingRef.current || !shouldConnectRef.current) {
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      return;
    }

    // Prevent connecting if already connected
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Limit connection attempts to prevent infinite loop
    if (connectionAttempts >= 3) {
      console.log('🛑 Max WebSocket connection attempts reached. Stopping reconnection.');
      shouldConnectRef.current = false;
      return;
    }

    isConnectingRef.current = true;
    setIsConnecting(true);
    setConnectionAttempts(prev => prev + 1);

    try {
      const host = window.location.host;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Use environment variable for production API URL
      const apiUrl = import.meta.env.VITE_API_URL;
      const wsHost = apiUrl ? new URL(apiUrl).host : host;
      const wsUrl = `${protocol}//${wsHost}/ws?token=${encodeURIComponent(token)}`;
      
      console.log('🔗 WebSocket connecting to:', wsUrl);
      
      // Create WebSocket with error handling
      const newSocket = new WebSocket(wsUrl);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        isConnectingRef.current = false;
        setSocket(newSocket);
        setConnectionAttempts(0);
        
        // Send queued messages
        if (messageQueueRef.current.length > 0) {
          const queue = [...messageQueueRef.current];
          messageQueueRef.current = [];
          queue.forEach(msg => {
            try {
              newSocket.send(JSON.stringify(msg));
            } catch (error) {
              messageQueueRef.current.push(msg);
            }
          });
        }
      };

      newSocket.onmessage = (event) => {
        try {
          if (event?.data) {
            const data = JSON.parse(event.data);
            if (data?.type !== 'pong') {
              console.log('📥 Message received:', data);
              setLastMessage({ ...data, timestamp: Date.now() });
            }
          }
        } catch (error) {
          console.warn('Message parse error:', error, event?.data);
          // Only set parse error if we have actual data
          if (event?.data) {
            setLastMessage({ 
              type: 'parse_error', 
              rawData: event.data, 
              timestamp: Date.now() 
            });
          }
        }
      };

      newSocket.onerror = (error) => {
        // Reduce console spam - only log every 5th error
        if (connectionAttempts % 5 === 0) {
          console.log('❌ WebSocket connection error (attempt', connectionAttempts, ')');
        }
        setIsConnected(false);
        setIsConnecting(false);
        isConnectingRef.current = false;
      };

      newSocket.onclose = (event) => {
        console.log(`🔌 WebSocket closed (${event.code})`);
        setIsConnected(false);
        setIsConnecting(false);
        isConnectingRef.current = false;
        setSocket(null);
        
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Reconnect if should connect and not a normal closure, with max attempts
        if (shouldConnectRef.current && event.code !== 1000 && connectionAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldConnectRef.current && connectionAttempts < 5) {
              connect();
            }
          }, delay);
        } else if (connectionAttempts >= 5) {
          console.log('🛑 Max WebSocket reconnection attempts reached. Giving up.');
          shouldConnectRef.current = false;
        }
      };

    } catch (error) {
      // Reduce console spam
      if (connectionAttempts <= 3) {
        console.error('❌ WebSocket connection failed:', error);
      }
      setIsConnected(false);
      setIsConnecting(false);
      isConnectingRef.current = false;
      
      // Retry connection with limits
      if (shouldConnectRef.current && connectionAttempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldConnectRef.current && connectionAttempts < 5) {
            connect();
          }
        }, delay);
      } else if (connectionAttempts >= 5) {
        console.log('🛑 Max WebSocket connection attempts reached. Stopping.');
        shouldConnectRef.current = false;
      }
    }
  };

  const forceReconnect = () => {
    console.log('🔄 Force reconnect - resetting attempts');
    setConnectionAttempts(0);
    shouldConnectRef.current = true;
    if (socketRef.current) {
      socketRef.current.close();
    } else {
      connect();
    }
  };

  const sendMessage = (type: string, data: any) => {
    // TEMPORARY: WebSocket disabled
    if (websocketDisabled) {
      console.log('📤 WebSocket message discarded (disabled):', { type, data });
      return false;
    }
    
    const message = { type, data };
    
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
  };

  // Initialize connection only once, with conservative approach
  useEffect(() => {
    // TEMPORARY: Skip connection entirely when disabled
    if (websocketDisabled) {
      console.log('🚫 WebSocket initialization skipped (disabled)');
      return;
    }
    
    shouldConnectRef.current = true;
    
    // Delay initial connection to prevent race conditions
    const timeout = setTimeout(() => {
      if (shouldConnectRef.current && connectionAttempts === 0) {
        connect();
      }
    }, 2000);

    return () => {
      shouldConnectRef.current = false;
      isConnectingRef.current = false;
      clearTimeout(timeout);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []); // Empty deps to run only once

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    isConnecting,
    connectionAttempts,
    sendMessage,
    lastMessage,
    forceReconnect
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): SocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      isConnecting: false,
      connectionAttempts: 0,
      sendMessage: () => false,
      lastMessage: null,
      forceReconnect: () => {}
    };
  }
  return context;
}