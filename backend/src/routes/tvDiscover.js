import express from 'express';
import {
  getPopularTV,
  getTopRatedTV,
  getOnTheAirTV,
  getAiringTodayTV,
  formatTVData,
  mapSortToTmdbSortByTV,
  getTVGenres,
  getTVNetworks,
  getLanguages,
} from '../services/tmdb.js';
import { sortTVShows } from '../services/tvSort.js';

const router = express.Router();

/**
 * GET /api/discover/tv/genres
 * Get available TV genres
 */
router.get('/tv/genres', async (req, res, next) => {
  try {
    const genres = await getTVGenres();
    res.json({ genres });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/discover/tv/networks
 * Get available TV networks
 */
router.get('/tv/networks', async (req, res, next) => {
  try {
    const networks = await getTVNetworks();
    res.json({ networks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/discover/tv/languages
 * Get available languages
 */
router.get('/tv/languages', async (req, res, next) => {
  try {
    const languages = await getLanguages();
    res.json({ languages });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/discover/tv/popular
 * Get popular TV shows
 *
 * Query params:
 * - page: page number (default: 1)
 * - sort: sort option (default, rating-desc, rating-asc, release-desc, etc.)
 */
router.get('/tv/popular', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sort || 'default';
    
    // Extract filter parameters
    const filters = {};
    if (req.query.status) filters.with_status = req.query.status;
    if (req.query.networks) filters.with_networks = req.query.networks;
    if (req.query.genres) filters.with_genres = req.query.genres;
    if (req.query.language) filters.with_original_language = req.query.language;
    if (req.query['first_air_date.gte']) filters['first_air_date.gte'] = req.query['first_air_date.gte'];
    if (req.query['first_air_date.lte']) filters['first_air_date.lte'] = req.query['first_air_date.lte'];
    if (req.query['vote_average.gte']) filters['vote_average.gte'] = req.query['vote_average.gte'];
    if (req.query['vote_average.lte']) filters['vote_average.lte'] = req.query['vote_average.lte'];
    
    const response = await getPopularTV(page, sortBy, filters);
    const tvShows = (response.results || []).map(formatTVData);

    // Only sort client-side if sort is NOT supported by TMDB (title, etc.)
    const tmdbSortBy = mapSortToTmdbSortByTV(sortBy);
    const sortedTVShows = tmdbSortBy && sortBy !== 'default'
      ? tvShows // Already sorted by TMDB
      : sortTVShows(tvShows, sortBy); // Sort client-side for unsupported sorts

    res.json({
      results: sortedTVShows,
      page: response.page,
      totalPages: response.total_pages,
      totalResults: response.total_results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/discover/tv/top-rated
 * Get top rated TV shows
 *
 * Query params:
 * - page: page number (default: 1)
 * - sort: sort option (default, rating-desc, rating-asc, release-desc, etc.)
 */
router.get('/tv/top-rated', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sort || 'default';
    
    // Extract filter parameters
    const filters = {};
    if (req.query.status) filters.with_status = req.query.status;
    if (req.query.networks) filters.with_networks = req.query.networks;
    if (req.query.genres) filters.with_genres = req.query.genres;
    if (req.query.language) filters.with_original_language = req.query.language;
    if (req.query['first_air_date.gte']) filters['first_air_date.gte'] = req.query['first_air_date.gte'];
    if (req.query['first_air_date.lte']) filters['first_air_date.lte'] = req.query['first_air_date.lte'];
    if (req.query['vote_average.gte']) filters['vote_average.gte'] = req.query['vote_average.gte'];
    if (req.query['vote_average.lte']) filters['vote_average.lte'] = req.query['vote_average.lte'];
    
    const response = await getTopRatedTV(page, sortBy, filters);
    const tvShows = (response.results || []).map(formatTVData);

    const tmdbSortBy = mapSortToTmdbSortByTV(sortBy);
    const sortedTVShows = tmdbSortBy && sortBy !== 'default'
      ? tvShows // Already sorted by TMDB
      : sortTVShows(tvShows, sortBy); // Sort client-side for unsupported sorts

    res.json({
      results: sortedTVShows,
      page: response.page,
      totalPages: response.total_pages,
      totalResults: response.total_results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/discover/tv/on-the-air
 * Get on the air TV shows (currently airing)
 *
 * Query params:
 * - page: page number (default: 1)
 * - sort: sort option (default, rating-desc, rating-asc, release-desc, etc.)
 */
router.get('/tv/on-the-air', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sort || 'default';
    
    // Extract filter parameters
    const filters = {};
    if (req.query.status) filters.with_status = req.query.status;
    if (req.query.networks) filters.with_networks = req.query.networks;
    if (req.query.genres) filters.with_genres = req.query.genres;
    if (req.query.language) filters.with_original_language = req.query.language;
    if (req.query['first_air_date.gte']) filters['first_air_date.gte'] = req.query['first_air_date.gte'];
    if (req.query['first_air_date.lte']) filters['first_air_date.lte'] = req.query['first_air_date.lte'];
    if (req.query['vote_average.gte']) filters['vote_average.gte'] = req.query['vote_average.gte'];
    if (req.query['vote_average.lte']) filters['vote_average.lte'] = req.query['vote_average.lte'];
    
    const response = await getOnTheAirTV(page, sortBy, filters);
    const tvShows = (response.results || []).map(formatTVData);

    const tmdbSortBy = mapSortToTmdbSortByTV(sortBy);
    const sortedTVShows = tmdbSortBy && sortBy !== 'default'
      ? tvShows // Already sorted by TMDB
      : sortTVShows(tvShows, sortBy); // Sort client-side for unsupported sorts

    res.json({
      results: sortedTVShows,
      page: response.page,
      totalPages: response.total_pages,
      totalResults: response.total_results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/discover/tv/airing-today
 * Get airing today TV shows
 *
 * Query params:
 * - page: page number (default: 1)
 * - sort: sort option (default, rating-desc, rating-asc, release-desc, etc.)
 */
router.get('/tv/airing-today', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sort || 'default';
    
    // Extract filter parameters
    const filters = {};
    if (req.query.status) filters.with_status = req.query.status;
    if (req.query.networks) filters.with_networks = req.query.networks;
    if (req.query.genres) filters.with_genres = req.query.genres;
    if (req.query.language) filters.with_original_language = req.query.language;
    if (req.query['first_air_date.gte']) filters['first_air_date.gte'] = req.query['first_air_date.gte'];
    if (req.query['first_air_date.lte']) filters['first_air_date.lte'] = req.query['first_air_date.lte'];
    if (req.query['vote_average.gte']) filters['vote_average.gte'] = req.query['vote_average.gte'];
    if (req.query['vote_average.lte']) filters['vote_average.lte'] = req.query['vote_average.lte'];
    
    const response = await getAiringTodayTV(page, sortBy, filters);
    const tvShows = (response.results || []).map(formatTVData);

    const tmdbSortBy = mapSortToTmdbSortByTV(sortBy);
    const sortedTVShows = tmdbSortBy && sortBy !== 'default'
      ? tvShows // Already sorted by TMDB
      : sortTVShows(tvShows, sortBy); // Sort client-side for unsupported sorts

    res.json({
      results: sortedTVShows,
      page: response.page,
      totalPages: response.total_pages,
      totalResults: response.total_results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

