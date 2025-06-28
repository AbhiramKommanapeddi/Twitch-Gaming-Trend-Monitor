const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatAnalytics = sequelize.define('ChatAnalytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  stream_data_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stream_data',
      key: 'id'
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  total_messages: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unique_chatters: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  messages_per_minute: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  average_message_length: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  sentiment_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  positive_sentiment_ratio: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  negative_sentiment_ratio: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  neutral_sentiment_ratio: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  top_emotes: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  emote_usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  subscriber_messages: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  moderator_actions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  banned_users: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  timed_out_users: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  deleted_messages: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  spam_messages: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  command_usage: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  questions_asked: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  links_shared: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  caps_usage_ratio: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  language_distribution: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  interaction_keywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  trending_topics: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'chat_analytics',
  indexes: [
    {
      fields: ['stream_data_id']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['sentiment_score']
    },
    {
      fields: ['messages_per_minute']
    }
  ]
});

module.exports = ChatAnalytics;
