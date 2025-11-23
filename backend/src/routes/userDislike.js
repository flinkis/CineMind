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
 * POST /api/dev/user_dislike
 * Add a disliked movie to the user's preferences
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

    // Check if movie is already disliked
    const existingDislike = await prisma.userDislike.findUnique({
      where: { tmdbId },
    });

    if (existingDislike) {
      return res.json({
        message: 'Movie already in disliked list',
        movie: existingDislike,
      });
    }

    // Also check if it's in likes - if so, remove it
    const existingLike = await prisma.userLike.findUnique({
      where: { tmdbId },
    });

    if (existingLike) {
      await prisma.userLike.delete({
        where: { tmdbId },
      });
    }

    // Fetch movie details from TMDB (includes credits, keywords, etc.)
    const tmdbMovie = await getMovieDetails(tmdbId);
    const movieData = formatMovieData(tmdbMovie);

    // Compute embedding with full TMDB data for richer representation
    const embedding = await computeMovieEmbedding(movieData, tmdbMovie);
    const embeddingString = stringifyEmbedding(embedding);

    // Store in database
    const userDislike = await prisma.userDislike.create({
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
      message: 'Movie added to disliked list',
      movie: userDislike,
      removedFromLikes: !!existingLike,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/dev/user_dislike/:tmdbId
 * Remove a disliked movie from the user's preferences
 * 
 * Params: { tmdbId: number }
 * 
 * This endpoint:
 * 1. Deletes the movie from the user's disliked list
 */
router.delete('/:tmdbId', validateTmdbId, async (req, res, next) => {
  try {
    const tmdbId = req.validatedTmdbId;

    // Check if movie is disliked
    const existingDislike = await prisma.userDislike.findUnique({
      where: { tmdbId },
    });

    if (!existingDislike) {
      return res.status(404).json({ error: 'Movie not found in disliked list' });
    }

    // Delete from database
    await prisma.userDislike.delete({
      where: { tmdbId },
    });

    // Clear normalization cache when user preferences change
    clearNormalizationCache();

    res.json({
      message: 'Movie removed from disliked list',
      tmdbId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dev/user_dislike
 * Get all disliked movies
 * 
 * Returns: Array of disliked movies
 */
router.get('/', async (req, res, next) => {
  try {
    const dislikedMovies = await prisma.userDislike.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      movies: dislikedMovies,
      count: dislikedMovies.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

