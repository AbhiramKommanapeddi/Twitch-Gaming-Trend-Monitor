const express = require('express');
const { 
  Game, 
  Streamer, 
  StreamData, 
  GameTrend, 
  ViewerMetrics, 
  ChatAnalytics, 
  ClipData 
} = require('../models');
const { Op, sequelize } = require('sequelize');
const AnalyticsService = require('../services/analytics');
const CacheService = require('../services/cache');
const router = express.Router();

// Get overall platform analytics
router.get('/overview', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    const cacheKey = `analytics_overview_${period}`;
    
    let overview = await CacheService.get(cacheKey);
    
    if (!overview) {
      let startDate;
      const endDate = new Date();
      
      switch (period) {
        case '1h':
          startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      }
      
      const [
        totalViewers,
        totalStreamers,
        totalGames,
        topGame,
        trendingGames
      ] = await Promise.all([
        Streamer.sum('current_viewer_count'),
        Streamer.count({ where: { is_live: true } }),
        Game.count(),
        Game.findOne({
          order: [['current_viewers', 'DESC']],
          attributes: ['name', 'current_viewers']
        }),
        Game.findAll({
          where: { is_trending: true },
          limit: 5,
          order: [['trending_score', 'DESC']],
          attributes: ['name', 'trending_score', 'current_viewers']
        })
      ]);
      
      overview = {
        totalViewers: totalViewers || 0,
        totalStreamers: totalStreamers || 0,
        totalGames: totalGames || 0,
        topGame,
        trendingGames,
        period,
        lastUpdated: new Date()
      };
      
      // Cache for 2 minutes
      await CacheService.set(cacheKey, overview, 120);
    }
    
    res.json(overview);
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// Get viewer migration patterns
router.get('/viewer-migration', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    const migrationData = await AnalyticsService.getViewerMigrationPatterns(startDate, endDate);
    
    res.json(migrationData);
  } catch (error) {
    console.error('Viewer migration error:', error);
    res.status(500).json({ error: 'Failed to fetch viewer migration data' });
  }
});

// Get category growth analysis
router.get('/category-growth', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const growthData = await GameTrend.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: Game,
        attributes: ['name', 'category']
      }],
      attributes: [
        'game_id',
        [sequelize.fn('AVG', sequelize.col('growth_rate_daily')), 'avg_growth_rate'],
        [sequelize.fn('MAX', sequelize.col('viewer_count')), 'peak_viewers'],
        [sequelize.fn('MIN', sequelize.col('viewer_count')), 'min_viewers']
      ],
      group: ['game_id', 'Game.id'],
      order: [['avg_growth_rate', 'DESC']],
      limit: 20
    });
    
    res.json(growthData);
  } catch (error) {
    console.error('Category growth error:', error);
    res.status(500).json({ error: 'Failed to fetch category growth data' });
  }
});

// Get sentiment analysis trends
router.get('/sentiment-trends', async (req, res) => {
  try {
    const { period = '7d', gameId, streamerId } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    let whereClause = {
      timestamp: {
        [Op.between]: [startDate, endDate]
      }
    };
    
    // Add filters if provided
    if (gameId || streamerId) {
      const streamDataWhere = {};
      if (gameId) streamDataWhere.game_id = gameId;
      if (streamerId) streamDataWhere.streamer_id = streamerId;
      
      const streamDataIds = await StreamData.findAll({
        where: streamDataWhere,
        attributes: ['id']
      });
      
      whereClause.stream_data_id = {
        [Op.in]: streamDataIds.map(sd => sd.id)
      };
    }
    
    const sentimentData = await ChatAnalytics.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'hour', sequelize.col('timestamp')), 'hour'],
        [sequelize.fn('AVG', sequelize.col('sentiment_score')), 'avg_sentiment'],
        [sequelize.fn('AVG', sequelize.col('positive_sentiment_ratio')), 'avg_positive'],
        [sequelize.fn('AVG', sequelize.col('negative_sentiment_ratio')), 'avg_negative'],
        [sequelize.fn('SUM', sequelize.col('total_messages')), 'total_messages']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'hour', sequelize.col('timestamp'))],
      order: [['hour', 'ASC']]
    });
    
    res.json(sentimentData);
  } catch (error) {
    console.error('Sentiment trends error:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment trends' });
  }
});

// Get clip virality predictions
router.get('/clip-virality', async (req, res) => {
  try {
    const { limit = 20, threshold = 0.7 } = req.query;
    
    const viralClips = await ClipData.findAll({
      where: {
        predicted_viral_potential: {
          [Op.gte]: parseFloat(threshold)
        }
      },
      order: [['predicted_viral_potential', 'DESC']],
      limit: parseInt(limit),
      include: [{
        model: Streamer,
        attributes: ['display_name', 'login']
      }]
    });
    
    res.json(viralClips);
  } catch (error) {
    console.error('Clip virality error:', error);
    res.status(500).json({ error: 'Failed to fetch clip virality predictions' });
  }
});

// Get performance metrics comparison
router.get('/performance-metrics', async (req, res) => {
  try {
    const { streamers, period = '7d' } = req.query;
    
    if (!streamers) {
      return res.status(400).json({ error: 'Streamers parameter required' });
    }
    
    const streamerIds = streamers.split(',');
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    const metricsComparison = await ViewerMetrics.findAll({
      where: {
        streamer_id: {
          [Op.in]: streamerIds
        },
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'streamer_id',
        [sequelize.fn('AVG', sequelize.col('viewer_count')), 'avg_viewers'],
        [sequelize.fn('MAX', sequelize.col('viewer_count')), 'peak_viewers'],
        [sequelize.fn('AVG', sequelize.col('engagement_score')), 'avg_engagement'],
        [sequelize.fn('AVG', sequelize.col('viewer_retention_rate')), 'avg_retention'],
        [sequelize.fn('SUM', sequelize.col('new_followers')), 'total_new_followers'],
        [sequelize.fn('SUM', sequelize.col('stream_uptime_minutes')), 'total_stream_time']
      ],
      group: ['streamer_id'],
      include: [{
        model: Streamer,
        attributes: ['display_name', 'login']
      }]
    });
    
    res.json(metricsComparison);
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// Get real-time trending alerts
router.get('/trending-alerts', async (req, res) => {
  try {
    const cacheKey = 'trending_alerts';
    
    let alerts = await CacheService.get(cacheKey);
    
    if (!alerts) {
      // Find games with sudden viewer spikes
      const recentTrends = await GameTrend.findAll({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          },
          growth_rate_hourly: {
            [Op.gte]: 50 // 50% growth or more
          }
        },
        include: [{
          model: Game,
          attributes: ['name', 'box_art_url']
        }],
        order: [['growth_rate_hourly', 'DESC']],
        limit: 10
      });
      
      // Find streamers with rapid follower growth
      const streamerAlerts = await ViewerMetrics.findAll({
        where: {
          timestamp: {
            [Op.gte]: new Date(Date.now() - 60 * 60 * 1000)
          },
          new_followers: {
            [Op.gte]: 100 // 100+ new followers in an hour
          }
        },
        include: [{
          model: Streamer,
          attributes: ['display_name', 'login']
        }],
        order: [['new_followers', 'DESC']],
        limit: 10
      });
      
      alerts = {
        gameAlerts: recentTrends,
        streamerAlerts,
        generatedAt: new Date()
      };
      
      // Cache for 5 minutes
      await CacheService.set(cacheKey, alerts, 300);
    }
    
    res.json(alerts);
  } catch (error) {
    console.error('Trending alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch trending alerts' });
  }
});

module.exports = router;
