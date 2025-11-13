import express from 'express';
import { prisma } from '../server.js';
import {
  getUpcomingMovies,
  getMovieDetails,
  formatMovieData,
} from '../services/tmdb.js';
import {
  computeMovieEmbedding,
  stringifyEmbedding,
} from '../services/embeddings.js';

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
 * POST /api/dev/refresh_tmdb
 * Fetch upcoming movies from TMDB and compute embeddings
 * 
 * Query params:
 * - api_token: API token for authentication (required)
 * - page: page number to fetch (default: 1)
 * - maxPages: maximum number of pages to fetch (default: 1)
 * 
 * This endpoint:
 * 1. Fetches upcoming movies from TMDB
 * 2. Computes embeddings for each movie
 * 3. Stores/updates movies in the database
 * 4. Marks them as upcoming movies
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const maxPages = parseInt(req.query.maxPages) || 1;

    let totalFetched = 0;
    let totalProcessed = 0;
    let totalUpdated = 0;

    // Fetch movies page by page
    for (let currentPage = page; currentPage < page + maxPages; currentPage++) {
      const tmdbResponse = await getUpcomingMovies(currentPage);
      const movies = tmdbResponse.results || [];

      totalFetched += movies.length;

      // Process each movie
      for (const tmdbMovie of movies) {
        const movieData = formatMovieData(tmdbMovie);

        try {
          // Fetch full movie details (with credits, keywords, etc.) for richer embeddings
          const fullMovieDetails = await getMovieDetails(tmdbMovie.id);
          
          // Compute embedding with full TMDB data for richer representation
          const embedding = await computeMovieEmbedding(movieData, fullMovieDetails);
          const embeddingString = stringifyEmbedding(embedding);

          // Check if movie exists
          const existingMovie = await prisma.movie.findUnique({
            where: { tmdbId: movieData.tmdbId },
          });

          if (existingMovie) {
            // Update existing movie
            await prisma.movie.update({
              where: { tmdbId: movieData.tmdbId },
              data: {
                title: movieData.title,
                overview: movieData.overview,
                posterPath: movieData.posterPath,
                releaseDate: movieData.releaseDate,
                popularity: movieData.popularity,
                voteAverage: movieData.voteAverage,
                embedding: embeddingString,
                isUpcoming: true,
                updatedAt: new Date(),
              },
            });
            totalUpdated++;
          } else {
            // Create new movie
            await prisma.movie.create({
              data: {
                tmdbId: movieData.tmdbId,
                title: movieData.title,
                overview: movieData.overview,
                posterPath: movieData.posterPath,
                releaseDate: movieData.releaseDate,
                popularity: movieData.popularity,
                voteAverage: movieData.voteAverage,
                embedding: embeddingString,
                isUpcoming: true,
              },
            });
            totalProcessed++;
          }
        } catch (error) {
          console.error(
            `Error processing movie ${movieData.tmdbId}:`,
            error.message
          );
          // Continue with next movie even if one fails
        }
      }

      // If we've reached the last page, break
      if (currentPage >= tmdbResponse.total_pages) {
        break;
      }
    }

    res.json({
      message: 'TMDB movies refreshed',
      stats: {
        totalFetched,
        totalProcessed,
        totalUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

