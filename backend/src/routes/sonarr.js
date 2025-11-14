import express from 'express';
import axios from 'axios';
import {
  addTVShowToSonarr,
  isSonarrConfigured,
  searchMissingEpisodes,
  searchMissingSeason,
  searchEpisode,
  getMissingEpisodes,
  getSeriesByTmdbId,
} from '../services/sonarr.js';

const router = express.Router();

/**
 * POST /api/sonarr/add/:tmdbId
 * Add a TV show to Sonarr
 * 
 * Params:
 * - tmdbId: TMDB ID of the TV show to add
 * 
 * Body (optional):
 * - qualityProfileId: Quality profile ID (defaults to first available)
 * - rootFolderPath: Root folder path (defaults to first available)
 * - monitored: Whether to monitor the TV show (default: true)
 * - searchForMissingEpisodes: Whether to search for missing episodes immediately (default: false)
 * - searchForCutoffUnmetEpisodes: Whether to search for cutoff unmet episodes (default: false)
 * - monitor: Monitor option - 'all', 'future', 'missing', 'existing', 'firstSeason', 'latestSeason', 'none' (default: 'all')
 */
router.post('/add/:tmdbId', async (req, res, next) => {
  try {
    if (!isSonarrConfigured()) {
      return res.status(503).json({
        error: 'Sonarr is not configured',
        message: 'Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables',
      });
    }

    const tmdbId = parseInt(req.params.tmdbId);

    if (!tmdbId || isNaN(tmdbId)) {
      return res.status(400).json({ error: 'Invalid TMDB ID' });
    }

    const options = {
      qualityProfileId: req.body.qualityProfileId,
      rootFolderPath: req.body.rootFolderPath,
      monitored: req.body.monitored !== undefined ? req.body.monitored : true,
      searchForMissingEpisodes: req.body.searchForMissingEpisodes !== undefined ? req.body.searchForMissingEpisodes : false,
      searchForCutoffUnmetEpisodes: req.body.searchForCutoffUnmetEpisodes !== undefined ? req.body.searchForCutoffUnmetEpisodes : false,
      ignoreEpisodesWithFiles: req.body.ignoreEpisodesWithFiles !== undefined ? req.body.ignoreEpisodesWithFiles : false,
      ignoreEpisodesWithoutFiles: req.body.ignoreEpisodesWithoutFiles !== undefined ? req.body.ignoreEpisodesWithoutFiles : false,
      monitor: req.body.monitor || 'all',
      searchForMissingEpisodesAfterAdd: req.body.searchForMissingEpisodesAfterAdd !== undefined ? req.body.searchForMissingEpisodesAfterAdd : false,
      seasonNumbers: req.body.seasonNumbers || null, // Array of season numbers to monitor
    };

    const result = await addTVShowToSonarr(tmdbId, options);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sonarr/status
 * Check if Sonarr is configured and accessible
 */
router.get('/status', async (req, res, next) => {
  try {
    const configured = isSonarrConfigured();
    
    if (!configured) {
      return res.json({
        configured: false,
        message: 'Sonarr is not configured. Set SONARR_API_KEY and SONARR_BASE_URL in environment variables.',
      });
    }

    // Try to fetch configuration to verify it's working
    try {
      const SONARR_API_KEY = process.env.SONARR_API_KEY;
      const SONARR_BASE_URL = process.env.SONARR_BASE_URL;

      // Normalize base URL
      let baseUrl = SONARR_BASE_URL.replace(/\/$/, '');
      
      // Construct API URLs
      let qualityProfileUrl, rootFolderUrl;
      if (baseUrl.endsWith('/api/v3')) {
        qualityProfileUrl = `${baseUrl}/qualityProfile`;
        rootFolderUrl = `${baseUrl}/rootFolder`;
      } else if (baseUrl.endsWith('/api')) {
        qualityProfileUrl = `${baseUrl}/v3/qualityProfile`;
        rootFolderUrl = `${baseUrl}/v3/rootFolder`;
      } else {
        qualityProfileUrl = `${baseUrl}/api/v3/qualityProfile`;
        rootFolderUrl = `${baseUrl}/api/v3/rootFolder`;
      }

      const [profilesResponse, rootFoldersResponse] = await Promise.all([
        axios.get(qualityProfileUrl, {
          headers: { 'X-Api-Key': SONARR_API_KEY },
        }).catch(() => ({ data: [] })),
        axios.get(rootFolderUrl, {
          headers: { 'X-Api-Key': SONARR_API_KEY },
        }).catch(() => ({ data: [] })),
      ]);

      const profiles = profilesResponse.data || [];
      const rootFolders = rootFoldersResponse.data || [];

      res.json({
        configured: true,
        accessible: true,
        qualityProfiles: profiles.length,
        rootFolders: rootFolders.length,
        message: 'Sonarr is configured and accessible',
        warnings: [
          profiles.length === 0 && 'No quality profiles found. Add one in Sonarr Settings → Profiles.',
          rootFolders.length === 0 && 'No root folders found. Add one in Sonarr Settings → Media Management → Root Folders.',
        ].filter(Boolean),
      });
    } catch (error) {
      res.json({
        configured: true,
        accessible: false,
        message: `Sonarr is configured but not accessible: ${error.message}`,
        error: error.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sonarr/search/series/:tmdbId
 * Search for missing episodes in a series
 * 
 * Params:
 * - tmdbId: TMDB ID of the series
 */
router.post('/search/series/:tmdbId', async (req, res, next) => {
  try {
    if (!isSonarrConfigured()) {
      return res.status(503).json({
        error: 'Sonarr is not configured',
        message: 'Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables',
      });
    }

    const tmdbId = parseInt(req.params.tmdbId);

    if (!tmdbId || isNaN(tmdbId)) {
      return res.status(400).json({ error: 'Invalid TMDB ID' });
    }

    // First, get the series to find its Sonarr ID
    const series = await getSeriesByTmdbId(tmdbId);
    
    if (!series || !series.id) {
      return res.status(404).json({
        error: 'Series not found in Sonarr',
        message: `Series with TMDB ID ${tmdbId} is not added to Sonarr yet. Add it first using POST /api/sonarr/add/:tmdbId`,
      });
    }

    const result = await searchMissingEpisodes(series.id);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sonarr/search/season/:tmdbId/:seasonNumber
 * Search for missing episodes in a specific season
 * 
 * Params:
 * - tmdbId: TMDB ID of the series
 * - seasonNumber: Season number
 */
router.post('/search/season/:tmdbId/:seasonNumber', async (req, res, next) => {
  try {
    if (!isSonarrConfigured()) {
      return res.status(503).json({
        error: 'Sonarr is not configured',
        message: 'Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables',
      });
    }

    const tmdbId = parseInt(req.params.tmdbId);
    const seasonNumber = parseInt(req.params.seasonNumber);

    if (!tmdbId || isNaN(tmdbId)) {
      return res.status(400).json({ error: 'Invalid TMDB ID' });
    }

    if (!seasonNumber || isNaN(seasonNumber) || seasonNumber < 0) {
      return res.status(400).json({ error: 'Invalid season number' });
    }

    // First, get the series to find its Sonarr ID
    const series = await getSeriesByTmdbId(tmdbId);
    
    if (!series || !series.id) {
      return res.status(404).json({
        error: 'Series not found in Sonarr',
        message: `Series with TMDB ID ${tmdbId} is not added to Sonarr yet. Add it first using POST /api/sonarr/add/:tmdbId`,
      });
    }

    const result = await searchMissingSeason(series.id, seasonNumber);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sonarr/search/episode/:episodeId
 * Search for a specific episode
 * 
 * Params:
 * - episodeId: Sonarr episode ID
 */
router.post('/search/episode/:episodeId', async (req, res, next) => {
  try {
    if (!isSonarrConfigured()) {
      return res.status(503).json({
        error: 'Sonarr is not configured',
        message: 'Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables',
      });
    }

    const episodeId = parseInt(req.params.episodeId);

    if (!episodeId || isNaN(episodeId)) {
      return res.status(400).json({ error: 'Invalid episode ID' });
    }

    const result = await searchEpisode(episodeId);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sonarr/wanted/missing
 * Get list of missing episodes
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 10)
 * - sortKey: Sort key (default: 'airDateUtc')
 * - sortDirection: Sort direction 'ascending' or 'descending' (default: 'descending')
 */
router.get('/wanted/missing', async (req, res, next) => {
  try {
    if (!isSonarrConfigured()) {
      return res.status(503).json({
        error: 'Sonarr is not configured',
        message: 'Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables',
      });
    }

    const params = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 10,
      sortKey: req.query.sortKey || 'airDateUtc',
      sortDirection: req.query.sortDirection || 'descending',
    };

    const result = await getMissingEpisodes(params);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

