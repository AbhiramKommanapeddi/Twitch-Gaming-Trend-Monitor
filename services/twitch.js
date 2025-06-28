const axios = require('axios');
const Redis = require('redis');
const { Game, Streamer } = require('../models');

class TwitchService {
  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID;
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.redis = Redis.createClient(process.env.REDIS_URL);
    this.baseURL = 'https://api.twitch.tv/helix';
    this.rapidAPIBaseURL = 'https://twitch-api.p.rapidapi.com';
  }

  async initialize() {
    await this.redis.connect();
    await this.getAccessToken();
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Check if we have a cached token
      const cachedToken = await this.redis.get('twitch:access_token');
      if (cachedToken) {
        this.accessToken = cachedToken;
        this.tokenExpiry = Date.now() + (3600 * 1000) - 60000; // Assume 1 hour with buffer
        return cachedToken;
      }

      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

      // Cache the token
      await this.redis.setex('twitch:access_token', response.data.expires_in - 60, this.accessToken);

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Twitch access token:', error);
      throw new Error('Unable to authenticate with Twitch API');
    }
  }

  async makeRequest(endpoint, params = {}) {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`
        },
        params
      });

      return response.data;
    } catch (error) {
      console.error(`Twitch API request failed for ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async makeRapidAPIRequest(endpoint, params = {}) {
    try {
      const response = await axios.get(`${this.rapidAPIBaseURL}${endpoint}`, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
        },
        params
      });

      return response.data;
    } catch (error) {
      console.error(`RapidAPI request failed for ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getTopGames(limit = 20) {
    try {
      const cacheKey = `twitch:top_games:${limit}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const data = await this.makeRequest('/games/top', { first: limit });
      
      // Cache for 5 minutes
      await this.redis.setex(cacheKey, 300, JSON.stringify(data.data));
      
      // Update database with fresh data
      for (const gameData of data.data) {
        await this.updateGameInDatabase(gameData);
      }

      return data.data;
    } catch (error) {
      console.error('Failed to fetch top games:', error);
      throw error;
    }
  }

  async getGameById(gameId) {
    try {
      const data = await this.makeRequest('/games', { id: gameId });
      return data.data[0] || null;
    } catch (error) {
      console.error(`Failed to fetch game ${gameId}:`, error);
      return null;
    }
  }

  async getStreams(params = {}) {
    try {
      const cacheKey = `twitch:streams:${JSON.stringify(params)}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const defaultParams = { first: 20 };
      const data = await this.makeRequest('/streams', { ...defaultParams, ...params });
      
      // Cache for 2 minutes
      await this.redis.setex(cacheKey, 120, JSON.stringify(data.data));
      
      // Update streamers in database
      for (const streamData of data.data) {
        await this.updateStreamerInDatabase(streamData);
      }

      return data.data;
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const data = await this.makeRequest('/users', { id: userId });
      return data.data[0] || null;
    } catch (error) {
      console.error(`Failed to fetch user ${userId}:`, error);
      return null;
    }
  }

  async getUserByLogin(login) {
    try {
      const data = await this.makeRequest('/users', { login });
      return data.data[0] || null;
    } catch (error) {
      console.error(`Failed to fetch user ${login}:`, error);
      return null;
    }
  }

  async getFollowers(userId, after = null) {
    try {
      const params = { to_id: userId, first: 20 };
      if (after) params.after = after;
      
      const data = await this.makeRequest('/users/follows', params);
      return data;
    } catch (error) {
      console.error(`Failed to fetch followers for ${userId}:`, error);
      return { data: [], total: 0 };
    }
  }

  async getClips(params = {}) {
    try {
      const defaultParams = { first: 20, started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() };
      const data = await this.makeRequest('/clips', { ...defaultParams, ...params });
      return data.data;
    } catch (error) {
      console.error('Failed to fetch clips:', error);
      return [];
    }
  }

  async getChannelInformation(broadcasterId) {
    try {
      const data = await this.makeRequest('/channels', { broadcaster_id: broadcasterId });
      return data.data[0] || null;
    } catch (error) {
      console.error(`Failed to fetch channel info for ${broadcasterId}:`, error);
      return null;
    }
  }

  async getStreamAnalytics(broadcasterId, params = {}) {
    try {
      // This would use Twitch Analytics API if available
      // For now, we'll use RapidAPI as an alternative
      return await this.makeRapidAPIRequest('/analytics/streams', {
        broadcaster_id: broadcasterId,
        ...params
      });
    } catch (error) {
      console.error(`Failed to fetch stream analytics for ${broadcasterId}:`, error);
      return null;
    }
  }

  async getChatMessages(broadcasterId, limit = 100) {
    try {
      // This would typically require IRC connection or EventSub
      // For demo purposes, we'll simulate or use RapidAPI
      return await this.makeRapidAPIRequest('/chat/messages', {
        broadcaster_id: broadcasterId,
        limit
      });
    } catch (error) {
      console.error(`Failed to fetch chat messages for ${broadcasterId}:`, error);
      return [];
    }
  }

  async updateGameInDatabase(gameData) {
    try {
      await Game.upsert({
        twitch_game_id: gameData.id,
        name: gameData.name,
        box_art_url: gameData.box_art_url,
        // We would get viewer count from streams endpoint
        current_viewers: 0, // This would be calculated separately
        current_channels: 0
      });
    } catch (error) {
      console.error('Failed to update game in database:', error);
    }
  }

  async updateStreamerInDatabase(streamData) {
    try {
      // Get user info first
      const userInfo = await this.getUserById(streamData.user_id);
      if (!userInfo) return;

      await Streamer.upsert({
        twitch_user_id: streamData.user_id,
        login: streamData.user_login,
        display_name: streamData.user_name,
        is_live: true,
        current_game_id: streamData.game_id,
        current_title: streamData.title,
        current_viewer_count: streamData.viewer_count,
        language: streamData.language,
        // Additional fields from user info
        profile_image_url: userInfo.profile_image_url,
        description: userInfo.description,
        view_count: userInfo.view_count,
        created_at_twitch: userInfo.created_at
      });
    } catch (error) {
      console.error('Failed to update streamer in database:', error);
    }
  }

  // Real-time data methods
  async getViewerCount(channelName) {
    try {
      const streams = await this.getStreams({ user_login: channelName });
      return streams.length > 0 ? streams[0].viewer_count : 0;
    } catch (error) {
      console.error(`Failed to get viewer count for ${channelName}:`, error);
      return 0;
    }
  }

  async isStreamLive(channelName) {
    try {
      const streams = await this.getStreams({ user_login: channelName });
      return streams.length > 0;
    } catch (error) {
      console.error(`Failed to check if ${channelName} is live:`, error);
      return false;
    }
  }

  // Batch operations for efficiency
  async getMultipleUsers(userIds) {
    try {
      const chunks = [];
      for (let i = 0; i < userIds.length; i += 100) {
        chunks.push(userIds.slice(i, i + 100));
      }

      const results = [];
      for (const chunk of chunks) {
        const data = await this.makeRequest('/users', { id: chunk });
        results.push(...data.data);
      }

      return results;
    } catch (error) {
      console.error('Failed to fetch multiple users:', error);
      return [];
    }
  }

  async getMultipleGames(gameIds) {
    try {
      const chunks = [];
      for (let i = 0; i < gameIds.length; i += 100) {
        chunks.push(gameIds.slice(i, i + 100));
      }

      const results = [];
      for (const chunk of chunks) {
        const data = await this.makeRequest('/games', { id: chunk });
        results.push(...data.data);
      }

      return results;
    } catch (error) {
      console.error('Failed to fetch multiple games:', error);
      return [];
    }
  }
}

module.exports = new TwitchService();
