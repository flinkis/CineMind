/**
 * User Preferences Service
 * Provides utilities for adding user preference status (liked/disliked) to movies
 */

import { prisma } from '../server.js';

/**
 * Add liked/disliked status to an array of movies
 * Fetches all liked and disliked movies once, then checks each movie efficiently
 * 
 * @param {Array} movies - Array of movie objects to enrich
 * @returns {Array} Movies with isLiked and isDisliked properties added
 */
export async function addUserPreferencesToMovies(movies) {
  if (!movies || movies.length === 0) {
    return movies;
  }

  try {
    // Fetch all liked and disliked movies once
    const [likedMovies, dislikedMovies] = await Promise.all([
      prisma.userLike.findMany({
        select: { tmdbId: true },
      }),
      prisma.userDislike.findMany({
        select: { tmdbId: true },
      }),
    ]);

    // Create Sets for O(1) lookup
    const likedTmdbIds = new Set(likedMovies.map(m => m.tmdbId));
    const dislikedTmdbIds = new Set(dislikedMovies.map(m => m.tmdbId));

    // Add isLiked and isDisliked to each movie
    return movies.map(movie => {
      const tmdbId = movie.tmdbId || movie.id;
      return {
        ...movie,
        isLiked: likedTmdbIds.has(tmdbId),
        isDisliked: dislikedTmdbIds.has(tmdbId),
      };
    });
  } catch (error) {
    // If there's an error fetching preferences, just return movies without status
    // (e.g., user preferences might be optional)
    console.error('Error fetching user preferences:', error);
    return movies.map(movie => ({
      ...movie,
      isLiked: false,
      isDisliked: false,
    }));
  }
}

/**
 * Add liked/disliked status to a single movie
 * 
 * @param {Object} movie - Movie object to enrich
 * @returns {Object} Movie with isLiked and isDisliked properties added
 */
export async function addUserPreferencesToMovie(movie) {
  if (!movie) {
    return movie;
  }

  const [results] = await addUserPreferencesToMovies([movie]);
  return results;
}

