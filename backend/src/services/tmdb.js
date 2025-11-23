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
export async function searchMovies(query, page = 1, includeAdult = true) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        page,
        language: 'en-US',
        include_adult: includeAdult,
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
 * Map our sort option to TMDB's sort_by parameter
 * Returns null if the sort is not supported by TMDB (requires client-side sorting)
 * 
 * @param {string} sortBy - Our sort option (e.g., 'rating-desc', 'release-desc')
 * @returns {string|null} TMDB sort_by parameter or null
 */
export function mapSortToTmdbSortBy(sortBy) {
  const sortMap = {
    'rating-desc': 'vote_average.desc',
    'rating-asc': 'vote_average.asc',
    'release-desc': 'release_date.desc',
    'release-asc': 'release_date.asc',
    'popularity-desc': 'popularity.desc',
    'popularity-asc': 'popularity.asc',
    'default': 'popularity.desc', // Default to popularity
  };

  return sortMap[sortBy] || null;
}

/**
 * Get upcoming movies from TMDB
 * Fetches movies that are scheduled for release in the future
 * Uses discover endpoint to support sorting across all pages
 */
export async function getUpcomingMovies(page = 1, sortBy = null) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    // Calculate date range for "upcoming" (from today to 6 months ahead)
    const today = new Date();
    const sixMonthsAhead = new Date(today);
    sixMonthsAhead.setMonth(today.getMonth() + 6);

    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = sixMonthsAhead.toISOString().split('T')[0];

    // If sortBy is provided and can be mapped to TMDB, use discover endpoint
    // Otherwise, use the original endpoint (for default/unsupported sorts)
    const tmdbSortBy = sortBy ? mapSortToTmdbSortBy(sortBy) : 'release_date.asc';

    if (tmdbSortBy && sortBy !== 'default') {
      // Use discover endpoint for TMDB-supported sorts
      return await discoverMovies({
        page,
        sortBy: tmdbSortBy,
        filters: {
          'primary_release_date.gte': dateFrom,
          'primary_release_date.lte': dateTo,
          'with_release_type': '2|3', // Theatrical or Digital releases
        },
      });
    }

    // Fall back to original endpoint for default behavior
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
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch upcoming movies: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch upcoming movies: ${error.message}`);
  }
}

/**
 * Get popular movies
 * Uses discover endpoint to support sorting across all pages
 */
export async function getPopularMovies(page = 1, sortBy = null) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    // If sortBy is provided and can be mapped to TMDB, use discover endpoint
    // Otherwise, use the original endpoint (for default/unsupported sorts)
    const tmdbSortBy = sortBy ? mapSortToTmdbSortBy(sortBy) : 'popularity.desc';

    if (tmdbSortBy && sortBy !== 'default') {
      // Use discover endpoint for TMDB-supported sorts
      return await discoverMovies({
        page,
        sortBy: tmdbSortBy,
        filters: {},
      });
    }

    // Fall back to original endpoint for default behavior
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
 * Uses discover endpoint to support sorting across all pages
 */
export async function getTopRatedMovies(page = 1, sortBy = null) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    // If sortBy is provided and can be mapped to TMDB, use discover endpoint
    // Otherwise, use the original endpoint (for default/unsupported sorts)
    const tmdbSortBy = sortBy ? mapSortToTmdbSortBy(sortBy) : 'vote_average.desc';

    if (tmdbSortBy && sortBy !== 'default') {
      // Use discover endpoint for TMDB-supported sorts
      // Filter for movies with minimum vote count for quality
      return await discoverMovies({
        page,
        sortBy: tmdbSortBy,
        filters: {
          'vote_count.gte': 50, // Minimum votes for quality
        },
      });
    }

    // Fall back to original endpoint for default behavior
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
 * Uses discover endpoint to support sorting across all pages
 */
export async function getNowPlayingMovies(page = 1, sortBy = null) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    // Calculate date range for "now playing" (last 2 weeks to 1 month ahead)
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);
    const oneMonthAhead = new Date(today);
    oneMonthAhead.setDate(today.getDate() + 30);

    const dateFrom = twoWeeksAgo.toISOString().split('T')[0];
    const dateTo = oneMonthAhead.toISOString().split('T')[0];

    // If sortBy is provided and can be mapped to TMDB, use discover endpoint
    // Otherwise, use the original endpoint (for default/unsupported sorts)
    const tmdbSortBy = sortBy ? mapSortToTmdbSortBy(sortBy) : 'release_date.desc';

    if (tmdbSortBy && sortBy !== 'default') {
      // Use discover endpoint for TMDB-supported sorts
      return await discoverMovies({
        page,
        sortBy: tmdbSortBy,
        filters: {
          'primary_release_date.gte': dateFrom,
          'primary_release_date.lte': dateTo,
          'with_release_type': '2|3', // Theatrical or Digital releases
        },
      });
    }

    // Fall back to original endpoint for default behavior
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
        append_to_response: 'movie_credits,tv_credits,external_ids',
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

/**
 * Discover movies using TMDB discover endpoint
 * This endpoint supports sort_by parameter for proper cross-page sorting
 * 
 * @param {Object} options - Discover options
 * @param {number} options.page - Page number (default: 1)
 * @param {string} options.sortBy - TMDB sort_by parameter (e.g., 'popularity.desc', 'release_date.desc', 'vote_average.desc')
 * @param {Object} options.filters - Additional filters (e.g., { 'primary_release_date.gte': '2024-01-01' })
 * @returns {Promise<Object>} TMDB response with results
 */
export async function discoverMovies({ page = 1, sortBy = 'popularity.desc', filters = {} } = {}) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const params = {
      api_key: TMDB_API_KEY,
      page,
      language: 'en-US',
      sort_by: sortBy,
      ...filters,
    };

    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, { params });
    return response.data;
  } catch (error) {
    console.error('TMDB discover movies error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to discover movies: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to discover movies: ${error.message}`);
  }
}

