import express from 'express';
import { computeRecommendations } from './recommendations.js';
import { Builder } from 'xml2js';
import { authenticateToken } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/rss/recommendations
 * Returns recommended movies as RSS XML feed compatible with Radarr
 * 
 * Query params:
 * - api_token: API token for authentication (required)
 * - limit: number of recommendations to return (default: 20)
 * 
 * This endpoint:
 * 1. Gets all user liked movies and computes average embedding (taste vector)
 * 2. Gets all upcoming movies with embeddings
 * 3. Computes cosine similarity between taste vector and each movie
 * 4. Sorts by similarity score (highest first)
 * 5. Returns top N movies as RSS XML feed
 * 
 * RSS Format:
 * - Compatible with Radarr's expected format
 * - Each item contains movie metadata (title, description, link, etc.)
 * - Includes similarity score in description
 */
router.get('/recommendations', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const limit = req.validatedLimit || 20;

    // Parse filter parameters from query string
    const filters = {};

    // Parse genre IDs (comma-separated)
    if (req.query.genres) {
      filters.genreIds = req.query.genres.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }

    // Parse year filters
    if (req.query.minYear) {
      const minYear = parseInt(req.query.minYear);
      if (!isNaN(minYear)) {
        filters.minYear = minYear;
      }
    }
    if (req.query.maxYear) {
      const maxYear = parseInt(req.query.maxYear);
      if (!isNaN(maxYear)) {
        filters.maxYear = maxYear;
      }
    }

    // Parse rating filter
    if (req.query.minRating) {
      const minRating = parseFloat(req.query.minRating);
      if (!isNaN(minRating)) {
        filters.minRating = minRating;
      }
    }

    // Get recommendations using shared function with filters
    const movies = await computeRecommendations(limit, 0.5, filters);

    if (movies.length === 0) {
      // Return empty RSS feed if no recommendations
      return res
        .status(200)
        .type('application/rss+xml')
        .send(generateEmptyRSS());
    }

    // Generate RSS XML
    const rssXml = generateRSS(movies);

    res.type('application/rss+xml').send(rssXml);
  } catch (error) {
    next(error);
  }
});

/**
 * Generate RSS XML feed from movies
 * Format compatible with Radarr
 */
function generateRSS(movies) {
  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
  });

  const rss = {
    rss: {
      $: {
        version: '2.0',
        'xmlns:atom': 'http://www.w3.org/2005/Atom',
      },
      channel: {
        title: 'CineMind Movie Recommendations',
        link: 'https://cinemind.app',
        description: 'Personalized movie recommendations based on your taste',
        language: 'en-us',
        lastBuildDate: new Date().toUTCString(),
        item: movies.map((movie) => {
          const item = {
            title: movie.title,
            description: `${movie.overview || ''}\n\nSimilarity Score: ${(
              movie.similarity * 100
            ).toFixed(2)}%\nRelease Date: ${movie.releaseDate || 'TBA'}`,
            link: `https://www.themoviedb.org/movie/${movie.tmdbId}`,
            guid: {
              $: { isPermaLink: 'false' },
              _: `cinemind:${movie.tmdbId}`,
            },
            pubDate: movie.releaseDate
              ? new Date(movie.releaseDate).toUTCString()
              : new Date().toUTCString(),
          };

          // Add enclosure only if poster exists
          if (movie.posterPath) {
            item.enclosure = {
              $: {
                url: movie.posterPath,
                type: 'image/jpeg',
              },
            };
          }

          return item;
        }),
      },
    },
  };

  return builder.buildObject(rss);
}

/**
 * Generate empty RSS feed
 */
function generateEmptyRSS() {
  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
  });

  const rss = {
    rss: {
      $: {
        version: '2.0',
        'xmlns:atom': 'http://www.w3.org/2005/Atom',
      },
      channel: {
        title: 'CineMind Movie Recommendations',
        link: 'https://cinemind.app',
        description: 'Personalized movie recommendations based on your taste',
        language: 'en-us',
        lastBuildDate: new Date().toUTCString(),
        item: [],
      },
    },
  };

  return builder.buildObject(rss);
}

export default router;

