const express = require('express');
const { 
  User, 
  Streamer, 
  StreamData, 
  Game, 
  ViewerMetrics, 
  ChatAnalytics, 
  ClipData 
} = require('../models');
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const CacheService = require('../services/cache');
const router = express.Router();

// Get dashboard overview for authenticated user
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `dashboard_overview_${userId}`;
    
    let overview = await CacheService.get(cacheKey);
    
    if (!overview) {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['access_token', 'refresh_token'] }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get user's tracked streamers (from preferences)
      const trackedStreamers = user.preferences?.trackedStreamers || [];
      
      let streamerStats = {};
      if (trackedStreamers.length > 0) {
        const streamers = await Streamer.findAll({
          where: {
            twitch_user_id: {
              [Op.in]: trackedStreamers
            }
          },
          include: [{
            model: ViewerMetrics,
            limit: 1,
            order: [['timestamp', 'DESC']]
          }]
        });
        
        streamerStats = {
          total: streamers.length,
          live: streamers.filter(s => s.is_live).length,
          totalViewers: streamers.reduce((sum, s) => sum + (s.current_viewer_count || 0), 0),
          avgViewers: streamers.length > 0 ? 
            streamers.reduce((sum, s) => sum + (s.current_viewer_count || 0), 0) / streamers.length : 0
        };
      }
      
      // Get trending games
      const trendingGames = await Game.findAll({
        where: { is_trending: true },
        order: [['trending_score', 'DESC']],
        limit: 5
      });
      
      // Get recent activity
      const recentStreams = await StreamData.findAll({
        where: {
          user_id: userId,
          created_at: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: [
          { model: Streamer, attributes: ['display_name', 'login'] },
          { model: Game, attributes: ['name'] }
        ],
        order: [['created_at', 'DESC']],
        limit: 10
      });
      
      overview = {
        user: {
          username: user.username,
          displayName: user.display_name,
          profileImage: user.profile_image_url
        },
        streamerStats,
        trendingGames,
        recentStreams,
        lastUpdated: new Date()
      };
      
      // Cache for 5 minutes
      await CacheService.set(cacheKey, overview, 300);
    }
    
    res.json(overview);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Add streamer to tracking list
router.post('/track-streamer', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { streamerId } = req.body;
    
    if (!streamerId) {
      return res.status(400).json({ error: 'Streamer ID required' });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify streamer exists
    const streamer = await Streamer.findOne({
      where: { twitch_user_id: streamerId }
    });
    
    if (!streamer) {
      return res.status(404).json({ error: 'Streamer not found' });
    }
    
    // Add to tracked streamers
    const trackedStreamers = user.preferences?.trackedStreamers || [];
    if (!trackedStreamers.includes(streamerId)) {
      trackedStreamers.push(streamerId);
      user.preferences = {
        ...user.preferences,
        trackedStreamers
      };
      await user.save();
    }
    
    // Clear cache
    await CacheService.del(`dashboard_overview_${userId}`);
    
    res.json({ 
      message: 'Streamer added to tracking list',
      trackedStreamers: trackedStreamers.length
    });
  } catch (error) {
    console.error('Track streamer error:', error);
    res.status(500).json({ error: 'Failed to track streamer' });
  }
});

// Remove streamer from tracking list
router.delete('/track-streamer/:streamerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { streamerId } = req.params;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove from tracked streamers
    const trackedStreamers = user.preferences?.trackedStreamers || [];
    const updatedStreamers = trackedStreamers.filter(id => id !== streamerId);
    
    user.preferences = {
      ...user.preferences,
      trackedStreamers: updatedStreamers
    };
    await user.save();
    
    // Clear cache
    await CacheService.del(`dashboard_overview_${userId}`);
    
    res.json({ 
      message: 'Streamer removed from tracking list',
      trackedStreamers: updatedStreamers.length
    });
  } catch (error) {
    console.error('Untrack streamer error:', error);
    res.status(500).json({ error: 'Failed to untrack streamer' });
  }
});

// Get tracked streamers details
router.get('/tracked-streamers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const trackedStreamers = user.preferences?.trackedStreamers || [];
    
    if (trackedStreamers.length === 0) {
      return res.json([]);
    }
    
    const streamers = await Streamer.findAll({
      where: {
        twitch_user_id: {
          [Op.in]: trackedStreamers
        }
      },
      include: [{
        model: ViewerMetrics,
        limit: 24, // Last 24 data points
        order: [['timestamp', 'DESC']]
      }],
      order: [['current_viewer_count', 'DESC']]
    });
    
    res.json(streamers);
  } catch (error) {
    console.error('Tracked streamers error:', error);
    res.status(500).json({ error: 'Failed to fetch tracked streamers' });
  }
});

// Get personalized recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const trackedStreamers = user.preferences?.trackedStreamers || [];
    
    // Get games played by tracked streamers
    let recommendedGames = [];
    if (trackedStreamers.length > 0) {
      const recentStreams = await StreamData.findAll({
        include: [
          {
            model: Streamer,
            where: {
              twitch_user_id: {
                [Op.in]: trackedStreamers
              }
            }
          },
          {
            model: Game,
            attributes: ['id', 'name', 'box_art_url', 'current_viewers']
          }
        ],
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        attributes: ['game_id'],
        group: ['game_id', 'Game.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('StreamData.id')), 'DESC']],
        limit: 10
      });
      
      recommendedGames = recentStreams.map(stream => stream.Game).filter(Boolean);
    }
    
    // Get trending streamers in similar categories
    const similarStreamers = await Streamer.findAll({
      where: {
        is_live: true,
        twitch_user_id: {
          [Op.notIn]: trackedStreamers.length > 0 ? trackedStreamers : ['dummy']
        }
      },
      order: [['current_viewer_count', 'DESC']],
      limit: 10
    });
    
    // Get viral clips
    const viralClips = await ClipData.findAll({
      where: {
        created_at_twitch: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        view_count: {
          [Op.gte]: 1000
        }
      },
      include: [{
        model: Streamer,
        attributes: ['display_name', 'login']
      }],
      order: [['view_count', 'DESC']],
      limit: 5
    });
    
    res.json({
      recommendedGames,
      similarStreamers,
      viralClips,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Get user analytics summary
router.get('/analytics-summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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
    
    const user = await User.findByPk(userId);
    const trackedStreamers = user.preferences?.trackedStreamers || [];
    
    let analytics = {
      totalViewTime: 0,
      streamsWatched: 0,
      avgViewersTracked: 0,
      topGames: [],
      activityByHour: {}
    };
    
    if (trackedStreamers.length > 0) {
      // Get stream data for tracked streamers
      const streamData = await StreamData.findAll({
        where: {
          user_id: userId,
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: Streamer,
            where: {
              twitch_user_id: {
                [Op.in]: trackedStreamers
              }
            }
          },
          {
            model: Game,
            attributes: ['name']
          }
        ]
      });
      
      analytics.streamsWatched = streamData.length;
      analytics.totalViewTime = streamData.reduce((sum, stream) => sum + (stream.duration_minutes || 0), 0);
      
      // Calculate top games
      const gameStats = {};
      streamData.forEach(stream => {
        const gameName = stream.Game?.name || 'Unknown';
        if (!gameStats[gameName]) {
          gameStats[gameName] = { count: 0, totalTime: 0 };
        }
        gameStats[gameName].count++;
        gameStats[gameName].totalTime += stream.duration_minutes || 0;
      });
      
      analytics.topGames = Object.entries(gameStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 5);
    }
    
    res.json(analytics);
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

module.exports = router;
