const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  twitch_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profile_image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['twitch_id']
    },
    {
      fields: ['username']
    }
  ]
});

module.exports = User;
