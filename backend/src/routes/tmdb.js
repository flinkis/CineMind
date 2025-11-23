import express from 'express';
import { refreshUpcomingMovies, getRefreshStatus } from '../services/movieRefresh.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimitStrict } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * POST /api/dev/refresh_tmdb
 * Fetch upcoming movies from TMDB and compute embeddings
 * 
 * Query params:
 * - api_token: API token for authentication (required)
 * - page: page number to fetch (default: 1)
 * - maxPages: maximum number of pages to fetch. Use "all" or 0 to fetch all pages (default: "all")
 * - force: force refresh even if movies were recently updated (default: false)
 * 
 * This endpoint:
 * 1. Fetches upcoming movies from TMDB
 * 2. Computes embeddings for each movie
 * 3. Stores/updates movies in the database
 * 4. Marks them as upcoming movies
 */
router.post('/', authenticateToken, rateLimitStrict, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const maxPagesParam = req.query.maxPages;
    // Default to fetching all pages, or parse the parameter
    let maxPages = null; // null means fetch all pages
    if (maxPagesParam && maxPagesParam !== 'all' && maxPagesParam !== '0') {
      maxPages = parseInt(maxPagesParam);
      if (isNaN(maxPages) || maxPages < 1) {
        maxPages = null; // Invalid value, default to all
      }
    }
    const force = req.query.force === 'true';

    const result = await refreshUpcomingMovies({ page, maxPages, force });

    if (result.success) {
      res.json({
        message: 'TMDB movies refreshed',
        stats: result.stats,
      });
    } else {
      res.status(500).json({
        error: result.error || 'Failed to refresh movies',
        stats: result.stats,
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dev/refresh_tmdb/status
 * Get status of movie refresh
 */
router.get('/status', authenticateToken, async (req, res, next) => {
  try {
    const status = await getRefreshStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

export default router;

