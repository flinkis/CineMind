import express from 'express';
import { searchTV, formatTVData } from '../services/tmdb.js';
import { sortTVShows } from '../services/tvSort.js';

const router = express.Router();

/**
 * GET /api/search/tv
 * Search TV shows by title
 * 
 * Query params:
 * - q: search query (required)
 * - page: page number (default: 1)
 * - sort: sort option (default, rating-desc, rating-asc, release-desc, etc.)
 */
router.get('/tv', async (req, res, next) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sort || 'default';

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const tmdbResponse = await searchTV(query, page);
    const tvShows = (tmdbResponse.results || []).map(formatTVData);

    // Sort TV shows server-side before sending to client
    const sortedTVShows = sortTVShows(tvShows, sortBy);

    res.json({
      results: sortedTVShows,
      page: tmdbResponse.page,
      totalPages: tmdbResponse.total_pages,
      totalResults: tmdbResponse.total_results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

