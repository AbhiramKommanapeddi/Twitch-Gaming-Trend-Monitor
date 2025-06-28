const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameTrend = sequelize.define('GameTrend', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  game_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'games',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hour: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 23
    }
  },
  viewer_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  channel_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  average_viewers_per_channel: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  peak_viewers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  growth_rate_hourly: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  growth_rate_daily: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  trend_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  rank_position: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rank_change: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_trending_up: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_trending_down: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  new_streamers_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  returning_streamers_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'game_trends',
  indexes: [
    {
      unique: true,
      fields: ['game_id', 'date', 'hour']
    },
    {
      fields: ['date']
    },
    {
      fields: ['trend_score']
    },
    {
      fields: ['rank_position']
    },
    {
      fields: ['is_trending_up']
    }
  ]
});

module.exports = GameTrend;
