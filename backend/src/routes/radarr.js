import express from 'express';
import axios from 'axios';
import { addMovieToRadarr, isRadarrConfigured } from '../services/radarr.js';

const router = express.Router();

/**
 * POST /api/radarr/add/:tmdbId
 * Add a movie to Radarr
 * 
 * Params:
 * - tmdbId: TMDB ID of the movie to add
 * 
 * Body (optional):
 * - qualityProfileId: Quality profile ID (defaults to first available)
 * - rootFolderPath: Root folder path (defaults to first available)
 * - monitored: Whether to monitor the movie (default: true)
 * - searchForMovie: Whether to search for the movie immediately (default: false)
 */
router.post('/add/:tmdbId', async (req, res, next) => {
  try {
    if (!isRadarrConfigured()) {
      return res.status(503).json({
        error: 'Radarr is not configured',
        message: 'Please set RADARR_API_KEY and RADARR_BASE_URL in environment variables',
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
      searchForMovie: req.body.searchForMovie !== undefined ? req.body.searchForMovie : false,
    };

    const result = await addMovieToRadarr(tmdbId, options);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/radarr/status
 * Check if Radarr is configured and accessible
 */
router.get('/status', async (req, res, next) => {
  try {
    const configured = isRadarrConfigured();
    
    if (!configured) {
      return res.json({
        configured: false,
        message: 'Radarr is not configured. Set RADARR_API_KEY and RADARR_BASE_URL in environment variables.',
      });
    }

    // Try to fetch configuration to verify it's working
    try {
      const RADARR_API_KEY = process.env.RADARR_API_KEY;
      const RADARR_BASE_URL = process.env.RADARR_BASE_URL;

      const [profilesResponse, rootFoldersResponse] = await Promise.all([
        axios.get(`${RADARR_BASE_URL}/api/v3/qualityProfile`, {
          headers: { 'X-Api-Key': RADARR_API_KEY },
        }).catch(() => ({ data: [] })),
        axios.get(`${RADARR_BASE_URL}/api/v3/rootFolder`, {
          headers: { 'X-Api-Key': RADARR_API_KEY },
        }).catch(() => ({ data: [] })),
      ]);

      const profiles = profilesResponse.data || [];
      const rootFolders = rootFoldersResponse.data || [];

      res.json({
        configured: true,
        accessible: true,
        qualityProfiles: profiles.length,
        rootFolders: rootFolders.length,
        message: 'Radarr is configured and accessible',
        warnings: [
          profiles.length === 0 && 'No quality profiles found. Add one in Radarr Settings → Profiles.',
          rootFolders.length === 0 && 'No root folders found. Add one in Radarr Settings → Media Management → Root Folders.',
        ].filter(Boolean),
      });
    } catch (error) {
      res.json({
        configured: true,
        accessible: false,
        message: `Radarr is configured but not accessible: ${error.message}`,
        error: error.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