// ============================================================================
// TV SHOWS FUNCTIONS
// ============================================================================

/**
 * Search TV shows by title
 */
export async function searchTV(query, page = 1, includeAdult = true) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        page,
        language: 'en-US',
        include_adult: includeAdult,
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB TV search error:', error.message);
    throw new Error(`Failed to search TV shows: ${error.message}`);
  }
}

/**
 * Get TV show details by TMDB ID
 */
export async function getTVDetails(tmdbId) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        append_to_response: 'videos,external_ids,credits',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB TV details error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to get TV show details: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to get TV show details: ${error.message}`);
  }
}

/**
 * Get similar TV shows by TMDB ID
 */
export async function getSimilarTV(tmdbId, page = 1) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}/similar`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB similar TV error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to get similar TV shows: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to get similar TV shows: ${error.message}`);
  }
}

/**
 * Format TV show data for our application
 */
export function formatTVData(tv) {
  return {
    tmdbId: tv.id,
    title: tv.name,
    overview: tv.overview || '',
    posterPath: tv.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${tv.poster_path}`
      : null,
    releaseDate: tv.first_air_date || null,
    popularity: tv.popularity || 0,
    voteAverage: tv.vote_average || 0,
    firstAirDate: tv.first_air_date || null,
    lastAirDate: tv.last_air_date || null,
  };
}

/**
 * Discover TV shows using TMDB discover endpoint
 * 
 * @param {Object} options - Discover options
 * @param {number} options.page - Page number (default: 1)
 * @param {string} options.sortBy - TMDB sort_by parameter (e.g., 'popularity.desc', 'first_air_date.desc', 'vote_average.desc')
 * @param {Object} options.filters - Additional filters (e.g., { 'first_air_date.gte': '2024-01-01' })
 * @returns {Promise<Object>} TMDB response with results
 */
