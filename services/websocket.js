const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const CacheService = require('./cache');
const TwitchService = require('./twitch');

class WebSocketManager {
  constructor(io) {
    this.io = io;
    this.clients = new Map();
    this.rooms = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Authentication middleware
      socket.on('authenticate', async (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          socket.authenticated = true;
          
          this.clients.set(socket.id, {
            userId: decoded.id,
            username: decoded.username,
            connectedAt: new Date()
          });

          socket.emit('authenticated', { 
            success: true, 
            userId: decoded.id,
            username: decoded.username
          });

          // Join user's personal room
          socket.join(`user_${decoded.id}`);
          
          console.log(`User authenticated: ${decoded.username} (${socket.id})`);
        } catch (error) {
          socket.emit('authentication_error', { error: 'Invalid token' });
          console.log(`Authentication failed for ${socket.id}: ${error.message}`);
        }
      });

      // Subscribe to streamer updates
      socket.on('subscribe_streamer', async (streamerId) => {
        if (!socket.authenticated) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        const room = `streamer_${streamerId}`;
        socket.join(room);
        
        if (!this.rooms.has(room)) {
          this.rooms.set(room, new Set());
        }
        this.rooms.get(room).add(socket.id);

        // Send current data if available
        const cachedData = await CacheService.getStreamData(streamerId);
        if (cachedData) {
          socket.emit('streamer_update', {
            streamerId,
            data: cachedData
          });
        }

        socket.emit('subscribed', { streamerId, room });
        console.log(`${socket.id} subscribed to streamer ${streamerId}`);
      });

      // Unsubscribe from streamer updates
      socket.on('unsubscribe_streamer', (streamerId) => {
        const room = `streamer_${streamerId}`;
        socket.leave(room);
        
        if (this.rooms.has(room)) {
          this.rooms.get(room).delete(socket.id);
          if (this.rooms.get(room).size === 0) {
            this.rooms.delete(room);
          }
        }

        socket.emit('unsubscribed', { streamerId });
        console.log(`${socket.id} unsubscribed from streamer ${streamerId}`);
      });

      // Subscribe to game updates
      socket.on('subscribe_game', async (gameId) => {
        if (!socket.authenticated) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        const room = `game_${gameId}`;
        socket.join(room);
        
        if (!this.rooms.has(room)) {
          this.rooms.set(room, new Set());
        }
        this.rooms.get(room).add(socket.id);

        // Send current trend data
        const trendData = await CacheService.getGameTrend(gameId);
        if (trendData) {
          socket.emit('game_trend_update', {
            gameId,
            data: trendData
          });
        }

        socket.emit('subscribed', { gameId, room });
        console.log(`${socket.id} subscribed to game ${gameId}`);
      });

      // Unsubscribe from game updates
      socket.on('unsubscribe_game', (gameId) => {
        const room = `game_${gameId}`;
        socket.leave(room);
        
        if (this.rooms.has(room)) {
          this.rooms.get(room).delete(socket.id);
          if (this.rooms.get(room).size === 0) {
            this.rooms.delete(room);
          }
        }

        socket.emit('unsubscribed', { gameId });
        console.log(`${socket.id} unsubscribed from game ${gameId}`);
      });

      // Subscribe to global trends
      socket.on('subscribe_global_trends', () => {
        if (!socket.authenticated) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        socket.join('global_trends');
        socket.emit('subscribed', { room: 'global_trends' });
        console.log(`${socket.id} subscribed to global trends`);
      });

      // Request viewer count for specific streamer
      socket.on('get_viewer_count', async (streamerId) => {
        try {
          const count = await TwitchService.getViewerCount(streamerId);
          socket.emit('viewer_count', { streamerId, count });
        } catch (error) {
          socket.emit('error', { message: 'Failed to get viewer count' });
        }
      });

      // Request live status for streamer
      socket.on('check_live_status', async (streamerId) => {
        try {
          const isLive = await TwitchService.isStreamLive(streamerId);
          socket.emit('live_status', { streamerId, isLive });
        } catch (error) {
          socket.emit('error', { message: 'Failed to check live status' });
        }
      });

