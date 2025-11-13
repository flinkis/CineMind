import express from 'express';
import { prisma } from '../server.js';
import {
  parseEmbedding,
  computeAverageEmbedding,
  computeRefinedTasteVector,
  cosineSimilarity,
} from '../services/embeddings.js';
import { refreshUpcomingMovies, getRefreshStatus } from '../services/movieRefresh.js';
import { normalizeScore, getGlobalNormalizationParams } from '../services/matchScore.js';
import { addUserPreferencesToMovies } from '../services/userPreferences.js';

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
 * Helper function to compute recommendations
 * Returns an array of movies with similarity scores
 * 
 * Uses refined taste vector that accounts for both likes and dislikes
 */
async function computeRecommendations(limit = 20, dislikeWeight = 0.5) {
  // Get all user liked movies
  const userLikes = await prisma.userLike.findMany();

  if (userLikes.length === 0) {
    return [];
  }

  // Get all user disliked movies
  const userDislikes = await prisma.userDislike.findMany();

  // Parse embeddings
  const likedEmbeddings = userLikes.map((like) =>
    parseEmbedding(like.embedding)
  ).filter(Boolean);

  if (likedEmbeddings.length === 0) {
    return [];
  }

  const dislikedEmbeddings = userDislikes.map((dislike) =>
    parseEmbedding(dislike.embedding)
  ).filter(Boolean);

  // Compute refined taste vector (accounts for dislikes)
  const tasteVector = computeRefinedTasteVector(
    likedEmbeddings,
    dislikedEmbeddings,
    dislikeWeight
  );

  if (!tasteVector) {
    return [];
  }

  // Get all upcoming movies with embeddings
  const movies = await prisma.movie.findMany({
    where: {
      isUpcoming: true,
      embedding: {
        not: null,
      },
    },
  });

  // Compute similarity scores
  const moviesWithScores = movies
    .map((movie) => {
      const movieEmbedding = parseEmbedding(movie.embedding);
      if (!movieEmbedding) return null;

      const similarity = cosineSimilarity(tasteVector, movieEmbedding);

      return {
        id: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        overview: movie.overview || '',
        posterPath: movie.posterPath,
        releaseDate: movie.releaseDate,
        popularity: movie.popularity,
        voteAverage: movie.voteAverage,
        similarity,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.similarity - a.similarity);

  // Normalize scores using global normalization (consistent across all endpoints)
  // Get global normalization parameters (cached, based on all upcoming movies)
  const normalizationParams = await getGlobalNormalizationParams(dislikeWeight);
  
  if (moviesWithScores.length > 0 && normalizationParams) {
    moviesWithScores.forEach(movie => {
      // Normalize using global parameters (consistent with other endpoints)
      movie.normalizedSimilarity = normalizeScore(movie.similarity, normalizationParams);
      // Keep raw similarity for reference (actual cosine similarity value)
      movie.rawSimilarity = movie.similarity;
      // Use normalized as primary similarity
      movie.similarity = movie.normalizedSimilarity;
    });
  } else if (moviesWithScores.length > 0) {
    // If no normalization params available, use raw scores
    moviesWithScores.forEach(movie => {
      movie.normalizedSimilarity = movie.similarity;
      movie.rawSimilarity = movie.similarity;
    });
  }

  // Add user preferences (liked/disliked status) before returning
  const moviesWithPreferences = await addUserPreferencesToMovies(moviesWithScores);

  return moviesWithPreferences.slice(0, limit);
}

/**
 * GET /api/recommendations
 * Returns recommended movies as JSON
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
 * 5. Returns top N movies as JSON
 */
/**
 * GET /api/recommendations/status
 * Returns status information about recommendations
 * 
 * Query params:
 * - api_token: API token for authentication (required)
 */
router.get('/status', authenticateToken, async (req, res, next) => {
  try {
    // Get count of liked movies
    const likedMoviesCount = await prisma.userLike.count();
    
    // Get count of disliked movies
    const dislikedMoviesCount = await prisma.userDislike.count();
    
    // Get refresh status
    const refreshStatus = await getRefreshStatus();
    
    res.json({
      likedMovies: likedMoviesCount,
      dislikedMovies: dislikedMoviesCount,
      upcomingMovies: refreshStatus.upcomingMoviesCount,
      lastUpdate: refreshStatus.lastUpdate,
      hoursSinceLastUpdate: refreshStatus.hoursSinceLastUpdate,
      isStale: refreshStatus.isStale,
      needsRefresh: refreshStatus.needsRefresh,
      canGenerateRecommendations: likedMoviesCount > 0 && refreshStatus.upcomingMoviesCount > 0,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recommendations
 * Returns recommended movies as JSON
 * 
 * Query params:
 * - api_token: API token for authentication (required)
 * - limit: number of recommendations to return (default: 20)
 * - autoRefresh: automatically refresh movies if needed (default: true)
 * 
 * This endpoint:
 * 1. Checks if movies need to be refreshed (if autoRefresh is enabled)
 * 2. Automatically refreshes movies if needed (no upcoming movies or stale data)
 * 3. Gets all user liked movies and computes average embedding (taste vector)
 * 4. Gets all upcoming movies with embeddings
 * 5. Computes cosine similarity between taste vector and each movie
 * 6. Sorts by similarity score (highest first)
 * 7. Returns top N movies as JSON
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const dislikeWeight = parseFloat(req.query.dislikeWeight) || 0.5;
    const autoRefresh = req.query.autoRefresh !== 'false'; // Default to true
    
    // Clamp dislikeWeight between 0 and 1
    const clampedDislikeWeight = Math.max(0, Math.min(1, dislikeWeight));
    
    // Check if movies need to be refreshed
    let refreshInfo = null;
    if (autoRefresh) {
      const refreshStatus = await getRefreshStatus();
      
      if (refreshStatus.needsRefresh) {
        console.log('🔄 Auto-refreshing movies (needsRefresh=true)');
        console.log(`   Upcoming movies: ${refreshStatus.upcomingMoviesCount}`);
        console.log(`   Last update: ${refreshStatus.lastUpdate || 'never'}`);
        console.log(`   Hours since update: ${refreshStatus.hoursSinceLastUpdate || 'N/A'}`);
        
        // Refresh movies (fetch ALL pages to get complete coverage)
        const refreshResult = await refreshUpcomingMovies({
          page: 1,
          maxPages: null, // null means fetch all pages
          force: false,
        });
        
        refreshInfo = {
          refreshed: refreshResult.success,
          stats: refreshResult.stats,
          reason: refreshStatus.upcomingMoviesCount === 0 
            ? 'no_upcoming_movies' 
            : 'stale_data',
        };
        
        if (refreshResult.success) {
          console.log(`✅ Auto-refresh complete: ${refreshResult.stats.totalProcessed} created, ${refreshResult.stats.totalUpdated} updated`);
        } else {
          console.error(`❌ Auto-refresh failed: ${refreshResult.error}`);
        }
      }
    }
    
    const movies = await computeRecommendations(limit, clampedDislikeWeight);

    // Get status for additional context
    const likedMoviesCount = await prisma.userLike.count();
    const dislikedMoviesCount = await prisma.userDislike.count();
    const upcomingMoviesCount = await prisma.movie.count({
      where: {
        isUpcoming: true,
        embedding: {
          not: null,
        },
      },
    });

    res.json({
      movies,
      count: movies.length,
      status: {
        likedMovies: likedMoviesCount,
        dislikedMovies: dislikedMoviesCount,
        upcomingMovies: upcomingMoviesCount,
      },
      refresh: refreshInfo,
    });
  } catch (error) {
    next(error);
  }
});

// Export the helper function for use in other routes
export { computeRecommendations };

export default router;

