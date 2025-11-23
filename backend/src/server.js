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
import { rateLimitGeneral } from './middleware/rateLimit.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
function validateEnvironment() {
  const required = ['TMDB_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env file');
    process.exit(1);
  }

  // Warn about optional but recommended variables
  if (!process.env.API_TOKEN) {
    console.warn('⚠️  WARNING: API_TOKEN not set. Protected endpoints will be unavailable.');
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not set. Embeddings will not work.');
  }
}

// Validate environment on startup
validateEnvironment();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Background scheduler configuration
const REFRESH_INTERVAL_HOURS = parseInt(process.env.REFRESH_INTERVAL_HOURS) || 24;
const REFRESH_INITIAL_DELAY_MINUTES = parseInt(process.env.REFRESH_INITIAL_DELAY_MINUTES) || 5;
const ENABLE_AUTO_REFRESH = process.env.ENABLE_AUTO_REFRESH !== 'false'; // Default to true

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all origins (common practice for dev environments)
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, check CORS_ORIGINS environment variable
    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
      : [];

    // In production, require CORS_ORIGINS to be set and origin to be in the list
    // In development, allow all origins (already handled above)
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.length === 0) {
        // If CORS_ORIGINS is not configured in production, reject all origins
        return callback(new Error('CORS_ORIGINS must be configured in production'));
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Development mode - already handled above, but this is a safety fallback
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Apply general rate limiting to all routes
app.use('/api', rateLimitGeneral);

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

