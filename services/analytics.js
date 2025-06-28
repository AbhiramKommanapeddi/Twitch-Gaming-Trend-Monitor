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
const sentiment = require('sentiment');

class AnalyticsService {
  constructor() {
    this.sentimentAnalyzer = new sentiment();
  }

  // Calculate trend score based on various factors
  calculateTrendScore(data) {
    const {
      currentViewers = 0,
      previousViewers = 0,
      growthRate = 0,
      channelCount = 0,
      timeOfDay = new Date().getHours()
    } = data;

    let score = 0;

    // Base score from viewer count (0-40 points)
    score += Math.min(currentViewers / 10000 * 40, 40);

    // Growth rate impact (0-30 points)
    if (growthRate > 0) {
      score += Math.min(growthRate / 100 * 30, 30);
    } else {
      score += Math.max(growthRate / 100 * 15, -15);
    }

    // Channel diversity bonus (0-20 points)
    if (channelCount > 0) {
      const avgViewersPerChannel = currentViewers / channelCount;
      if (avgViewersPerChannel < 1000) { // Many channels = healthy category
        score += Math.min(channelCount / 100 * 20, 20);
      }
    }

    // Time of day adjustment (0-10 points)
    const peakHours = [19, 20, 21, 22, 23]; // 7-11 PM
    if (peakHours.includes(timeOfDay)) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Calculate engagement score for streamers
  calculateEngagementScore(data) {
    const {
      viewers = 0,
      followers = 0,
      chatMessages = 0,
      chattersCount = 0,
      newFollowers = 0,
      streamDuration = 0
    } = data;

    let score = 0;

    // Chat engagement (0-40 points)
    if (viewers > 0) {
      const chatRatio = chattersCount / viewers;
      score += Math.min(chatRatio * 40, 40);
    }

    // Follow conversion rate (0-25 points)
    if (viewers > 0) {
      const followRate = newFollowers / viewers;
      score += Math.min(followRate * 1000 * 25, 25);
    }

    // Chat activity (0-25 points)
    if (streamDuration > 0) {
      const messagesPerMinute = chatMessages / (streamDuration / 60);
      score += Math.min(messagesPerMinute / 10 * 25, 25);
    }

    // Retention bonus (0-10 points)
    if (followers > 0) {
      const viewerToFollowerRatio = viewers / followers;
      if (viewerToFollowerRatio > 0.1) { // Good retention
        score += 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  // Analyze viewer migration patterns
  async getViewerMigrationPatterns(startDate, endDate) {
    try {
      // Get stream transitions (when viewers move between games/streamers)
      const migrations = await sequelize.query(`
        WITH stream_sessions AS (
          SELECT 
            user_id,
            game_id,
            streamer_id,
            started_at,
            ended_at,
            viewer_count,
            LAG(game_id) OVER (PARTITION BY user_id ORDER BY started_at) as prev_game_id,
            LAG(streamer_id) OVER (PARTITION BY user_id ORDER BY started_at) as prev_streamer_id,
            LAG(ended_at) OVER (PARTITION BY user_id ORDER BY started_at) as prev_ended_at
          FROM stream_data 
          WHERE started_at BETWEEN :startDate AND :endDate
            AND user_id IS NOT NULL
        )
        SELECT 
          g1.name as from_game,
          g2.name as to_game,
          COUNT(*) as migration_count,
          AVG(EXTRACT(EPOCH FROM (started_at - prev_ended_at))/60) as avg_gap_minutes
        FROM stream_sessions ss
        JOIN games g1 ON g1.id = ss.prev_game_id
        JOIN games g2 ON g2.id = ss.game_id
        WHERE prev_game_id IS NOT NULL 
          AND prev_game_id != game_id
          AND EXTRACT(EPOCH FROM (started_at - prev_ended_at)) < 3600
        GROUP BY g1.name, g2.name, g1.id, g2.id
        ORDER BY migration_count DESC
        LIMIT 50
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return {
        migrations,
        totalMigrations: migrations.reduce((sum, m) => sum + parseInt(m.migration_count), 0),
        avgGapTime: migrations.length > 0 
          ? migrations.reduce((sum, m) => sum + parseFloat(m.avg_gap_minutes), 0) / migrations.length 
          : 0
      };
    } catch (error) {
      console.error('Viewer migration analysis error:', error);
      throw error;
    }
  }

  // Predict clip virality
  async predictClipVirality(clipData) {
    const {
      view_count = 0,
      duration = 0,
      created_at_twitch,
      broadcaster_name,
      title = ''
    } = clipData;

    let viralityScore = 0;

    // View velocity (views per hour since creation)
    const hoursOld = (Date.now() - new Date(created_at_twitch)) / (1000 * 60 * 60);
    if (hoursOld > 0) {
      const viewVelocity = view_count / hoursOld;
      viralityScore += Math.min(viewVelocity / 100, 30); // 0-30 points
    }

    // Duration sweet spot (15-60 seconds optimal)
    if (duration >= 15 && duration <= 60) {
      viralityScore += 20;
    } else if (duration >= 10 && duration <= 90) {
      viralityScore += 10;
    }

    // Title analysis
    const viralKeywords = ['insane', 'crazy', 'epic', 'fail', 'wtf', 'omg', 'highlight'];
    const titleLower = title.toLowerCase();
    const keywordMatches = viralKeywords.filter(keyword => titleLower.includes(keyword));
    viralityScore += keywordMatches.length * 5; // 5 points per keyword, max 35

    // Streamer popularity factor
    const streamer = await Streamer.findOne({
      where: { login: broadcaster_name },
      attributes: ['follower_count', 'average_viewers']
    });

    if (streamer) {
      // Higher follower count = higher viral potential
      viralityScore += Math.min(streamer.follower_count / 100000 * 15, 15); // 0-15 points
    }

    return Math.max(0, Math.min(100, viralityScore));
  }

  // Analyze chat sentiment
  async analyzeChatSentiment(messages) {
    if (!messages || messages.length === 0) {
      return {
        overall: 0,
        positive: 0,
        negative: 0,
        neutral: 100
      };
    }

    let totalScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const message of messages) {
      const result = this.sentimentAnalyzer.analyze(message.text || '');
      totalScore += result.score;

      if (result.score > 0) {
        positiveCount++;
      } else if (result.score < 0) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    }

    const total = messages.length;
    return {
      overall: total > 0 ? totalScore / total : 0,
      positive: total > 0 ? (positiveCount / total) * 100 : 0,
      negative: total > 0 ? (negativeCount / total) * 100 : 0,
      neutral: total > 0 ? (neutralCount / total) * 100 : 0
    };
  }

  // Find optimal streaming schedule
  async getOptimalStreamingSchedule(streamerId, days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const scheduleData = await ViewerMetrics.findAll({
        where: {
          streamer_id: streamerId,
          timestamp: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM timestamp')), 'hour'],
          [sequelize.fn('EXTRACT', sequelize.literal('DOW FROM timestamp')), 'day_of_week'],
          [sequelize.fn('AVG', sequelize.col('viewer_count')), 'avg_viewers'],
          [sequelize.fn('AVG', sequelize.col('engagement_score')), 'avg_engagement'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'data_points']
        ],
        group: ['hour', 'day_of_week'],
        having: sequelize.literal('COUNT(id) >= 3'), // At least 3 data points
        order: [['avg_viewers', 'DESC']]
      });

      // Process into recommendations
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const recommendations = {};

      for (const data of scheduleData) {
        const dayName = dayNames[parseInt(data.dataValues.day_of_week)];
        const hour = parseInt(data.dataValues.hour);
        
        if (!recommendations[dayName]) {
          recommendations[dayName] = [];
        }
        
        recommendations[dayName].push({
          hour,
          avgViewers: parseFloat(data.dataValues.avg_viewers),
          avgEngagement: parseFloat(data.dataValues.avg_engagement),
          dataPoints: parseInt(data.dataValues.data_points)
        });
      }

      // Sort each day's hours by viewer count
      for (const day in recommendations) {
        recommendations[day].sort((a, b) => b.avgViewers - a.avgViewers);
      }

      return recommendations;
    } catch (error) {
      console.error('Optimal schedule analysis error:', error);
      throw error;
    }
  }

  // Calculate game category growth
  async calculateCategoryGrowth(gameId, days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const trendData = await GameTrend.findAll({
        where: {
          game_id: gameId,
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['created_at', 'ASC']]
      });

      if (trendData.length < 2) {
        return { growth: 0, trend: 'stable', confidence: 'low' };
      }

      const firstPoint = trendData[0];
      const lastPoint = trendData[trendData.length - 1];
      
      const viewerGrowth = ((lastPoint.viewer_count - firstPoint.viewer_count) / firstPoint.viewer_count) * 100;
      const channelGrowth = ((lastPoint.channel_count - firstPoint.channel_count) / firstPoint.channel_count) * 100;
      
      let trend = 'stable';
      if (viewerGrowth > 20) trend = 'rising';
      else if (viewerGrowth < -20) trend = 'declining';
      
      let confidence = 'low';
      if (trendData.length > 168) confidence = 'high'; // 7 days of hourly data
      else if (trendData.length > 48) confidence = 'medium'; // 2 days of hourly data

      return {
        viewerGrowth,
        channelGrowth,
        trend,
        confidence,
        dataPoints: trendData.length
      };
    } catch (error) {
      console.error('Category growth calculation error:', error);
      throw error;
    }
  }

  // Find sponsorship opportunities
  async findSponsorshipOpportunities(criteria = {}) {
    try {
      const {
        minViewers = 1000,
        maxViewers = 50000,
        categories = [],
        engagement_threshold = 60
      } = criteria;

      let whereClause = {
        current_viewer_count: {
          [Op.between]: [minViewers, maxViewers]
        },
        is_live: true
      };

      if (categories.length > 0) {
        whereClause.current_game_id = {
          [Op.in]: categories
        };
      }

      const opportunities = await Streamer.findAll({
        where: whereClause,
        include: [
          {
            model: ViewerMetrics,
            limit: 10,
            order: [['timestamp', 'DESC']],
            required: true
          },
          {
            model: StreamData,
            limit: 5,
            order: [['created_at', 'DESC']]
          }
        ],
        order: [['current_viewer_count', 'DESC']]
      });

      // Calculate sponsorship scores
      const scoredOpportunities = opportunities.map(streamer => {
        const recentMetrics = streamer.ViewerMetrics;
        const avgEngagement = recentMetrics.length > 0 
          ? recentMetrics.reduce((sum, m) => sum + m.engagement_score, 0) / recentMetrics.length 
          : 0;

        const sponsorshipScore = this.calculateSponsorshipValue({
          viewers: streamer.current_viewer_count,
          followers: streamer.follower_count,
          engagement: avgEngagement,
          consistency: recentMetrics.length
        });

        return {
          ...streamer.toJSON(),
          sponsorshipScore,
          avgEngagement
        };
      });

      return scoredOpportunities
        .filter(s => s.avgEngagement >= engagement_threshold)
        .sort((a, b) => b.sponsorshipScore - a.sponsorshipScore);
    } catch (error) {
      console.error('Sponsorship opportunity analysis error:', error);
      throw error;
    }
  }

  // Calculate sponsorship value
  calculateSponsorshipValue(data) {
    const {
      viewers = 0,
      followers = 0,
      engagement = 0,
      consistency = 0
    } = data;

    let score = 0;

    // Audience size (0-40 points)
    score += Math.min(viewers / 1000 * 10, 40);

    // Engagement rate (0-35 points)
    score += Math.min(engagement / 100 * 35, 35);

    // Growth potential (0-15 points)
    if (followers > 0) {
      const viewerToFollowerRatio = viewers / followers;
      score += Math.min(viewerToFollowerRatio * 100 * 15, 15);
    }

    // Consistency (0-10 points)
    score += Math.min(consistency * 2, 10);

    return Math.max(0, Math.min(100, score));
  }

  // Performance comparison
  async compareStreamersPerformance(streamerIds, period = '7d') {
    try {
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

      const comparison = await ViewerMetrics.findAll({
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
          [sequelize.fn('SUM', sequelize.col('new_followers')), 'total_new_followers'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'data_points']
        ],
        group: ['streamer_id'],
        include: [{
          model: Streamer,
          attributes: ['display_name', 'login']
        }]
      });

      return comparison.map(result => ({
        streamer: result.Streamer,
        metrics: {
          avgViewers: parseFloat(result.dataValues.avg_viewers),
          peakViewers: parseInt(result.dataValues.peak_viewers),
          avgEngagement: parseFloat(result.dataValues.avg_engagement),
          totalNewFollowers: parseInt(result.dataValues.total_new_followers),
          dataPoints: parseInt(result.dataValues.data_points)
        }
      }));
    } catch (error) {
      console.error('Performance comparison error:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
