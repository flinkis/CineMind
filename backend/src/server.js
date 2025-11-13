import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import userLikeRoutes from './routes/userLike.js';
import userDislikeRoutes from './routes/userDislike.js';
import tmdbRoutes from './routes/tmdb.js';
import rssRoutes from './routes/rss.js';
import searchRoutes from './routes/search.js';
import recommendationsRoutes from './routes/recommendations.js';
import movieDetailsRoutes from './routes/movieDetails.js';
import personDetailsRoutes from './routes/personDetails.js';
import discoverRoutes from './routes/discover.js';
import radarrRoutes from './routes/radarr.js';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

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
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/movies', movieDetailsRoutes);
app.use('/api/persons', personDetailsRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/radarr', radarrRoutes);

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
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { app, prisma };

