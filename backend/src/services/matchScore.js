import { prisma } from '../server.js';
import {
  parseEmbedding,
  computeRefinedTasteVector,
  cosineSimilarity,
} from './embeddings.js';

/**
 * Match Score Service
 * Provides consistent match score computation and normalization across all endpoints
 */

// Cache for normalization parameters (min/max similarity scores)
// Key: userId (or 'default' for single-user systems)
// Value: { minSimilarity, maxSimilarity, lastUpdated }
const normalizationCache = new Map();

// Cache expiration time (1 hour)
const CACHE_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Get or compute global normalization parameters for a user's taste profile
 * Uses all upcoming movies in the database as the reference set
 * 
 * @param {number} dislikeWeight - Weight for dislikes (default: 0.5)
 * @returns {Object} { minSimilarity, maxSimilarity } or null if no movies/user preferences
 */
async function getGlobalNormalizationParams(dislikeWeight = 0.5) {
  const cacheKey = `default_${dislikeWeight}`;
  const cached = normalizationCache.get(cacheKey);

  // Check if cache is valid (not expired)
  if (cached && Date.now() - cached.lastUpdated < CACHE_EXPIRATION_MS) {
    return { minSimilarity: cached.minSimilarity, maxSimilarity: cached.maxSimilarity };
  }

  try {
    // Check if user has liked movies
    const userLikes = await prisma.userLike.findMany();
    if (userLikes.length === 0) {
      return null;
    }

    // Get user disliked movies
    const userDislikes = await prisma.userDislike.findMany();

    // Parse embeddings
    const likedEmbeddings = userLikes.map((like) =>
      parseEmbedding(like.embedding)
    ).filter(Boolean);

    if (likedEmbeddings.length === 0) {
      return null;
    }

    const dislikedEmbeddings = userDislikes.map((dislike) =>
      parseEmbedding(dislike.embedding)
    ).filter(Boolean);

    // Compute refined taste vector
    const tasteVector = computeRefinedTasteVector(
      likedEmbeddings,
      dislikedEmbeddings,
      dislikeWeight
    );

    if (!tasteVector) {
      return null;
    }

    // Get ALL upcoming movies with embeddings (reference set)
    const allMovies = await prisma.movie.findMany({
      where: {
        isUpcoming: true,
        embedding: {
          not: null,
        },
      },
    });

    if (allMovies.length === 0) {
      return null;
    }

    // Compute similarity scores for all movies
    const similarities = [];
    for (const movie of allMovies) {
      const movieEmbedding = parseEmbedding(movie.embedding);
      if (movieEmbedding) {
        const similarity = cosineSimilarity(tasteVector, movieEmbedding);
        similarities.push(similarity);
      }
    }

    if (similarities.length === 0) {
      return null;
    }

    // Compute min and max
    const minSimilarity = Math.min(...similarities);
    const maxSimilarity = Math.max(...similarities);

    // Cache the results
    normalizationCache.set(cacheKey, {
      minSimilarity,
      maxSimilarity,
      lastUpdated: Date.now(),
    });

    return { minSimilarity, maxSimilarity };
  } catch (error) {
    console.error('Error computing global normalization params:', error);
    return null;
  }
}

/**
 * Normalize a similarity score using global normalization parameters
 * 
 * @param {number} similarity - Raw similarity score (0-1)
 * @param {Object} normalizationParams - { minSimilarity, maxSimilarity } from getGlobalNormalizationParams
 * @returns {number} Normalized score (0.5-1.0) or raw score if normalization fails
 */
function normalizeScore(similarity, normalizationParams) {
  if (!normalizationParams || similarity === null || similarity === undefined) {
    return similarity;
  }

  const { minSimilarity, maxSimilarity } = normalizationParams;
  const range = maxSimilarity - minSimilarity;

  // If range is too small, return raw score
  if (range < 0.001) {
    return similarity;
  }

  // Normalize to 0-1, then scale to 0.5-1.0
  const targetMin = 0.5;
  const targetMax = 1.0;
  const targetRange = targetMax - targetMin;

  const normalized = (similarity - minSimilarity) / range;
  return targetMin + (normalized * targetRange);
}

/**
 * Compute match score for a single movie
 * 
 * @param {number} tmdbId - TMDB ID of the movie
 * @param {number} dislikeWeight - Weight for dislikes (default: 0.5)
 * @returns {Object} { similarity, normalizedSimilarity, rawSimilarity } or null
 */
