const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StreamData = sequelize.define('StreamData', {
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
  game_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'games',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  stream_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  viewer_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_mature: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  chat_messages_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unique_chatters: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followers_gained: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  subscribers_gained: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bits_received: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  donations_received: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  raid_viewers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  host_viewers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  average_framerate: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  resolution: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bitrate: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  stream_quality_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  engagement_rate: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  retention_rate: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  peak_viewers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'stream_data',
  indexes: [
    {
      fields: ['streamer_id']
    },
    {
      fields: ['game_id']
    },
    {
      fields: ['started_at']
    },
    {
      fields: ['viewer_count']
    },
    {
      fields: ['duration_minutes']
    }
  ]
});

module.exports = StreamData;
