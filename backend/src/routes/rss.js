import express from 'express';
import { computeRecommendations } from './recommendations.js';
import { Builder } from 'xml2js';

const router = express.Router();

// API token authentication middleware
const authenticateToken = (req, res, next) => {
  const apiToken = req.query.api_token || req.headers['x-api-token'];
  const expectedToken = process.env.API_TOKEN;

  if (!expectedToken) {
    return res.status(500).json({
      error: 'API token not configured on server',
    });
  }

  if (!apiToken || apiToken !== expectedToken) {
    return res.status(401).json({
      error: 'Invalid or missing API token',
    });
  }

  next();
};

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
router.get('/recommendations', authenticateToken, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Get recommendations using shared function
    const movies = await computeRecommendations(limit);

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

