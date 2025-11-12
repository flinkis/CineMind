import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * TMDB API service
 * Handles all interactions with The Movie Database API
 */

/**
 * Search movies by title
 */
export async function searchMovies(query, page = 1) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        page,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB search error:', error.message);
    throw new Error(`Failed to search movies: ${error.message}`);
  }
}

/**
 * Get movie details by TMDB ID
 */
export async function getMovieDetails(tmdbId) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB details error:', error.message);
    throw new Error(`Failed to get movie details: ${error.message}`);
  }
}

/**
 * Get upcoming movies from TMDB
 * Fetches movies that are scheduled for release in the future
 */
export async function getUpcomingMovies(page = 1) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'en-US',
        region: 'US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB upcoming movies error:', error.message);
    throw new Error(`Failed to fetch upcoming movies: ${error.message}`);
  }
}

/**
 * Get popular movies
 */
export async function getPopularMovies(page = 1) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB popular movies error:', error.message);
    throw new Error(`Failed to fetch popular movies: ${error.message}`);
  }
}

/**
 * Format movie data for our application
 */
export function formatMovieData(movie) {
  return {
    tmdbId: movie.id,
    title: movie.title,
    overview: movie.overview || '',
    posterPath: movie.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
      : null,
    releaseDate: movie.release_date || null,
    popularity: movie.popularity || 0,
    voteAverage: movie.vote_average || 0,
  };
}

/**
 * Get full poster URL
 */
export function getPosterUrl(posterPath) {
  if (!posterPath) return null;
  if (posterPath.startsWith('http')) return posterPath;
  return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
}

