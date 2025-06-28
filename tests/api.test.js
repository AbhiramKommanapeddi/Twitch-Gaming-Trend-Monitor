const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/models');

describe('Games API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/games/top', () => {
    it('should return top games', async () => {
      const response = await request(app)
        .get('/api/games/top')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const limit = 5;
      const response = await request(app)
        .get(`/api/games/top?limit=${limit}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('GET /api/games/trending', () => {
    it('should return trending games', async () => {
      const response = await request(app)
        .get('/api/games/trending')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('rank');
        expect(response.body[0]).toHaveProperty('viewers');
      }
    });
  });

  describe('GET /api/games/:gameId', () => {
    it('should return 404 for non-existent game', async () => {
      await request(app)
        .get('/api/games/999999')
        .expect(404);
    });
  });
});

describe('Streamers API', () => {
  describe('GET /api/streamers/top', () => {
    it('should return top streamers', async () => {
      const response = await request(app)
        .get('/api/streamers/top')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

describe('Streams API', () => {
  describe('GET /api/streams/live', () => {
    it('should return live streams', async () => {
      const response = await request(app)
        .get('/api/streams/live')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by game', async () => {
      const gameId = '12345';
      const response = await request(app)
        .get(`/api/streams/live?gameId=${gameId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

describe('Analytics API', () => {
  describe('GET /api/analytics/overview', () => {
    it('should return analytics overview', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      expect(response.body).toHaveProperty('totalViewers');
      expect(response.body).toHaveProperty('totalGames');
    });
  });
});

describe('Health Check', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
