import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import userLikeRoutes from './routes/userLike.js';
import tmdbRoutes from './routes/tmdb.js';
import rssRoutes from './routes/rss.js';
import searchRoutes from './routes/search.js';

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
app.use('/api/dev/refresh_tmdb', tmdbRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/search', searchRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
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

