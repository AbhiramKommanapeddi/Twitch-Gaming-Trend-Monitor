const redisClient = require('../config/redis');

class CacheService {
  constructor() {
    this.defaultTTL = 300; // 5 minutes
  }

  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async mget(keys) {
    try {
      const data = await redisClient.mGet(keys);
      return data.map(item => item ? JSON.parse(item) : null);
    } catch (error) {
      console.error(`Cache mget error for keys ${keys}:`, error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      const pipeline = redisClient.multi();
      
      for (const [key, value] of keyValuePairs) {
        pipeline.setEx(key, ttl, JSON.stringify(value));
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  async increment(key, increment = 1, ttl = this.defaultTTL) {
    try {
      const result = await redisClient.incrBy(key, increment);
      if (result === increment) {
        // Key was created, set TTL
        await redisClient.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return null;
    }
  }

  async decrement(key, decrement = 1) {
    try {
      const result = await redisClient.decrBy(key, decrement);
      return result;
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error);
      return null;
    }
  }

  async sadd(key, members, ttl = this.defaultTTL) {
    try {
      const result = await redisClient.sAdd(key, members);
      await redisClient.expire(key, ttl);
      return result;
    } catch (error) {
      console.error(`Cache sadd error for key ${key}:`, error);
      return null;
    }
  }

  async smembers(key) {
    try {
      const result = await redisClient.sMembers(key);
      return result;
    } catch (error) {
      console.error(`Cache smembers error for key ${key}:`, error);
      return [];
    }
  }

  async srem(key, members) {
    try {
      const result = await redisClient.sRem(key, members);
      return result;
    } catch (error) {
      console.error(`Cache srem error for key ${key}:`, error);
      return null;
    }
  }

  async zadd(key, scoreMembers, ttl = this.defaultTTL) {
    try {
      const result = await redisClient.zAdd(key, scoreMembers);
      await redisClient.expire(key, ttl);
      return result;
    } catch (error) {
      console.error(`Cache zadd error for key ${key}:`, error);
      return null;
    }
  }

  async zrange(key, start = 0, stop = -1, withScores = false) {
    try {
      const options = withScores ? { REV: true, withScores: true } : { REV: true };
      const result = await redisClient.zRange(key, start, stop, options);
      return result;
    } catch (error) {
      console.error(`Cache zrange error for key ${key}:`, error);
      return [];
    }
  }

  async hset(key, field, value, ttl = this.defaultTTL) {
    try {
      const result = await redisClient.hSet(key, field, JSON.stringify(value));
      await redisClient.expire(key, ttl);
      return result;
    } catch (error) {
      console.error(`Cache hset error for key ${key}:`, error);
      return null;
    }
  }

  async hget(key, field) {
    try {
      const data = await redisClient.hGet(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache hget error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hgetall(key) {
    try {
      const data = await redisClient.hGetAll(key);
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      console.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  }

  async hdel(key, fields) {
    try {
      const result = await redisClient.hDel(key, fields);
      return result;
    } catch (error) {
      console.error(`Cache hdel error for key ${key}:`, error);
      return null;
    }
  }

  async flushPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return keys.length;
    } catch (error) {
      console.error(`Cache flush pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  async flushAll() {
    try {
      await redisClient.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush all error:', error);
      return false;
    }
  }

  // Real-time data caching methods
  async cacheStreamData(streamerId, data, ttl = 60) {
    const key = `stream:${streamerId}`;
    return await this.set(key, data, ttl);
  }

  async getStreamData(streamerId) {
    const key = `stream:${streamerId}`;
    return await this.get(key);
  }

  async cacheViewerCount(streamerId, count, ttl = 30) {
    const key = `viewers:${streamerId}`;
    return await this.set(key, count, ttl);
  }

  async getViewerCount(streamerId) {
    const key = `viewers:${streamerId}`;
    return await this.get(key);
  }

  async cacheGameTrend(gameId, trendData, ttl = 300) {
    const key = `trend:game:${gameId}`;
    return await this.set(key, trendData, ttl);
  }

  async getGameTrend(gameId) {
    const key = `trend:game:${gameId}`;
    return await this.get(key);
  }

  async cacheTopStreamers(streamers, ttl = 120) {
    const key = 'top:streamers';
    return await this.set(key, streamers, ttl);
  }

  async getTopStreamers() {
    const key = 'top:streamers';
    return await this.get(key);
  }

  async cacheTopGames(games, ttl = 300) {
    const key = 'top:games';
    return await this.set(key, games, ttl);
  }

  async getTopGames() {
    const key = 'top:games';
    return await this.get(key);
  }

  // Leaderboard caching
  async updateStreamerLeaderboard(streamerId, viewerCount) {
    const key = 'leaderboard:streamers';
    return await this.zadd(key, [{ score: viewerCount, value: streamerId }], 3600);
  }

  async getStreamerLeaderboard(limit = 50) {
    const key = 'leaderboard:streamers';
    return await this.zrange(key, 0, limit - 1, true);
  }

  async updateGameLeaderboard(gameId, viewerCount) {
    const key = 'leaderboard:games';
    return await this.zadd(key, [{ score: viewerCount, value: gameId }], 3600);
  }

  async getGameLeaderboard(limit = 20) {
    const key = 'leaderboard:games';
    return await this.zrange(key, 0, limit - 1, true);
  }

  // Session management
  async setUserSession(userId, sessionData, ttl = 86400) {
    const key = `session:${userId}`;
    return await this.set(key, sessionData, ttl);
  }

  async getUserSession(userId) {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  async clearUserSession(userId) {
    const key = `session:${userId}`;
    return await this.del(key);
  }

  // Rate limiting
  async isRateLimited(identifier, limit = 100, window = 3600) {
    const key = `rate_limit:${identifier}`;
    const current = await this.increment(key, 1, window);
    return current > limit;
  }

  async getRateLimitStatus(identifier) {
    const key = `rate_limit:${identifier}`;
    const current = await this.get(key) || 0;
    const ttl = await redisClient.ttl(key);
    return { current, remaining: Math.max(0, 100 - current), resetTime: ttl };
  }
}

module.exports = new CacheService();
