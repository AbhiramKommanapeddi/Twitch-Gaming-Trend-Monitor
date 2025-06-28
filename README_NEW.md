# 🎮 Twitch Gaming Trend Monitor

A comprehensive full-stack platform for tracking Twitch gaming trends, streamer analytics, and viewer behavior patterns in real-time.

## ✨ Features

### 🚀 Core Features

- **Real-time Gaming Trends** - Track what games are trending on Twitch
- **Streamer Analytics** - Analyze viewer patterns and growth metrics
- **Live Stream Monitoring** - Monitor active streams and viewer counts
- **Interactive Dashboards** - Personalized insights and analytics
- **WebSocket Updates** - Real-time data updates without page refresh

### 📊 Analytics Features

- **Game Trend Analysis** - Growth patterns, viewer migration, category optimization
- **Streamer Performance** - Retention analysis, growth projections, audience insights
- **Community Insights** - Chat sentiment, emote trends, raid/host networks
- **Viewer Behavior** - Peak hours, language distribution, engagement metrics

### 🎯 Advanced Features

- **OAuth Integration** - Secure Twitch authentication
- **Caching System** - Redis-powered API response caching
- **Rate Limiting** - API protection and optimization
- **Responsive Design** - Mobile-first, gamer-friendly UI
- **Real-time Notifications** - WebSocket-powered live updates

## 🏗️ Architecture

### Backend (Node.js/Express)

- **RESTful API** with comprehensive endpoints
- **WebSocket** real-time communication
- **PostgreSQL** database with Sequelize ORM
- **Redis** caching and session management
- **Twitch API** integration with rate limiting
- **JWT** authentication and authorization

### Frontend (React)

- **Modern React** with hooks and context
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **React Query** for data fetching and caching
- **Socket.IO** for real-time updates
- **React Router** for navigation

### Database Schema

- **Users** - User accounts and preferences
- **Games** - Game information and metadata
- **Streamers** - Streamer profiles and statistics
- **Streams** - Live and historical stream data
- **Analytics** - Trend data and viewer metrics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database
- Redis server
- Twitch Developer Account

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/twitch-gaming-trend-monitor.git
   cd twitch-gaming-trend-monitor
   ```

2. **Run setup script:**

   ```bash
   npm run setup
   ```

3. **Configure environment variables:**

   ```bash
   # Copy example environment file
   cp backend/.env.example backend/.env

   # Edit with your credentials
   nano backend/.env
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

The application will be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/twitch_trends

# Redis
REDIS_URL=redis://localhost:6379

# Twitch API
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# Authentication
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Database Setup

1. **Create PostgreSQL database:**

   ```sql
   CREATE DATABASE twitch_trends;
   ```

2. **Run migrations:**
   ```bash
   cd backend
   npm run migrate
   ```

## 📖 API Documentation

### Authentication

```http
POST /api/auth/twitch          # Twitch OAuth login
GET  /api/auth/profile         # Get user profile
POST /api/auth/logout          # Logout user
```

### Games

```http
GET  /api/games/top            # Top games by viewers
GET  /api/games/trending       # Trending games with growth
GET  /api/games/:id            # Game details and analytics
GET  /api/games/:id/stats      # Game statistics over time
GET  /api/games/:id/streamers  # Top streamers for game
```

### Streamers

```http
GET  /api/streamers/top        # Top streamers by viewers
GET  /api/streamers/:id        # Streamer profile and stats
GET  /api/streamers/:id/stats  # Streamer analytics
GET  /api/streamers/:id/clips  # Top clips
```

### Streams

```http
GET  /api/streams/live         # Live streams with filters
```

### Analytics

```http
GET  /api/analytics/overview   # Platform overview stats
GET  /api/analytics            # Comprehensive analytics
```

## 🔌 WebSocket Events

### Client → Server

```javascript
// Subscribe to real-time updates
socket.emit("subscribeToGame", gameId);
socket.emit("subscribeToStreamer", streamerId);
```

### Server → Client

```javascript
// Real-time data updates
socket.on("gameUpdate", (data) => {
  /* Game viewer/streamer updates */
});
socket.on("streamerUpdate", (data) => {
  /* Streamer status changes */
});
socket.on("trendAlert", (data) => {
  /* Trending notifications */
});
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Run All Tests

```bash
npm test
```

## 🚀 Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for comprehensive deployment instructions including:

- Traditional VPS deployment
- Docker containerization
- Heroku deployment
- AWS deployment options
- SSL setup and security

## 🎯 Performance Optimization

### Caching Strategy

- **Redis** for API responses (2-5 minute TTL)
- **Browser caching** for static assets
- **Query optimization** with database indexing

### API Rate Limiting

- **Twitch API** - 800 requests per minute
- **Internal API** - 100 requests per minute per IP
- **Exponential backoff** for failed requests

### Real-time Updates

- **WebSocket clustering** for horizontal scaling
- **Event batching** to reduce message frequency
- **Selective subscriptions** to minimize bandwidth

## 🔐 Security

### Authentication & Authorization

- **JWT tokens** with secure secret rotation
- **Twitch OAuth 2.0** integration
- **Session management** with Redis

### API Security

- **Rate limiting** per endpoint
- **CORS** configuration
- **Input validation** and sanitization
- **SQL injection** protection via Sequelize

### Data Protection

- **Environment variables** for secrets
- **HTTPS** enforcement in production
- **Database encryption** for sensitive data

## 📊 Monitoring & Analytics

### Application Metrics

- **Response times** and throughput
- **Error rates** and debugging info
- **WebSocket** connection statistics
- **Database** query performance

### Business Metrics

- **API usage** patterns
- **User engagement** analytics
- **Feature adoption** tracking
- **Growth metrics** and KPIs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Use meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- [API Reference](docs/API_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

### Getting Help

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/twitch-gaming-trend-monitor/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-username/twitch-gaming-trend-monitor/discussions)
- 📧 **Email**: support@twitchtrends.com

## 🎖️ Acknowledgments

- **Twitch** for providing the comprehensive API
- **Chart.js** for beautiful data visualizations
- **Socket.IO** for real-time communication
- **Tailwind CSS** for the design system
- **PostgreSQL** and **Redis** for data infrastructure

## 📈 Roadmap

### Upcoming Features

- [ ] **Mobile App** (React Native)
- [ ] **Advanced ML Analytics** (Python/TensorFlow)
- [ ] **Multi-platform Support** (YouTube, Facebook Gaming)
- [ ] **API Rate Optimization** (Predictive caching)
- [ ] **Advanced Notifications** (Email, SMS, Push)

### Performance Improvements

- [ ] **Database Sharding** for scale
- [ ] **CDN Integration** for global performance
- [ ] **GraphQL API** for efficient data fetching
- [ ] **Microservices Architecture** for modularity

---

**Built with ❤️ for the gaming community**

_Last updated: December 2024_
