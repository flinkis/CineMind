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
import { authenticateToken } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { getMovieDetails } from '../services/tmdb.js';

const router = express.Router();

/**
 * Helper function to compute recommendations
 * Returns an array of movies with similarity scores
 * 
 * Uses refined taste vector that accounts for both likes and dislikes
 * 
 * @param {number} limit - Maximum number of recommendations to return
 * @param {number} dislikeWeight - Weight for dislikes (0-1)
 * @param {Object} filters - Filter options
 * @param {number} filters.minYear - Minimum release year
 * @param {number} filters.maxYear - Maximum release year
 * @param {number} filters.minRating - Minimum vote average
 * @param {Array<number>} filters.genreIds - Array of genre IDs to filter by (TMDB genre IDs)
 */
async function computeRecommendations(limit = 20, dislikeWeight = 0.5, filters = {}) {
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

  // Pre-parse all liked movie embeddings once (performance optimization)
  const parsedLikedEmbeddings = userLikes.map((likedMovie) => ({
    tmdbId: likedMovie.tmdbId,
    title: likedMovie.title,
    posterPath: likedMovie.posterPath,
    embedding: parseEmbedding(likedMovie.embedding),
  })).filter(item => item.embedding !== null);

  // Compute similarity scores (without explanations first for performance)
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
        movieEmbedding, // Keep embedding for explanation computation
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.similarity - a.similarity);

  // Only compute explanations for top recommendations (performance optimization)
  // Limit to top 20 to avoid computing for all movies
  const topMoviesForExplanations = moviesWithScores.slice(0, Math.min(20, limit));

  // Compute explanations only for top movies
  topMoviesForExplanations.forEach((movie) => {
    if (!movie.movieEmbedding) return;

    // Find top similar liked movies for explanation
    const similarLikedMovies = parsedLikedEmbeddings
      .map((likedItem) => {
        const individualSimilarity = cosineSimilarity(movie.movieEmbedding, likedItem.embedding);
        return {
          tmdbId: likedItem.tmdbId,
          title: likedItem.title,
          posterPath: likedItem.posterPath,
          similarity: individualSimilarity,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Top 5 most similar liked movies

    movie.similarLikedMovies = similarLikedMovies;
    // Remove embedding from response (no longer needed)
    delete movie.movieEmbedding;
  });

  // Remove embedding from movies that don't have explanations
  moviesWithScores.forEach((movie) => {
    if (movie.movieEmbedding) {
      delete movie.movieEmbedding;
    }
  });

  // Apply filters (year, rating) - these use data we already have
  let filteredMovies = moviesWithScores;

  if (filters.minYear || filters.maxYear) {
    filteredMovies = filteredMovies.filter((movie) => {
      if (!movie.releaseDate) return false;
      const year = new Date(movie.releaseDate).getFullYear();
      if (isNaN(year)) return false;

      if (filters.minYear && year < filters.minYear) return false;
      if (filters.maxYear && year > filters.maxYear) return false;
      return true;
    });
  }

  if (filters.minRating !== undefined && filters.minRating !== null) {
    filteredMovies = filteredMovies.filter((movie) => {
      return movie.voteAverage >= filters.minRating;
    });
  }

  // For genre filtering, we need to fetch from TMDB
  // Check all movies to ensure genre filter is properly applied
  if (filters.genreIds && filters.genreIds.length > 0) {
    const genreIdsSet = new Set(filters.genreIds.map(id => parseInt(id)));

    // Fetch genres for all filtered movies to ensure proper filtering
    const genrePromises = filteredMovies.map(async (movie) => {
      try {
        const details = await getMovieDetails(movie.tmdbId);
        const movieGenres = (details.genres || []).map(g => g.id);
        // Check if movie has any of the requested genres
        const hasGenre = movieGenres.some(genreId => genreIdsSet.has(genreId));
        return { movie, hasGenre };
      } catch (error) {
        console.error(`Error fetching genres for movie ${movie.tmdbId}:`, error.message);
        return { movie, hasGenre: false };
      }
    });

    const genreResults = await Promise.all(genrePromises);
    // Only include movies that match the genre filter
    filteredMovies = genreResults.filter(r => r.hasGenre).map(r => r.movie);
  }

  // Normalize scores using global normalization (consistent across all endpoints)
  // Get global normalization parameters (cached, based on all upcoming movies)
  const normalizationParams = await getGlobalNormalizationParams(dislikeWeight);

  if (filteredMovies.length > 0 && normalizationParams) {
    filteredMovies.forEach(movie => {
      // Normalize using global parameters (consistent with other endpoints)
      movie.normalizedSimilarity = normalizeScore(movie.similarity, normalizationParams);
      // Keep raw similarity for reference (actual cosine similarity value)
      movie.rawSimilarity = movie.similarity;
      // Use normalized as primary similarity
      movie.similarity = movie.normalizedSimilarity;
    });
  } else if (filteredMovies.length > 0) {
    // If no normalization params available, use raw scores
    filteredMovies.forEach(movie => {
      movie.normalizedSimilarity = movie.similarity;
      movie.rawSimilarity = movie.similarity;
    });
  }

  // Add user preferences (liked/disliked status) before returning
  const moviesWithPreferences = await addUserPreferencesToMovies(filteredMovies);

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
router.get('/', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const limit = req.validatedLimit || 20;
    const dislikeWeight = parseFloat(req.query.dislikeWeight) || 0.5;
    const autoRefresh = req.query.autoRefresh !== 'false'; // Default to true

    // Clamp dislikeWeight between 0 and 1
    const clampedDislikeWeight = Math.max(0, Math.min(1, dislikeWeight));

    // Parse filter parameters
    const filters = {};
    if (req.query.minYear) {
      filters.minYear = parseInt(req.query.minYear);
    }
    if (req.query.maxYear) {
      filters.maxYear = parseInt(req.query.maxYear);
    }
    if (req.query.minRating) {
      filters.minRating = parseFloat(req.query.minRating);
    }
    if (req.query.genres) {
      // Genres can be comma-separated list of genre IDs
      filters.genreIds = req.query.genres.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }

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

    const movies = await computeRecommendations(limit, clampedDislikeWeight, filters);

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

