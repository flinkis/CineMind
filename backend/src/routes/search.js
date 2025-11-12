import express from 'express';
import { searchMovies, formatMovieData } from '../services/tmdb.js';

const router = express.Router();

/**
 * GET /api/search/movies
 * Search movies by title
 * 
 * Query params:
 * - q: search query (required)
 * - page: page number (default: 1)
 */
router.get('/movies', async (req, res, next) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const tmdbResponse = await searchMovies(query, page);
    const movies = (tmdbResponse.results || []).map(formatMovieData);

    res.json({
      results: movies,
      page: tmdbResponse.page,
      totalPages: tmdbResponse.total_pages,
      totalResults: tmdbResponse.total_results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

