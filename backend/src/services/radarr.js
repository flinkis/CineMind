import axios from 'axios';

const RADARR_API_KEY = process.env.RADARR_API_KEY;
const RADARR_BASE_URL = process.env.RADARR_BASE_URL; // e.g., http://192.168.1.100:7878

/**
 * Radarr API service
 * Handles interactions with Radarr for adding movies
 */

/**
 * Search for a movie in Radarr by TMDB ID
 */
export async function searchMovieInRadarr(tmdbId) {
  try {
    if (!RADARR_API_KEY || !RADARR_BASE_URL) {
      throw new Error('Radarr is not configured. Please set RADARR_API_KEY and RADARR_BASE_URL in environment variables.');
    }

    const response = await axios.get(`${RADARR_BASE_URL}/api/v3/movie/lookup`, {
      params: {
        term: `tmdb:${tmdbId}`,
      },
      headers: {
        'X-Api-Key': RADARR_API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Radarr search error:', error.message);
    if (error.response) {
      throw new Error(`Radarr API error: ${error.response.data?.message || error.message}`);
    }
    throw new Error(`Failed to search Radarr: ${error.message}`);
  }
}

/**
 * Add a movie to Radarr
 * @param {number} tmdbId - TMDB ID of the movie
 * @param {Object} options - Additional options (qualityProfileId, rootFolderPath, monitored, etc.)
 */
export async function addMovieToRadarr(tmdbId, options = {}) {
  try {
    if (!RADARR_API_KEY || !RADARR_BASE_URL) {
      throw new Error('Radarr is not configured. Please set RADARR_API_KEY and RADARR_BASE_URL in environment variables.');
    }

    // First, search for the movie
    const searchResults = await searchMovieInRadarr(tmdbId);
    
    if (!searchResults || searchResults.length === 0) {
      throw new Error(`Movie with TMDB ID ${tmdbId} not found in Radarr`);
    }

    // Get the movie from search results - it should be an array
    const movie = Array.isArray(searchResults) ? searchResults[0] : searchResults;

    // Get default quality profile and root folder if not provided
    let qualityProfileId = options.qualityProfileId;
    let rootFolderPath = options.rootFolderPath;

    if (!qualityProfileId || !rootFolderPath) {
      try {
        // Fetch quality profiles and root folders
        const [profilesResponse, rootFoldersResponse] = await Promise.all([
          axios.get(`${RADARR_BASE_URL}/api/v3/qualityProfile`, {
            headers: { 'X-Api-Key': RADARR_API_KEY },
          }),
          axios.get(`${RADARR_BASE_URL}/api/v3/rootFolder`, {
            headers: { 'X-Api-Key': RADARR_API_KEY },
          }),
        ]);

        const profiles = profilesResponse.data || [];
        const rootFolders = rootFoldersResponse.data || [];

        if (!qualityProfileId) {
          if (profiles.length === 0) {
            throw new Error('No quality profiles found in Radarr. Please create at least one quality profile in Radarr Settings → Profiles.');
          }
          qualityProfileId = profiles[0].id; // Use first profile
          console.log(`Using quality profile: ${profiles[0].name} (ID: ${qualityProfileId})`);
        }

        if (!rootFolderPath) {
          if (rootFolders.length === 0) {
            throw new Error('No root folders found in Radarr. Please add at least one root folder in Radarr Settings → Media Management → Root Folders.');
          }
          rootFolderPath = rootFolders[0].path; // Use first root folder
          console.log(`Using root folder: ${rootFolderPath}`);
        }
      } catch (error) {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || error.message;
          
          if (status === 401) {
            throw new Error('Invalid Radarr API key. Please check your RADARR_API_KEY in the .env file.');
          } else if (status === 404) {
            throw new Error('Radarr API endpoint not found. Please check your RADARR_BASE_URL is correct.');
          } else {
            throw new Error(`Radarr API error: ${message}`);
          }
        }
        // Re-throw if it's already our custom error
        if (error.message.includes('No quality profiles') || error.message.includes('No root folders')) {
          throw error;
        }
        throw new Error(`Failed to fetch Radarr configuration: ${error.message}`);
      }
    }

    // Check if movie already exists
    try {
      const existingMovieResponse = await axios.get(`${RADARR_BASE_URL}/api/v3/movie`, {
        headers: { 'X-Api-Key': RADARR_API_KEY },
      });

      // Handle different response structures
      let existingMovies = [];
      if (Array.isArray(existingMovieResponse.data)) {
        existingMovies = existingMovieResponse.data;
      } else if (existingMovieResponse.data && Array.isArray(existingMovieResponse.data.items)) {
        existingMovies = existingMovieResponse.data.items;
      } else if (existingMovieResponse.data && typeof existingMovieResponse.data === 'object') {
        // If it's a single movie object, wrap it in an array
        existingMovies = [existingMovieResponse.data];
      }

      const existingMovie = existingMovies.find(m => m.tmdbId === tmdbId);
      if (existingMovie) {
        return {
          success: true,
          message: 'Movie already exists in Radarr',
          movie: existingMovie,
          alreadyExists: true,
        };
      }
    } catch (error) {
      // If checking for existing movies fails, log but continue
      console.warn('Could not check for existing movies in Radarr:', error.message);
      // Continue with adding the movie anyway
    }

    // Prepare movie data for adding
    // Use the movie object from lookup (it already has the correct structure)
    // and only add/override the fields we need to set
    const movieData = {
      ...movie, // Start with all fields from lookup
      qualityProfileId: qualityProfileId,
      rootFolderPath: rootFolderPath,
      monitored: options.monitored !== undefined ? options.monitored : true,
      addOptions: {
        searchForMovie: options.searchForMovie !== undefined ? options.searchForMovie : false,
      },
    };

    // Remove any fields that might cause issues (read-only or internal fields)
    // Keep only what Radarr needs for adding a movie
    // Don't include: status, hasFile, isAvailable, path, folderName (these are set by Radarr)
    const fieldsToKeep = [
      'title', 'titleSlug', 'sortTitle', 'overview', 'inCinemas', 
      'physicalRelease', 'digitalRelease', 'images', 'website', 'year', 
      'youTubeTrailerId', 'studio', 'qualityProfileId', 
      'monitored', 'minimumAvailability', 
      'runtime', 'cleanTitle', 'imdbId', 'tmdbId', 'rootFolderPath', 'addOptions',
      'genres', 'tags', 'ratings'
    ];

    // Filter to only keep allowed fields
    const filteredData = {};
    fieldsToKeep.forEach(field => {
      if (movieData[field] !== undefined && movieData[field] !== null) {
        filteredData[field] = movieData[field];
      }
    });

    // Ensure required fields are present
    if (!filteredData.title) {
      throw new Error('Movie title is required but missing from Radarr lookup response');
    }
    if (!filteredData.tmdbId) {
      throw new Error('Movie TMDB ID is required but missing from Radarr lookup response');
    }

    // Log the data we're sending for debugging
    console.log('Movie data being sent to Radarr:', JSON.stringify(filteredData, null, 2));

    // Ensure URL doesn't have trailing slash
    const baseUrl = RADARR_BASE_URL.replace(/\/$/, '');
    const addUrl = `${baseUrl}/api/v3/movie`;

    console.log('Adding movie to Radarr:', {
      url: addUrl,
      tmdbId: movie.tmdbId,
      title: movie.title,
      qualityProfileId,
      rootFolderPath,
    });

    // Add the movie
    const addResponse = await axios.post(
      addUrl,
      filteredData,
      {
        headers: {
          'X-Api-Key': RADARR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      message: 'Movie added to Radarr successfully',
      movie: addResponse.data,
      alreadyExists: false,
    };
  } catch (error) {
    console.error('Radarr add movie error:', error.message);
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.message || error.message;
      
      if (status === 405) {
        throw new Error(`Method not allowed (405). This usually means the Radarr API endpoint doesn't accept POST requests. Please check your RADARR_BASE_URL is correct and points to a Radarr v3 instance. URL attempted: ${RADARR_BASE_URL}/api/v3/movie`);
      } else if (status === 400) {
        const responseData = error.response.data;
        const detailedError = responseData?.message || responseData?.error || errorMessage;
        console.error('Radarr 400 error details:', JSON.stringify(responseData, null, 2));
        throw new Error(`Bad request (400): ${detailedError}. Check that all required fields (title, tmdbId, qualityProfileId, rootFolderPath) are valid.`);
      } else if (status === 401) {
        throw new Error(`Unauthorized (401): Invalid Radarr API key. Please check your RADARR_API_KEY.`);
      } else {
        throw new Error(`Failed to add movie to Radarr (${status}): ${errorMessage}`);
      }
    }
    throw new Error(`Failed to add movie to Radarr: ${error.message}`);
  }
}

/**
 * Check if Radarr is configured
 */
export function isRadarrConfigured() {
  return !!(RADARR_API_KEY && RADARR_BASE_URL);
}