export async function discoverTV({ page = 1, sortBy = 'popularity.desc', filters = {} } = {}) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const params = {
      api_key: TMDB_API_KEY,
      page,
      language: 'en-US',
      sort_by: sortBy,
      ...filters,
    };

    const response = await axios.get(`${TMDB_BASE_URL}/discover/tv`, { params });
    return response.data;
  } catch (error) {
    console.error('TMDB discover TV error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to discover TV shows: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to discover TV shows: ${error.message}`);
  }
}

/**
 * Map our sort option to TMDB's sort_by parameter for TV shows
 */
export function mapSortToTmdbSortByTV(sortBy) {
  const sortMap = {
    'rating-desc': 'vote_average.desc',
    'rating-asc': 'vote_average.asc',
    'release-desc': 'first_air_date.desc',
    'release-asc': 'first_air_date.asc',
    'popularity-desc': 'popularity.desc',
    'popularity-asc': 'popularity.asc',
    'default': 'popularity.desc',
  };

  return sortMap[sortBy] || null;
}

/**
 * Get popular TV shows
 */
export async function getPopularTV(page = 1, sortBy = null, filters = {}) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const tmdbSortBy = sortBy ? mapSortToTmdbSortByTV(sortBy) : 'popularity.desc';

    // If filters are provided or sort is not default, use discover endpoint
    if (Object.keys(filters).length > 0 || (tmdbSortBy && sortBy !== 'default')) {
      return await discoverTV({
        page,
        sortBy: tmdbSortBy || 'popularity.desc',
        filters,
      });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB popular TV error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch popular TV shows: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch popular TV shows: ${error.message}`);
  }
}

/**
 * Get top rated TV shows
 */
export async function getTopRatedTV(page = 1, sortBy = null, filters = {}) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const tmdbSortBy = sortBy ? mapSortToTmdbSortByTV(sortBy) : 'vote_average.desc';

    // If filters are provided or sort is not default, use discover endpoint
    const discoverFilters = {
      'vote_count.gte': 50,
      ...filters, // User filters override defaults
    };

    if (Object.keys(filters).length > 0 || (tmdbSortBy && sortBy !== 'default')) {
      return await discoverTV({
        page,
        sortBy: tmdbSortBy || 'vote_average.desc',
        filters: discoverFilters,
      });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/tv/top_rated`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB top rated TV error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch top rated TV shows: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch top rated TV shows: ${error.message}`);
  }
}

/**
 * Get on the air TV shows (currently airing)
 */
export async function getOnTheAirTV(page = 1, sortBy = null, filters = {}) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const tmdbSortBy = sortBy ? mapSortToTmdbSortByTV(sortBy) : 'popularity.desc';

    // If filters are provided or sort is not default, use discover endpoint
    const today = new Date();
    const dateFrom = today.toISOString().split('T')[0];
    const sixMonthsAhead = new Date(today);
    sixMonthsAhead.setMonth(today.getMonth() + 6);
    const dateTo = sixMonthsAhead.toISOString().split('T')[0];

    const discoverFilters = {
      'first_air_date.gte': dateFrom,
      'first_air_date.lte': dateTo,
      'with_status': '0', // Returning Series
      ...filters, // User filters override defaults (status can be overridden)
    };

    if (Object.keys(filters).length > 0 || (tmdbSortBy && sortBy !== 'default')) {
      return await discoverTV({
        page,
        sortBy: tmdbSortBy || 'popularity.desc',
        filters: discoverFilters,
      });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/tv/on_the_air`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB on the air TV error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch on the air TV shows: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch on the air TV shows: ${error.message}`);
  }
}

/**
 * Get airing today TV shows
 */
export async function getAiringTodayTV(page = 1, sortBy = null, filters = {}) {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const tmdbSortBy = sortBy ? mapSortToTmdbSortByTV(sortBy) : 'popularity.desc';

    // If filters are provided or sort is not default, use discover endpoint
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const discoverFilters = {
      'air_date.gte': dateStr,
      'air_date.lte': dateStr,
      ...filters, // User filters override defaults
    };

    if (Object.keys(filters).length > 0 || (tmdbSortBy && sortBy !== 'default')) {
      return await discoverTV({
        page,
        sortBy: tmdbSortBy || 'popularity.desc',
        filters: discoverFilters,
      });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/tv/airing_today`, {
      params: {
        api_key: TMDB_API_KEY,
        page,
        language: 'en-US',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB airing today TV error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch airing today TV shows: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch airing today TV shows: ${error.message}`);
  }
}

/**
 * Get movie genres
 */
export async function getMovieGenres() {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
      },
    });
    return response.data.genres || [];
  } catch (error) {
    console.error('TMDB movie genres error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch movie genres: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch movie genres: ${error.message}`);
  }
}

