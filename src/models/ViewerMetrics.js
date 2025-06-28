const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ViewerMetrics = sequelize.define('ViewerMetrics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  streamer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'streamers',
      key: 'id'
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  viewer_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  follower_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  subscriber_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  chat_activity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  new_followers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  new_subscribers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bits_received: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  donations_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  donations_amount: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  raid_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  raid_viewers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  host_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  host_viewers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clips_created: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  viewer_retention_rate: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  engagement_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  stream_uptime_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  game_category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stream_title: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'viewer_metrics',
  indexes: [
    {
      fields: ['streamer_id']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['viewer_count']
    },
    {
      fields: ['engagement_score']
    }
  ]
});

module.exports = ViewerMetrics;