      // Handle chat analysis requests
      socket.on('analyze_chat', async (streamerId) => {
        if (!socket.authenticated) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        try {
          // This would integrate with chat analysis service
          const analysis = await this.analyzeChatSentiment(streamerId);
          socket.emit('chat_analysis', { streamerId, analysis });
        } catch (error) {
          socket.emit('error', { message: 'Failed to analyze chat' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Clean up client data
        this.clients.delete(socket.id);
        
        // Clean up room memberships
        for (const [room, members] of this.rooms.entries()) {
          members.delete(socket.id);
          if (members.size === 0) {
            this.rooms.delete(room);
          }
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  // Broadcast streamer updates
  async broadcastStreamerUpdate(streamerId, data) {
    const room = `streamer_${streamerId}`;
    
    // Cache the data
    await CacheService.cacheStreamData(streamerId, data, 60);
    
    // Broadcast to all subscribers
    this.io.to(room).emit('streamer_update', {
      streamerId,
      data,
      timestamp: new Date()
    });
  }

  // Broadcast game trend updates
  async broadcastGameTrendUpdate(gameId, trendData) {
    const room = `game_${gameId}`;
    
    // Cache the trend data
    await CacheService.cacheGameTrend(gameId, trendData, 300);
    
    // Broadcast to all subscribers
    this.io.to(room).emit('game_trend_update', {
      gameId,
      data: trendData,
      timestamp: new Date()
    });
  }

  // Broadcast global trends
  async broadcastGlobalTrends(trendsData) {
    this.io.to('global_trends').emit('global_trends_update', {
      data: trendsData,
      timestamp: new Date()
    });
  }

  // Broadcast alerts
  async broadcastAlert(alertData) {
    this.io.emit('alert', {
      ...alertData,
      timestamp: new Date()
    });
  }

  // Send notification to specific user
  async sendUserNotification(userId, notification) {
    this.io.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date()
    });
  }

  // Broadcast viewer count updates
  async broadcastViewerCountUpdate(streamerId, count) {
    const room = `streamer_${streamerId}`;
    
    // Cache viewer count
    await CacheService.cacheViewerCount(streamerId, count, 30);
    
    this.io.to(room).emit('viewer_count_update', {
      streamerId,
      count,
      timestamp: new Date()
    });
  }

  // Broadcast live status changes
  async broadcastLiveStatusChange(streamerId, isLive, streamData = null) {
    const room = `streamer_${streamerId}`;
    
    this.io.to(room).emit('live_status_change', {
      streamerId,
      isLive,
      streamData,
      timestamp: new Date()
    });
  }

  // Get connected clients count
  getConnectedClientsCount() {
    return this.clients.size;
  }

  // Get active rooms
  getActiveRooms() {
    return Array.from(this.rooms.keys());
  }

  // Get room subscriber count
  getRoomSubscriberCount(room) {
    return this.rooms.get(room)?.size || 0;
  }

  // Analyze chat sentiment (placeholder implementation)
  async analyzeChatSentiment(streamerId) {
    try {
      // This would integrate with a proper sentiment analysis service
      const messages = await TwitchService.getChatMessages(streamerId, 100);
      
      // Simple mock analysis
      const analysis = {
        totalMessages: messages.length,
        sentiment: {
          positive: Math.random() * 0.4 + 0.3, // 30-70%
          negative: Math.random() * 0.2 + 0.1, // 10-30%
          neutral: Math.random() * 0.3 + 0.2   // 20-50%
        },
        topEmotes: ['Kappa', 'PogChamp', '4Head', 'LUL', 'EZ'],
        activityLevel: messages.length > 50 ? 'high' : messages.length > 20 ? 'medium' : 'low'
      };

      return analysis;
    } catch (error) {
      console.error('Chat sentiment analysis error:', error);
      return null;
    }
  }

  // Cleanup inactive connections
  cleanupInactiveConnections() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [socketId, client] of this.clients.entries()) {
      if (now - client.connectedAt.getTime() > timeout) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket && !socket.authenticated) {
          socket.disconnect();
        }
      }
    }
  }
}

module.exports = WebSocketManager;
