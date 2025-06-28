const cron = require('node-cron');
const TwitchService = require('./twitch');
const AnalyticsService = require('./analytics');
const CacheService = require('./cache');
const { 
  Game, 
  Streamer, 
  StreamData, 
  GameTrend, 
  ViewerMetrics, 
  ChatAnalytics 
} = require('../models');

class CronJobService {
  constructor() {
    this.jobs = new Map();
  }

  startAll() {
    this.startTopGamesUpdate();
    this.startStreamDataCollection();
    this.startTrendAnalysis();
    this.startViewerMetricsCollection();
    this.startChatAnalysis();
    this.startCleanupTasks();
    this.startCacheWarming();
    
    console.log('All cron jobs started successfully');
  }

  stopAll() {
    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    }
    this.jobs.clear();
  }

  // Update top games every 5 minutes
  startTopGamesUpdate() {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Updating top games...');
        
        const topGames = await TwitchService.getTopGames(50);
        
        for (const gameData of topGames) {
          // Get current streams for this game
          const streams = await TwitchService.getStreams({ game_id: gameData.id, first: 100 });
          
          const totalViewers = streams.reduce((sum, stream) => sum + stream.viewer_count, 0);
          const channelCount = streams.length;
          
          await Game.upsert({
            twitch_game_id: gameData.id,
            name: gameData.name,
            box_art_url: gameData.box_art_url,
            current_viewers: totalViewers,
            current_channels: channelCount,
            peak_viewers_today: Math.max(totalViewers, 0) // This would be properly calculated
          });
        }
        
        // Cache top games
        await CacheService.cacheTopGames(topGames, 300);
        
        console.log(`Updated ${topGames.length} top games`);
      } catch (error) {
        console.error('Top games update error:', error);
      }
    });

    this.jobs.set('topGamesUpdate', job);
    job.start();
  }

  // Collect stream data every 2 minutes
  startStreamDataCollection() {
    const job = cron.schedule('*/2 * * * *', async () => {
      try {
        console.log('Collecting stream data...');
        
        // Get top streams
        const streams = await TwitchService.getStreams({ first: 100 });
        
        for (const stream of streams) {
          // Update streamer info
          await TwitchService.updateStreamerInDatabase(stream);
          
          // Record stream data
          await StreamData.create({
            streamer_id: await this.getStreamerIdByTwitchId(stream.user_id),
            game_id: await this.getGameIdByTwitchId(stream.game_id),
            stream_id: stream.id,
            title: stream.title,
            viewer_count: stream.viewer_count,
            started_at: new Date(stream.started_at),
            language: stream.language,
            thumbnail_url: stream.thumbnail_url,
            is_mature: stream.is_mature,
            tags: stream.tags || []
          });
        }
        
        console.log(`Collected data for ${streams.length} streams`);
      } catch (error) {
        console.error('Stream data collection error:', error);
      }
    });

    this.jobs.set('streamDataCollection', job);
    job.start();
  }

  // Analyze trends every 15 minutes
  startTrendAnalysis() {
    const job = cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('Analyzing trends...');
        
        const games = await Game.findAll({ limit: 100 });
        const currentHour = new Date().getHours();
        const currentDate = new Date().toISOString().split('T')[0];
        
        for (const game of games) {
          // Get previous hour's data
          const previousTrend = await GameTrend.findOne({
            where: {
              game_id: game.id,
              date: currentDate,
              hour: currentHour - 1
            }
          });
          
          const currentViewers = game.current_viewers;
          const previousViewers = previousTrend?.viewer_count || 0;
          
          const growthRate = previousViewers > 0 
            ? ((currentViewers - previousViewers) / previousViewers) * 100 
            : 0;
          
          // Calculate trend score
          const trendScore = AnalyticsService.calculateTrendScore({
            currentViewers,
            previousViewers,
            growthRate,
            channelCount: game.current_channels
          });
          
          await GameTrend.upsert({
            game_id: game.id,
            date: currentDate,
            hour: currentHour,
            viewer_count: currentViewers,
            channel_count: game.current_channels,
            average_viewers_per_channel: game.current_channels > 0 
              ? currentViewers / game.current_channels 
              : 0,
            peak_viewers: Math.max(currentViewers, previousTrend?.peak_viewers || 0),
            growth_rate_hourly: growthRate,
            trend_score: trendScore,
            is_trending_up: growthRate > 20,
            is_trending_down: growthRate < -20
          });
          
          // Update game trending status
          game.trending_score = trendScore;
          game.is_trending = trendScore > 70;
          await game.save();
        }
        
        console.log(`Analyzed trends for ${games.length} games`);
      } catch (error) {
        console.error('Trend analysis error:', error);
      }
    });

    this.jobs.set('trendAnalysis', job);
    job.start();
  }

  // Collect viewer metrics every 5 minutes
  startViewerMetricsCollection() {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Collecting viewer metrics...');
        
        const liveStreamers = await Streamer.findAll({
          where: { is_live: true },
          limit: 200
        });
        
        for (const streamer of liveStreamers) {
          // Get follower count (would need proper API call)
          const followerData = await TwitchService.getFollowers(streamer.twitch_user_id);
          
          await ViewerMetrics.create({
            streamer_id: streamer.id,
            timestamp: new Date(),
            viewer_count: streamer.current_viewer_count,
            follower_count: followerData.total || 0,
            subscriber_count: 0, // Would need Twitch API call
            engagement_score: AnalyticsService.calculateEngagementScore({
              viewers: streamer.current_viewer_count,
              followers: followerData.total || 0
            }),
            game_category: streamer.current_game_id,
            stream_title: streamer.current_title
          });
        }
        
        console.log(`Collected metrics for ${liveStreamers.length} streamers`);
      } catch (error) {
        console.error('Viewer metrics collection error:', error);
      }
    });

    this.jobs.set('viewerMetricsCollection', job);
    job.start();
  }

  // Analyze chat every 10 minutes for top streamers
  startChatAnalysis() {
    const job = cron.schedule('*/10 * * * *', async () => {
      try {
        console.log('Analyzing chat...');
        
        const topStreamers = await Streamer.findAll({
          where: { 
            is_live: true,
            current_viewer_count: { [Op.gte]: 1000 }
          },
          order: [['current_viewer_count', 'DESC']],
          limit: 50
        });
        
        for (const streamer of topStreamers) {
          try {
            // Get recent stream data
            const recentStream = await StreamData.findOne({
              where: { streamer_id: streamer.id },
              order: [['created_at', 'DESC']]
            });
            
            if (!recentStream) continue;
            
            // Analyze chat (mock implementation)
            const chatAnalysis = await this.analyzeChatForStreamer(streamer.twitch_user_id);
            
            if (chatAnalysis) {
              await ChatAnalytics.create({
                stream_data_id: recentStream.id,
                timestamp: new Date(),
                ...chatAnalysis
              });
            }
          } catch (streamError) {
            console.error(`Chat analysis error for streamer ${streamer.login}:`, streamError);
          }
        }
        
        console.log(`Analyzed chat for ${topStreamers.length} streamers`);
      } catch (error) {
        console.error('Chat analysis error:', error);
      }
    });

    this.jobs.set('chatAnalysis', job);
    job.start();
  }

  // Cleanup old data daily
  startCleanupTasks() {
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        console.log('Running cleanup tasks...');
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        // Clean old stream data
        await StreamData.destroy({
          where: {
            created_at: { [Op.lt]: thirtyDaysAgo }
          }
        });
        
        // Clean old viewer metrics
        await ViewerMetrics.destroy({
          where: {
            timestamp: { [Op.lt]: sevenDaysAgo }
          }
        });
        
        // Clean old chat analytics
        await ChatAnalytics.destroy({
          where: {
            timestamp: { [Op.lt]: sevenDaysAgo }
          }
        });
        
        // Update offline streamers
        await Streamer.update(
          { is_live: false },
          {
            where: {
              is_live: true,
              updated_at: { [Op.lt]: new Date(Date.now() - 60 * 60 * 1000) } // 1 hour ago
            }
          }
        );
        
        console.log('Cleanup tasks completed');
      } catch (error) {
        console.error('Cleanup tasks error:', error);
      }
    });

    this.jobs.set('cleanupTasks', job);
    job.start();
  }

  // Warm cache with popular data every hour
  startCacheWarming() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        console.log('Warming cache...');
        
        // Cache top games
        const topGames = await TwitchService.getTopGames(20);
        await CacheService.cacheTopGames(topGames, 3600);
        
        // Cache top streamers
        const topStreamers = await Streamer.findAll({
          where: { is_live: true },
          order: [['current_viewer_count', 'DESC']],
          limit: 50
        });
        await CacheService.cacheTopStreamers(topStreamers, 1800);
        
        // Cache trending games
        const trendingGames = await Game.findAll({
          where: { is_trending: true },
          order: [['trending_score', 'DESC']],
          limit: 10
        });
        await CacheService.set('trending_games', trendingGames, 1800);
        
        console.log('Cache warming completed');
      } catch (error) {
        console.error('Cache warming error:', error);
      }
    });

    this.jobs.set('cacheWarming', job);
    job.start();
  }

  // Helper methods
  async getStreamerIdByTwitchId(twitchUserId) {
    if (!twitchUserId) return null;
    
    const streamer = await Streamer.findOne({
      where: { twitch_user_id: twitchUserId },
      attributes: ['id']
    });
    
    return streamer?.id || null;
  }

  async getGameIdByTwitchId(twitchGameId) {
    if (!twitchGameId) return null;
    
    const game = await Game.findOne({
      where: { twitch_game_id: twitchGameId },
      attributes: ['id']
    });
    
    return game?.id || null;
  }

  async analyzeChatForStreamer(twitchUserId) {
    try {
      // Mock chat analysis - in real implementation, this would:
      // 1. Connect to Twitch IRC or use EventSub
      // 2. Analyze recent messages for sentiment
      // 3. Count emotes and detect trends
      
      const mockAnalysis = {
        total_messages: Math.floor(Math.random() * 500) + 100,
        unique_chatters: Math.floor(Math.random() * 200) + 50,
        messages_per_minute: Math.random() * 10 + 5,
        average_message_length: Math.random() * 20 + 15,
        sentiment_score: (Math.random() - 0.5) * 2, // -1 to 1
        positive_sentiment_ratio: Math.random() * 0.4 + 0.3,
        negative_sentiment_ratio: Math.random() * 0.2 + 0.1,
        neutral_sentiment_ratio: Math.random() * 0.3 + 0.2,
        top_emotes: {
          'Kappa': Math.floor(Math.random() * 50),
          'PogChamp': Math.floor(Math.random() * 40),
          'LUL': Math.floor(Math.random() * 30)
        },
        emote_usage_count: Math.floor(Math.random() * 100) + 20,
        command_usage: {
          '!followage': Math.floor(Math.random() * 10),
          '!uptime': Math.floor(Math.random() * 5)
        }
      };
      
      return mockAnalysis;
    } catch (error) {
      console.error('Chat analysis error:', error);
      return null;
    }
  }

  // Get job status
  getJobStatus(jobName) {
    const job = this.jobs.get(jobName);
    return job ? job.getStatus() : null;
  }

  // List all jobs
  listJobs() {
    return Array.from(this.jobs.keys());
  }

  // Stop specific job
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      console.log(`Stopped job: ${jobName}`);
      return true;
    }
    return false;
  }
}

module.exports = new CronJobService();
