import express from 'express';
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  formatMovieData,
} from '../services/tmdb.js';

const router = express.Router();

/**
 * GET /api/discover/popular
 * Get popular movies
 *
 * Query params:
 * - page: page number (default: 1)
 */
router.get('/popular', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const response = await getPopularMovies(page);
    const movies = (response.results || []).map(formatMovieData);

    res.json({
      results: movies,
      page: response.page,
      totalPages: response.total_pages,
      totalResults: response.total_results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/discover/top-rated
 * Get top rated movies
 *
 * Query params:
 * - page: page number (default: 1)
 */
router.get('/top-rated', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const response = await getTopRatedMovies(page);
    const movies = (response.results || []).map(formatMovieData);

    res.json({
      results: movies,
      page: response.page,
      totalPages: response.total_pages,
      totalResults: response.total_results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/discover/now-playing
 * Get now playing movies
 *
 * Query params:
 * - page: page number (default: 1)
 */
router.get('/now-playing', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const response = await getNowPlayingMovies(page);
    const movies = (response.results || []).map(formatMovieData);

    res.json({
      results: movies,
      page: response.page,
      totalPages: response.total_pages,
      totalResults: response.total_results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/discover/upcoming
 * Get upcoming movies
 *
 * Query params:
 * - page: page number (default: 1)
 */
router.get('/upcoming', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const response = await getUpcomingMovies(page);
    const movies = (response.results || []).map(formatMovieData);

    res.json({
      results: movies,
      page: response.page,
      totalPages: response.total_pages,
      totalResults: response.total_results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

