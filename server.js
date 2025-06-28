const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const RedisStore = require('connect-redis');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { sequelize } = require('./models');
const redisClient = require('./config/redis');
const WebSocketManager = require('./services/websocket');
const cronJobs = require('./services/cron');
const TwitchService = require('./services/twitch');
const websocketService = require('./services/websocket');

// Import routes
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const streamerRoutes = require('./routes/streamers');
const analyticsRoutes = require('./routes/analytics');
const dashboardRoutes = require('./routes/dashboard');
const streamsRoutes = require('./routes/streams');

const app = express();
const server = http.createServer(app);

// WebSocket setup
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Initialize WebSocket manager
const wsManager = new WebSocketManager(io);

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
let sessionStore;
try {
  sessionStore = new RedisStore({ 
    client: redisClient,
    prefix: 'twitch-app:'
  });
} catch (error) {
  console.warn('Redis not available, using memory store for sessions:', error.message);
  sessionStore = undefined; // Will use default memory store
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/streamers', streamerRoutes);
app.use('/api/streams', streamsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

// Initialize services
const twitchService = new TwitchService();

async function initializeServices() {
  try {
    console.log('Initializing services...');
    await twitchService.initialize();
    console.log('TwitchService initialized successfully');
    
    // Make services available to routes
    app.locals.twitchService = twitchService;
    
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Database connection and server startup
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    await sequelize.sync({ force: false });
    console.log('Database synchronized');
    
    // Start cron jobs
    cronJobs.startAll();
    
    await initializeServices();
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    // Initialize WebSocket
    websocketService.init(server);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
