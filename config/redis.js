const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  retry: {
    attempts: 10,
    delay: (attempt) => Math.min(attempt * 100, 3000)
  }
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

client.on('ready', () => {
  console.log('✅ Redis client ready');
});

client.on('error', (err) => {
  console.warn('⚠️  Redis client error (will use memory store for sessions):', err.message);
});

client.on('end', () => {
  console.log('Redis connection ended');
});

// Connect to Redis with error handling
const connectRedis = async () => {
  try {
    await client.connect();
    console.log('✅ Connected to Redis');
  } catch (error) {
    console.warn('⚠️  Redis connection failed (will use memory store for sessions):', error.message);
  }
};

connectRedis();

module.exports = client;
