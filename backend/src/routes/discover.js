import express from 'express';
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  formatMovieData,
  mapSortToTmdbSortBy,
} from '../services/tmdb.js';
import { addMatchScoresToMovies } from '../services/matchScore.js';
import { sortMovies } from '../services/movieSort.js';
import { addUserPreferencesToMovies } from '../services/userPreferences.js';

const router = express.Router();

/**
 * GET /api/discover/popular
 * Get popular movies
 *
 * Query params:
 * - page: page number (default: 1)
 * - sort: sort option (default, rating-desc, rating-asc, release-desc, etc.)
 */
router.get('/popular', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sort || 'default';
    
    // Pass sortBy to TMDB function - it will use discover endpoint if sort is TMDB-supported
    const response = await getPopularMovies(page, sortBy);
    const movies = (response.results || []).map(formatMovieData);

    // Add match scores for movies that exist in DB (using global normalization)
    const moviesWithScores = await addMatchScoresToMovies(movies);

    // Add user preferences (liked/disliked status)
    const moviesWithPreferences = await addUserPreferencesToMovies(moviesWithScores);

    // Only sort client-side if sort is NOT supported by TMDB (title, etc.)
    // TMDB-supported sorts (rating, release, popularity) are already sorted by TMDB
    const tmdbSortBy = mapSortToTmdbSortBy(sortBy);
    const sortedMovies = tmdbSortBy && sortBy !== 'default'
      ? moviesWithPreferences // Already sorted by TMDB
      : sortMovies(moviesWithPreferences, sortBy); // Sort client-side for unsupported sorts

    res.json({
      results: sortedMovies,
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
 * - sort: sort option (default, rating-desc, rating-asc, release-desc, etc.)
 */
router.get('/top-rated', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sort || 'default';
    const response = await getTopRatedMovies(page, sortBy);
    const movies = (response.results || []).map(formatMovieData);

    // Add match scores for movies that exist in DB (using global normalization)
    const moviesWithScores = await addMatchScoresToMovies(movies);

    // Add user preferences (liked/disliked status)
    const moviesWithPreferences = await addUserPreferencesToMovies(moviesWithScores);

    // Only sort client-side if sort is NOT supported by TMDB
    const tmdbSortBy = mapSortToTmdbSortBy(sortBy);
    const sortedMovies = tmdbSortBy && sortBy !== 'default'
      ? moviesWithPreferences // Already sorted by TMDB
      : sortMovies(moviesWithPreferences, sortBy); // Sort client-side for unsupported sorts

    res.json({
      results: sortedMovies,
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
 * - sort: sort option (default, rating-desc, rating-asc, release-desc, etc.)
 */
router.get('/now-playing', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sort || 'default';
    const response = await getNowPlayingMovies(page, sortBy);
    const movies = (response.results || []).map(formatMovieData);

    // Add match scores for movies that exist in DB (using global normalization)
    const moviesWithScores = await addMatchScoresToMovies(movies);

    // Add user preferences (liked/disliked status)
    const moviesWithPreferences = await addUserPreferencesToMovies(moviesWithScores);

    // Only sort client-side if sort is NOT supported by TMDB
    const tmdbSortBy = mapSortToTmdbSortBy(sortBy);
    const sortedMovies = tmdbSortBy && sortBy !== 'default'
      ? moviesWithPreferences // Already sorted by TMDB
      : sortMovies(moviesWithPreferences, sortBy); // Sort client-side for unsupported sorts

    res.json({
      results: sortedMovies,
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
 * - sort: sort option (default, rating-desc, rating-asc, release-desc, etc.)
 */
router.get('/upcoming', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sort || 'default';
    const response = await getUpcomingMovies(page, sortBy);
    const movies = (response.results || []).map(formatMovieData);

    // Add match scores for movies that exist in DB (using global normalization)
    const moviesWithScores = await addMatchScoresToMovies(movies);

    // Add user preferences (liked/disliked status)
    const moviesWithPreferences = await addUserPreferencesToMovies(moviesWithScores);

    // Only sort client-side if sort is NOT supported by TMDB
    const tmdbSortBy = mapSortToTmdbSortBy(sortBy);
    const sortedMovies = tmdbSortBy && sortBy !== 'default'
      ? moviesWithPreferences // Already sorted by TMDB
      : sortMovies(moviesWithPreferences, sortBy); // Sort client-side for unsupported sorts

    res.json({
      results: sortedMovies,
      page: response.page,
      totalPages: response.total_pages,
      totalResults: response.total_results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

