import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState(new Set());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-backend-domain.com'
      : 'http://localhost:5001';

    const newSocket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      reconnectAttempts.current = 0;
      
      // Authenticate with the server
      newSocket.emit('authenticate', token);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, attempt to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        toast.error('Failed to connect to real-time updates');
      }
    });

    // Authentication responses
    newSocket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
      toast.success('Connected to real-time updates');
    });

    newSocket.on('authentication_error', (error) => {
      console.error('WebSocket authentication error:', error);
      toast.error('Failed to authenticate WebSocket connection');
    });

    // Real-time data handlers
    newSocket.on('streamer_update', (data) => {
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('streamer_update', { detail: data }));
    });

    newSocket.on('game_trend_update', (data) => {
      window.dispatchEvent(new CustomEvent('game_trend_update', { detail: data }));
    });

    newSocket.on('global_trends_update', (data) => {
      window.dispatchEvent(new CustomEvent('global_trends_update', { detail: data }));
    });

    newSocket.on('viewer_count_update', (data) => {
      window.dispatchEvent(new CustomEvent('viewer_count_update', { detail: data }));
    });

    newSocket.on('live_status_change', (data) => {
      window.dispatchEvent(new CustomEvent('live_status_change', { detail: data }));
    });

    newSocket.on('alert', (data) => {
      // Show trending alerts as notifications
      if (data.type === 'trending_game') {
        toast.success(`📈 ${data.gameName} is trending!`);
      } else if (data.type === 'viral_clip') {
        toast.success(`🔥 Viral clip detected: ${data.title}`);
      }
      
      window.dispatchEvent(new CustomEvent('trending_alert', { detail: data }));
    });

    newSocket.on('notification', (data) => {
      toast(data.message, {
        icon: data.type === 'success' ? '✅' : data.type === 'warning' ? '⚠️' : 'ℹ️',
      });
    });

    newSocket.on('chat_analysis', (data) => {
      window.dispatchEvent(new CustomEvent('chat_analysis', { detail: data }));
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      toast.error(error.message || 'WebSocket error occurred');
    });

    // Connect the socket
    newSocket.connect();
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  // Subscribe to streamer updates
  const subscribeToStreamer = (streamerId) => {
    if (socket && connected) {
      socket.emit('subscribe_streamer', streamerId);
      setSubscriptions(prev => new Set([...prev, `streamer_${streamerId}`]));
    }
  };

  // Unsubscribe from streamer updates
  const unsubscribeFromStreamer = (streamerId) => {
    if (socket && connected) {
      socket.emit('unsubscribe_streamer', streamerId);
      setSubscriptions(prev => {
        const newSubs = new Set(prev);
        newSubs.delete(`streamer_${streamerId}`);
        return newSubs;
      });
    }
  };

  // Subscribe to game updates
  const subscribeToGame = (gameId) => {
    if (socket && connected) {
      socket.emit('subscribe_game', gameId);
      setSubscriptions(prev => new Set([...prev, `game_${gameId}`]));
    }
  };

  // Unsubscribe from game updates
  const unsubscribeFromGame = (gameId) => {
    if (socket && connected) {
      socket.emit('unsubscribe_game', gameId);
      setSubscriptions(prev => {
        const newSubs = new Set(prev);
        newSubs.delete(`game_${gameId}`);
        return newSubs;
      });
    }
  };

  // Subscribe to global trends
  const subscribeToGlobalTrends = () => {
    if (socket && connected) {
      socket.emit('subscribe_global_trends');
      setSubscriptions(prev => new Set([...prev, 'global_trends']));
    }
  };

  // Request real-time data
  const getViewerCount = (streamerId) => {
    if (socket && connected) {
      socket.emit('get_viewer_count', streamerId);
    }
  };

  const checkLiveStatus = (streamerId) => {
    if (socket && connected) {
      socket.emit('check_live_status', streamerId);
    }
  };

  const analyzeChat = (streamerId) => {
    if (socket && connected) {
      socket.emit('analyze_chat', streamerId);
    }
  };

  // Emit custom events
  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  // Listen for custom events
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  };

  const value = {
    socket,
    connected,
    subscriptions: Array.from(subscriptions),
    subscribeToStreamer,
    unsubscribeFromStreamer,
    subscribeToGame,
    unsubscribeFromGame,
    subscribeToGlobalTrends,
    getViewerCount,
    checkLiveStatus,
    analyzeChat,
    emit,
    on,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
