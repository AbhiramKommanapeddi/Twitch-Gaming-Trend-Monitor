const express = require('express');
const { Game, GameTrend, StreamData } = require('../models');
const { Op } = require('sequelize');
const TwitchService = require('../services/twitch');
const CacheService = require('../services/cache');
const router = express.Router();

// Get top games
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const twitchService = req.app.locals.twitchService;
    
    // Fetch from Twitch API with caching
    const topGames = await twitchService.getTopGames(limit);
    
    res.json(topGames);
  } catch (error) {
    console.error('Top games fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch top games' });
  }
});

// Get game trends
router.get('/:gameId/trends', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { period = '24h' } = req.query;
    
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
    
    const trends = await GameTrend.findAll({
      where: {
        game_id: gameId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['created_at', 'ASC']],
      include: [{
        model: Game,
        attributes: ['name', 'box_art_url']
      }]
    });
    
    res.json(trends);
  } catch (error) {
    console.error('Game trends fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch game trends' });
  }
});

// Get game details
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const cacheKey = `game_details_${gameId}`;
    
    let game = await CacheService.get(cacheKey);
    
    if (!game) {
      game = await Game.findOne({
        where: { twitch_game_id: gameId },
        include: [{
          model: GameTrend,
          limit: 24,
          order: [['created_at', 'DESC']]
        }]
      });
      
      if (!game) {
        // Fetch from Twitch API if not in database
        const twitchGame = await TwitchService.getGameById(gameId);
        if (twitchGame) {
          game = await Game.create({
            twitch_game_id: twitchGame.id,
            name: twitchGame.name,
            box_art_url: twitchGame.box_art_url
          });
        }
      }
      
      // Cache for 10 minutes
      await CacheService.set(cacheKey, game, 600);
    }
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('Game details fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

// Get trending games
router.get('/trending/now', async (req, res) => {
  try {
    const cacheKey = 'trending_games';
    
    let trendingGames = await CacheService.get(cacheKey);
    
    if (!trendingGames) {
      trendingGames = await Game.findAll({
        where: { is_trending: true },
        order: [['trending_score', 'DESC']],
        limit: 10,
        include: [{
          model: GameTrend,
          limit: 1,
          order: [['created_at', 'DESC']]
        }]
      });
      
      // Cache for 5 minutes
      await CacheService.set(cacheKey, trendingGames, 300);
    }
    
    res.json(trendingGames);
  } catch (error) {
    console.error('Trending games fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch trending games' });
  }
});

// Get trending games
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const twitchService = req.app.locals.twitchService;
    
    // Get top games and add trending indicators
    const topGames = await twitchService.getTopGames(limit);
    
    // Add trending data from database
    const trendingGames = await Promise.all(
      topGames.map(async (game, index) => {
        const dbGame = await Game.findOne({ where: { twitchId: game.id } });
        const recentTrends = await GameTrend.findAll({
          where: { 
            gameId: dbGame?.id,
            timestamp: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          order: [['timestamp', 'DESC']],
          limit: 2
        });

        const growthRate = recentTrends.length >= 2 
          ? ((recentTrends[0].viewerCount - recentTrends[1].viewerCount) / recentTrends[1].viewerCount * 100)
          : 0;

        return {
          id: game.id,
          name: game.name,
          boxArtUrl: game.box_art_url,
          rank: index + 1,
          growthRate: Math.round(growthRate * 100) / 100,
          viewers: recentTrends[0]?.viewerCount || 0,
          streamers: recentTrends[0]?.streamerCount || 0
        };
      })
    );
    
    res.json(trendingGames);
  } catch (error) {
    console.error('Trending games fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch trending games' });
  }
});

// Search games
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const games = await Game.findAll({
      where: {
        name: {
          [Op.iLike]: `%${query}%`
        }
      },
      limit,
      order: [['current_viewers', 'DESC']]
    });
    
    res.json(games);
  } catch (error) {
    console.error('Game search error:', error);
    res.status(500).json({ error: 'Failed to search games' });
  }
});

// Get game analytics
router.get('/:gameId/analytics', async (req, res) => {
  try {
    const { gameId } = req.params;
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
    
    const analytics = await StreamData.findAll({
      where: {
        game_id: gameId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('viewer_count')), 'avg_viewers'],
        [sequelize.fn('MAX', sequelize.col('viewer_count')), 'peak_viewers'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'stream_count'],
        [sequelize.fn('AVG', sequelize.col('duration_minutes')), 'avg_duration']
      ]
    });
    
    res.json(analytics[0]);
  } catch (error) {
    console.error('Game analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch game analytics' });
  }
});

module.exports = router;
