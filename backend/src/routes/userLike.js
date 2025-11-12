import express from 'express';
import { prisma } from '../server.js';
import { getMovieDetails, formatMovieData } from '../services/tmdb.js';
import {
  computeMovieEmbedding,
  stringifyEmbedding,
} from '../services/embeddings.js';

const router = express.Router();

/**
 * POST /api/dev/user_like
 * Add a liked movie to the user's preferences
 * 
 * Body: { tmdbId: number }
 * 
 * This endpoint:
 * 1. Fetches movie details from TMDB
 * 2. Computes embedding for the movie
 * 3. Stores the movie and embedding in the database
 */
router.post('/', async (req, res, next) => {
  try {
    const { tmdbId } = req.body;

    if (!tmdbId) {
      return res.status(400).json({ error: 'tmdbId is required' });
    }

    // Check if movie is already liked
    const existingLike = await prisma.userLike.findUnique({
      where: { tmdbId },
    });

    if (existingLike) {
      return res.json({
        message: 'Movie already in liked list',
        movie: existingLike,
      });
    }

    // Fetch movie details from TMDB
    const tmdbMovie = await getMovieDetails(tmdbId);
    const movieData = formatMovieData(tmdbMovie);

    // Compute embedding
    const embedding = await computeMovieEmbedding(movieData);
    const embeddingString = stringifyEmbedding(embedding);

    // Store in database
    const userLike = await prisma.userLike.create({
      data: {
        tmdbId: movieData.tmdbId,
        title: movieData.title,
        overview: movieData.overview,
        posterPath: movieData.posterPath,
        releaseDate: movieData.releaseDate,
        embedding: embeddingString,
      },
    });

    res.json({
      message: 'Movie added to liked list',
      movie: userLike,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

