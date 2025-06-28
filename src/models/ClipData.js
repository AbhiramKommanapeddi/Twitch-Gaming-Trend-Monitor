const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClipData = sequelize.define('ClipData', {
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
  clip_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  embed_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  broadcaster_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  creator_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  video_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  game_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  duration: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at_twitch: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  virality_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  engagement_rate: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  shares_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  comments_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  trending_rank: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  sentiment_analysis: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  predicted_viral_potential: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  sponsorship_value: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
}, {
  tableName: 'clip_data',
  indexes: [
    {
      unique: true,
      fields: ['clip_id']
    },
    {
      fields: ['streamer_id']
    },
    {
      fields: ['view_count']
    },
    {
      fields: ['virality_score']
    },
    {
      fields: ['created_at_twitch']
    }
  ]
});

module.exports = ClipData;
