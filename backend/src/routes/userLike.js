import express from 'express';
import { prisma } from '../server.js';
import { getMovieDetails, formatMovieData } from '../services/tmdb.js';
import {
  computeMovieEmbedding,
  stringifyEmbedding,
} from '../services/embeddings.js';
import { clearNormalizationCache } from '../services/matchScore.js';
import { validateTmdbIdBody, validateTmdbId } from '../middleware/validation.js';

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
router.post('/', validateTmdbIdBody, async (req, res, next) => {
  try {
    const tmdbId = req.validatedTmdbId;

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

    // Fetch movie details from TMDB (includes credits, keywords, etc.)
    const tmdbMovie = await getMovieDetails(tmdbId);
    const movieData = formatMovieData(tmdbMovie);

    // Compute embedding with full TMDB data for richer representation
    const embedding = await computeMovieEmbedding(movieData, tmdbMovie);
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

    // Clear normalization cache when user preferences change
    clearNormalizationCache();

    res.json({
      message: 'Movie added to liked list',
      movie: userLike,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/dev/user_like/:tmdbId
 * Remove a liked movie from the user's preferences
 * 
 * Params: { tmdbId: number }
 * 
 * This endpoint:
 * 1. Deletes the movie from the user's liked list
 */
router.delete('/:tmdbId', validateTmdbId, async (req, res, next) => {
  try {
    const tmdbId = req.validatedTmdbId;

    // Check if movie is liked
    const existingLike = await prisma.userLike.findUnique({
      where: { tmdbId },
    });

    if (!existingLike) {
      return res.status(404).json({ error: 'Movie not found in liked list' });
    }

    // Delete from database
    await prisma.userLike.delete({
      where: { tmdbId },
    });

    // Clear normalization cache when user preferences change
    clearNormalizationCache();

    res.json({
      message: 'Movie removed from liked list',
      tmdbId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dev/user_like
 * Get all liked movies
 * 
 * Returns: Array of liked movies
 */
router.get('/', async (req, res, next) => {
  try {
    const likedMovies = await prisma.userLike.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      movies: likedMovies,
      count: likedMovies.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

