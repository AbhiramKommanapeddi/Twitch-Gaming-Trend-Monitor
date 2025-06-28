const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Streamer = sequelize.define('Streamer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  twitch_user_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  login: {
    type: DataTypes.STRING,
    allowNull: false
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profile_image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  offline_image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  view_count: {
    type: DataTypes.BIGINT,
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
  is_live: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  current_game_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  current_title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  current_viewer_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true
  },
  created_at_twitch: {
    type: DataTypes.DATE,
    allowNull: true
  },
  stream_category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  average_viewers: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  peak_viewers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_stream_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_partner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_affiliate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  social_media: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  schedule: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  analytics_data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'streamers',
  indexes: [
    {
      unique: true,
      fields: ['twitch_user_id']
    },
    {
      fields: ['login']
    },
    {
      fields: ['is_live']
    },
    {
      fields: ['current_viewer_count']
    },
    {
      fields: ['follower_count']
    }
  ]
});

module.exports = Streamer;