/**
 * Get TV show genres
 */
export async function getTVGenres() {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/genre/tv/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
      },
    });
    return response.data.genres || [];
  } catch (error) {
    console.error('TMDB TV genres error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch TV genres: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch TV genres: ${error.message}`);
  }
}

/**
 * Get available languages from TMDB
 */
export async function getLanguages() {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/configuration/languages`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    // Return languages sorted by English name
    const languages = Array.isArray(response.data) ? response.data : [];
    return languages.sort((a, b) => a.english_name.localeCompare(b.english_name));
  } catch (error) {
    console.error('TMDB languages error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch languages: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch languages: ${error.message}`);
  }
}

/**
 * Get TV streaming services
 * Note: TMDB doesn't have a dedicated networks endpoint, so we'll use a workaround
 * We return a curated list of popular streaming services
 */
export async function getTVNetworks() {
  try {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured in environment variables');
    }

    // Common streaming services with their TMDB network IDs
    // Note: For streaming services, TMDB uses network IDs that may differ from watch provider IDs
    // Disney+ network ID: 2739 (not 287 which is Disney Channel)
    // HBO vs HBO Max: HBO (49) is the cable network, HBO Max (3186) is the streaming service
    // These IDs represent where shows are originally produced/distributed
    const commonNetworks = [
      { id: 213, name: 'Netflix' },
      { id: 3186, name: 'HBO Max' }, // Streaming service
      { id: 49, name: 'HBO' }, // Cable network (kept for legacy content)
      { id: 2552, name: 'Apple TV+' },
      { id: 1024, name: 'Amazon Prime Video' },
      { id: 2739, name: 'Disney+' }, // Updated: correct Disney+ network ID
      { id: 4330, name: 'Paramount+' }, // Streaming service (correct ID, was incorrectly removed as duplicate)
      { id: 453, name: 'Hulu' }, // Streaming service (network ID, updated from incorrect 1292 - note: 15 is watch provider ID, not network ID)
      { id: 67, name: 'Showtime' },
      { id: 3353, name: 'Peacock' }, // Streaming service (corrected: was incorrectly labeled as Paramount Network)
      { id: 352, name: 'TV 4' }, // Swedish television network
      // Note: ID 283 is Paramount Network (cable), not Paramount+ streaming
      // Note: ID 3826 was incorrect for Paramount+
    ];

    // Remove duplicates (same network ID appearing multiple times)
    // Keep only unique entries based on ID
    const networksMap = new Map();
    commonNetworks.forEach(network => {
      if (!networksMap.has(network.id)) {
        networksMap.set(network.id, {
          id: network.id,
          name: network.name,
          logoPath: null,
        });
      }
    });

    // Sort by name and return
    return Array.from(networksMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('TMDB TV networks error:', error.message);
    if (error.response) {
      console.error('TMDB API response:', error.response.data);
      throw new Error(`Failed to fetch TV networks: ${error.response.data.status_message || error.message}`);
    }
    throw new Error(`Failed to fetch TV networks: ${error.message}`);
  }
}
