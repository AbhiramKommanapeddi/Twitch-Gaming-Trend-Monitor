const sequelize = require('../config/database');
const User = require('./User');
const Game = require('./Game');
const Streamer = require('./Streamer');
const StreamData = require('./StreamData');
const GameTrend = require('./GameTrend');
const ViewerMetrics = require('./ViewerMetrics');
const ChatAnalytics = require('./ChatAnalytics');
const ClipData = require('./ClipData');

// Define associations
User.hasMany(StreamData, { foreignKey: 'user_id' });
StreamData.belongsTo(User, { foreignKey: 'user_id' });

Game.hasMany(StreamData, { foreignKey: 'game_id' });
StreamData.belongsTo(Game, { foreignKey: 'game_id' });

Game.hasMany(GameTrend, { foreignKey: 'game_id' });
GameTrend.belongsTo(Game, { foreignKey: 'game_id' });

Streamer.hasMany(StreamData, { foreignKey: 'streamer_id' });
StreamData.belongsTo(Streamer, { foreignKey: 'streamer_id' });

Streamer.hasMany(ViewerMetrics, { foreignKey: 'streamer_id' });
ViewerMetrics.belongsTo(Streamer, { foreignKey: 'streamer_id' });

StreamData.hasMany(ChatAnalytics, { foreignKey: 'stream_data_id' });
ChatAnalytics.belongsTo(StreamData, { foreignKey: 'stream_data_id' });

Streamer.hasMany(ClipData, { foreignKey: 'streamer_id' });
ClipData.belongsTo(Streamer, { foreignKey: 'streamer_id' });

module.exports = {
  sequelize,
  User,
  Game,
  Streamer,
  StreamData,
  GameTrend,
  ViewerMetrics,
  ChatAnalytics,
  ClipData
};
