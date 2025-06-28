const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  twitch_game_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  box_art_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  igdb_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  is_trending: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  trending_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  current_viewers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  current_channels: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  peak_viewers_today: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'games',
  indexes: [
    {
      unique: true,
      fields: ['twitch_game_id']
    },
    {
      fields: ['name']
    },
    {
      fields: ['is_trending']
    },
    {
      fields: ['trending_score']
    }
  ]
});

module.exports = Game;
