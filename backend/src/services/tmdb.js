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
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        append_to_response: 'videos,external_ids,credits,keywords',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB details error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to get movie details: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to get movie details: ${error.message}`);
  }
}

/**
 * Get movie videos (trailers, teasers, etc.) by TMDB ID
 */
export async function getMovieVideos(tmdbId) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/videos`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB videos error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to get movie videos: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to get movie videos: ${error.message}`);
  }
}

/**
 * Get movie external IDs (IMDB, etc.) by TMDB ID
 */
export async function getMovieExternalIds(tmdbId) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/external_ids`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB external IDs error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to get movie external IDs: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to get movie external IDs: ${error.message}`);
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
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

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
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch popular movies: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch popular movies: ${error.message}`);
  }
}

/**
 * Get top rated movies
 */
export async function getTopRatedMovies(page = 1) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/top_rated`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB top rated movies error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch top rated movies: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch top rated movies: ${error.message}`);
  }
}

/**
 * Get now playing movies
 */
export async function getNowPlayingMovies(page = 1) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'en-US',
        region: 'US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB now playing movies error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch now playing movies: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch now playing movies: ${error.message}`);
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
 * Get similar movies by TMDB ID
 */
export async function getSimilarMovies(tmdbId, page = 1) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/similar`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB similar movies error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to get similar movies: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to get similar movies: ${error.message}`);
  }
}

/**
 * Get person details by TMDB ID (including filmography)
 */
export async function getPersonDetails(personId) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/person/${personId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        append_to_response: 'movie_credits,external_ids',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB person details error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to get person details: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to get person details: ${error.message}`);
  }
}

/**
 * Get full poster URL
 */
export function getPosterUrl(posterPath) {
  if (!posterPath) return null;
  if (posterPath.startsWith('http')) return posterPath;
  return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
}

