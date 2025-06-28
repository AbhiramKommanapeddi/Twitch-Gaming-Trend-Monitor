const express = require('express');
const { Streamer, StreamData, ViewerMetrics, ClipData } = require('../models');
const { Op } = require('sequelize');
const TwitchService = require('../services/twitch');
const CacheService = require('../services/cache');
const router = express.Router();

// Get top streamers
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const twitchService = req.app.locals.twitchService;
    
    // Get live streams from Twitch
    const streams = await twitchService.getStreams({ first: limit });
    
    // Format for frontend
    const topStreamers = streams.map(stream => ({
      id: stream.user_id,
      displayName: stream.user_name,
      loginName: stream.user_login,
      profileImageUrl: `https://static-cdn.jtvnw.net/jtv_user_pictures/${stream.user_login}-profile_image-300x300.png`,
      currentViewers: stream.viewer_count,
      currentGame: stream.game_name,
      streamTitle: stream.title,
      isLive: true,
      language: stream.language,
      thumbnailUrl: stream.thumbnail_url?.replace('{width}', '320').replace('{height}', '180'),
      startedAt: stream.started_at
    }));
    
    res.json(topStreamers);
  } catch (error) {
    console.error('Top streamers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch top streamers' });
  }
});

// Get streamer details
router.get('/:streamerId', async (req, res) => {
  try {
    const { streamerId } = req.params;
    const cacheKey = `streamer_details_${streamerId}`;
    
    let streamer = await CacheService.get(cacheKey);
    
    if (!streamer) {
      streamer = await Streamer.findOne({
        where: { twitch_user_id: streamerId },
        include: [
          {
            model: StreamData,
            limit: 10,
            order: [['created_at', 'DESC']]
          },
          {
            model: ViewerMetrics,
            limit: 24,
            order: [['timestamp', 'DESC']]
          },
          {
            model: ClipData,
            limit: 5,
            order: [['view_count', 'DESC']]
          }
        ]
      });
      
      if (!streamer) {
        // Fetch from Twitch API if not in database
        const twitchUser = await TwitchService.getUserById(streamerId);
        if (twitchUser) {
          streamer = await Streamer.create({
            twitch_user_id: twitchUser.id,
            login: twitchUser.login,
            display_name: twitchUser.display_name,
            profile_image_url: twitchUser.profile_image_url,
            description: twitchUser.description,
            view_count: twitchUser.view_count,
            created_at_twitch: twitchUser.created_at
          });
        }
      }
      
      // Cache for 5 minutes
      await CacheService.set(cacheKey, streamer, 300);
    }
    
    if (!streamer) {
      return res.status(404).json({ error: 'Streamer not found' });
    }
    
    res.json(streamer);
  } catch (error) {
    console.error('Streamer details fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch streamer details' });
  }
});

// Get streamer analytics
router.get('/:streamerId/analytics', async (req, res) => {
  try {
    const { streamerId } = req.params;
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
    
    const metrics = await ViewerMetrics.findAll({
      where: {
        streamer_id: streamerId,
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['timestamp', 'ASC']]
    });
    
    const streamStats = await StreamData.findAll({
      where: {
        streamer_id: streamerId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('viewer_count')), 'avg_viewers'],
        [sequelize.fn('MAX', sequelize.col('viewer_count')), 'peak_viewers'],
        [sequelize.fn('SUM', sequelize.col('duration_minutes')), 'total_stream_time'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'stream_count']
      ]
    });
    
    res.json({
      metrics,
      stats: streamStats[0]
    });
  } catch (error) {
    console.error('Streamer analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch streamer analytics' });
  }
});

// Get streamer clips
router.get('/:streamerId/clips', async (req, res) => {
  try {
    const { streamerId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const period = req.query.period || '7d';
    
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
    
    const clips = await ClipData.findAll({
      where: {
        streamer_id: streamerId,
        created_at_twitch: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['view_count', 'DESC']],
      limit
    });
    
    res.json(clips);
  } catch (error) {
    console.error('Streamer clips fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch streamer clips' });
  }
});

// Search streamers
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const streamers = await Streamer.findAll({
      where: {
        [Op.or]: [
          {
            login: {
              [Op.iLike]: `%${query}%`
            }
          },
          {
            display_name: {
              [Op.iLike]: `%${query}%`
            }
          }
        ]
      },
      limit,
      order: [['current_viewer_count', 'DESC']]
    });
    
    res.json(streamers);
  } catch (error) {
    console.error('Streamer search error:', error);
    res.status(500).json({ error: 'Failed to search streamers' });
  }
});

// Get live streamers for a specific game
router.get('/game/:gameId/live', async (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const liveStreamers = await Streamer.findAll({
      where: {
        is_live: true,
        current_game_id: gameId
      },
      order: [['current_viewer_count', 'DESC']],
      limit
    });
    
    res.json(liveStreamers);
  } catch (error) {
    console.error('Live streamers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch live streamers' });
  }
});

// Get streamer schedule optimization
router.get('/:streamerId/schedule-optimizer', async (req, res) => {
  try {
    const { streamerId } = req.params;
    
    // Analyze historical data to suggest optimal streaming times
    const metrics = await ViewerMetrics.findAll({
      where: { streamer_id: streamerId },
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM timestamp')), 'hour'],
        [sequelize.fn('EXTRACT', sequelize.literal('DOW FROM timestamp')), 'day_of_week'],
        [sequelize.fn('AVG', sequelize.col('viewer_count')), 'avg_viewers'],
        [sequelize.fn('AVG', sequelize.col('engagement_score')), 'avg_engagement']
      ],
      group: ['hour', 'day_of_week'],
      order: [['avg_viewers', 'DESC']]
    });
    
    const recommendations = {
      bestHours: metrics.slice(0, 5),
      worstHours: metrics.slice(-5),
      bestDays: metrics.reduce((acc, curr) => {
        const dayIndex = parseInt(curr.dataValues.day_of_week);
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
        if (!acc[dayName]) {
          acc[dayName] = [];
        }
        acc[dayName].push(curr);
        return acc;
      }, {})
    };
    
    res.json(recommendations);
  } catch (error) {
    console.error('Schedule optimizer error:', error);
    res.status(500).json({ error: 'Failed to generate schedule recommendations' });
  }
});

module.exports = router;
