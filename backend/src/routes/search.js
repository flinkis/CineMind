import express from 'express';
import { searchMovies, formatMovieData } from '../services/tmdb.js';
import { addMatchScoresToMovies } from '../services/matchScore.js';
import { sortMovies } from '../services/movieSort.js';
import { addUserPreferencesToMovies } from '../services/userPreferences.js';

const router = express.Router();

/**
 * GET /api/search/movies
 * Search movies by title
 * 
 * Query params:
 * - q: search query (required)
 * - page: page number (default: 1)
 * - sort: sort option (default, rating-desc, rating-asc, release-desc, etc.)
 */
router.get('/movies', async (req, res, next) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sort || 'default';

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const tmdbResponse = await searchMovies(query, page);
    const movies = (tmdbResponse.results || []).map(formatMovieData);

    // Add match scores for movies that exist in DB (using global normalization)
    const moviesWithScores = await addMatchScoresToMovies(movies);

    // Add user preferences (liked/disliked status)
    const moviesWithPreferences = await addUserPreferencesToMovies(moviesWithScores);

    // Sort movies server-side before sending to client
    const sortedMovies = sortMovies(moviesWithPreferences, sortBy);

    res.json({
      results: sortedMovies,
      page: tmdbResponse.page,
      totalPages: tmdbResponse.total_pages,
      totalResults: tmdbResponse.total_results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

