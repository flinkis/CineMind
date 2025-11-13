import express from 'express';
import { prisma } from '../server.js';
import {
  parseEmbedding,
  computeAverageEmbedding,
  computeRefinedTasteVector,
  cosineSimilarity,
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
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return moviesWithScores;
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
    
    // Get count of upcoming movies with embeddings
    const upcomingMoviesCount = await prisma.movie.count({
      where: {
        isUpcoming: true,
        embedding: {
          not: null,
        },
      },
    });
    
    // Get count of all upcoming movies (including those without embeddings)
    const allUpcomingMoviesCount = await prisma.movie.count({
      where: {
        isUpcoming: true,
      },
    });
    
    res.json({
      likedMovies: likedMoviesCount,
      dislikedMovies: dislikedMoviesCount,
      upcomingMovies: upcomingMoviesCount,
      allUpcomingMovies: allUpcomingMoviesCount,
      canGenerateRecommendations: likedMoviesCount > 0 && upcomingMoviesCount > 0,
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
 * 
 * This endpoint:
 * 1. Gets all user liked movies and computes average embedding (taste vector)
 * 2. Gets all upcoming movies with embeddings
 * 3. Computes cosine similarity between taste vector and each movie
 * 4. Sorts by similarity score (highest first)
 * 5. Returns top N movies as JSON
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const dislikeWeight = parseFloat(req.query.dislikeWeight) || 0.5;
    
    // Clamp dislikeWeight between 0 and 1
    const clampedDislikeWeight = Math.max(0, Math.min(1, dislikeWeight));
    
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
    });
  } catch (error) {
    next(error);
  }
});

// Export the helper function for use in other routes
export { computeRecommendations };

export default router;