async function computeMovieMatchScore(tmdbId, dislikeWeight = 0.5) {
  try {
    // Check if movie exists in DB with embedding
    const dbMovie = await prisma.movie.findUnique({
      where: { tmdbId: parseInt(tmdbId) },
    });

    if (!dbMovie || !dbMovie.embedding) {
      return null;
    }

    // Get user's taste vector
    const userLikes = await prisma.userLike.findMany();
    if (userLikes.length === 0) {
      return null;
    }

    const userDislikes = await prisma.userDislike.findMany();

    // Parse embeddings
    const likedEmbeddings = userLikes.map((like) =>
      parseEmbedding(like.embedding)
    ).filter(Boolean);

    if (likedEmbeddings.length === 0) {
      return null;
    }

    const dislikedEmbeddings = userDislikes.map((dislike) =>
      parseEmbedding(dislike.embedding)
    ).filter(Boolean);

    // Compute refined taste vector
    const tasteVector = computeRefinedTasteVector(
      likedEmbeddings,
      dislikedEmbeddings,
      dislikeWeight
    );

    if (!tasteVector) {
      return null;
    }

    // Compute raw similarity
    const movieEmbedding = parseEmbedding(dbMovie.embedding);
    if (!movieEmbedding) {
      return null;
    }

    const rawSimilarity = cosineSimilarity(tasteVector, movieEmbedding);

    // Get global normalization parameters
    const normalizationParams = await getGlobalNormalizationParams(dislikeWeight);

    // Normalize the score (or use raw if normalization params not available)
    const normalizedSimilarity = normalizationParams 
      ? normalizeScore(rawSimilarity, normalizationParams)
      : rawSimilarity;

    return {
      similarity: normalizedSimilarity, // Use normalized as primary (or raw if no normalization)
      normalizedSimilarity,
      rawSimilarity,
    };
  } catch (error) {
    console.error('Error computing movie match score:', error);
    return null;
  }
}

/**
 * Add match scores to a list of movies using global normalization
 * 
 * @param {Array} movies - Array of movie objects with tmdbId
 * @param {number} dislikeWeight - Weight for dislikes (default: 0.5)
 * @returns {Array} Movies with similarity scores added
 */
async function addMatchScoresToMovies(movies, dislikeWeight = 0.5) {
  // Check if user has liked movies (required for match scores)
  const userLikes = await prisma.userLike.findMany();
  if (userLikes.length === 0) {
    return movies;
  }

  // Get user disliked movies
  const userDislikes = await prisma.userDislike.findMany();

  // Parse embeddings
  const likedEmbeddings = userLikes.map((like) =>
    parseEmbedding(like.embedding)
  ).filter(Boolean);

  if (likedEmbeddings.length === 0) {
    return movies;
  }

  const dislikedEmbeddings = userDislikes.map((dislike) =>
    parseEmbedding(dislike.embedding)
  ).filter(Boolean);

  // Compute refined taste vector
  const tasteVector = computeRefinedTasteVector(
    likedEmbeddings,
    dislikedEmbeddings,
    dislikeWeight
  );

  if (!tasteVector) {
    return movies;
  }

  // Get global normalization parameters (cached)
  const normalizationParams = await getGlobalNormalizationParams(dislikeWeight);

  // Get all movie IDs from the input
  const tmdbIds = movies.map(m => m.tmdbId || m.id).filter(Boolean);

  if (tmdbIds.length === 0) {
    return movies;
  }

  // Find movies in database with embeddings
  const dbMovies = await prisma.movie.findMany({
    where: {
      tmdbId: {
        in: tmdbIds,
      },
      embedding: {
        not: null,
      },
    },
  });

  // Create a map of tmdbId -> movie with embedding
  const dbMoviesMap = new Map();
  dbMovies.forEach(movie => {
    dbMoviesMap.set(movie.tmdbId, movie);
  });

  // Compute similarity scores for movies that exist in DB
  const moviesWithScores = [];

  movies.forEach(movie => {
    const tmdbId = movie.tmdbId || movie.id;
    const dbMovie = dbMoviesMap.get(tmdbId);

    if (dbMovie) {
      const movieEmbedding = parseEmbedding(dbMovie.embedding);
      if (movieEmbedding) {
        const rawSimilarity = cosineSimilarity(tasteVector, movieEmbedding);
        // Normalize score if normalization params are available
        const normalizedSimilarity = normalizationParams 
          ? normalizeScore(rawSimilarity, normalizationParams)
          : rawSimilarity;

        moviesWithScores.push({
          ...movie,
          similarity: normalizedSimilarity, // Use normalized as primary (or raw if no normalization)
          normalizedSimilarity,
          rawSimilarity,
        });
      } else {
        moviesWithScores.push(movie);
      }
    } else {
      moviesWithScores.push(movie);
    }
  });

  return moviesWithScores;
}

/**
 * Clear normalization cache (useful when user likes/dislikes change)
 */
function clearNormalizationCache() {
  normalizationCache.clear();
}

export {
  computeMovieMatchScore,
  addMatchScoresToMovies,
  getGlobalNormalizationParams,
  normalizeScore,
  clearNormalizationCache,
};

