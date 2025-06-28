const express = require('express');
const router = express.Router();

// Get live streams
router.get('/live', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const gameId = req.query.gameId;
    const language = req.query.language;
    const twitchService = req.app.locals.twitchService;
    
    const params = { first: limit };
    if (gameId) params.game_id = gameId;
    if (language) params.language = language;
    
    const streams = await twitchService.getStreams(params);
    
    // Format for frontend
    const liveStreams = streams.map(stream => ({
      id: stream.id,
      streamerId: stream.user_id,
      title: stream.title,
      viewerCount: stream.viewer_count,
      gameName: stream.game_name,
      gameId: stream.game_id,
      language: stream.language,
      thumbnailUrl: stream.thumbnail_url?.replace('{width}', '320').replace('{height}', '180'),
      startedAt: stream.started_at,
      tags: stream.tag_ids || [],
      streamer: {
        id: stream.user_id,
        displayName: stream.user_name,
        loginName: stream.user_login,
        profileImageUrl: `https://static-cdn.jtvnw.net/jtv_user_pictures/${stream.user_login}-profile_image-70x70.png`
      }
    }));
    
    res.json(liveStreams);
  } catch (error) {
    console.error('Live streams fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch live streams' });
  }
});

module.exports = router;
