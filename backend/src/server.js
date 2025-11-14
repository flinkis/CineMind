import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import userLikeRoutes from './routes/userLike.js';
import userDislikeRoutes from './routes/userDislike.js';
import tmdbRoutes from './routes/tmdb.js';
import rssRoutes from './routes/rss.js';
import searchRoutes from './routes/search.js';
import tvSearchRoutes from './routes/tvSearch.js';
import recommendationsRoutes from './routes/recommendations.js';
import movieDetailsRoutes from './routes/movieDetails.js';
import tvDetailsRoutes from './routes/tvDetails.js';
import personDetailsRoutes from './routes/personDetails.js';
import discoverRoutes from './routes/discover.js';
import tvDiscoverRoutes from './routes/tvDiscover.js';
import radarrRoutes from './routes/radarr.js';
import sonarrRoutes from './routes/sonarr.js';
import { startScheduler } from './services/scheduler.js';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Background scheduler configuration
const REFRESH_INTERVAL_HOURS = parseInt(process.env.REFRESH_INTERVAL_HOURS) || 24;
const REFRESH_INITIAL_DELAY_MINUTES = parseInt(process.env.REFRESH_INITIAL_DELAY_MINUTES) || 5;
const ENABLE_AUTO_REFRESH = process.env.ENABLE_AUTO_REFRESH !== 'false'; // Default to true

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CineMind API is running' });
});

// API Routes
app.use('/api/dev/user_like', userLikeRoutes);
app.use('/api/dev/user_dislike', userDislikeRoutes);
app.use('/api/dev/refresh_tmdb', tmdbRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/search', tvSearchRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/movies', movieDetailsRoutes);
app.use('/api/tv', tvDetailsRoutes);
app.use('/api/persons', personDetailsRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/discover', tvDiscoverRoutes);
app.use('/api/radarr', radarrRoutes);
app.use('/api/sonarr', sonarrRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CineMind backend server running on http://localhost:${PORT}`);
  
  // Start background scheduler if enabled
  if (ENABLE_AUTO_REFRESH) {
    startScheduler({
      intervalHours: REFRESH_INTERVAL_HOURS,
      initialDelayMinutes: REFRESH_INITIAL_DELAY_MINUTES,
    });
  } else {
    console.log('⚠️  Auto-refresh scheduler is disabled (set ENABLE_AUTO_REFRESH=true to enable)');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { app, prisma };

