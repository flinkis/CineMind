import axios from 'axios';

const SONARR_API_KEY = process.env.SONARR_API_KEY;
const SONARR_BASE_URL = process.env.SONARR_BASE_URL;

/**
 * Helper function to build Sonarr API URLs
 * Handles different URL structures:
 * - http://host:port (standard) -> http://host:port/api/v3/...
 * - http://host:port/sonarr (subdirectory) -> http://host:port/sonarr/api/v3/...
 * - http://host:port/api/v3 (already has API path) -> http://host:port/api/v3/...
 * 
 * @param {string} endpoint - API endpoint (e.g., 'series/lookup', 'qualityProfile')
 * @returns {string} Full API URL
 */
function buildSonarrApiUrl(endpoint) {
  if (!SONARR_BASE_URL) {
    throw new Error('SONARR_BASE_URL is not configured');
  }
  
  // Remove trailing slash
  let baseUrl = SONARR_BASE_URL.replace(/\/$/, '');
  
  // Remove leading slash from endpoint if present
  endpoint = endpoint.replace(/^\//, '');
  
  // Build the API URL based on base URL structure
  if (baseUrl.endsWith('/api/v3')) {
    // Already has /api/v3, just append the endpoint
    return `${baseUrl}/${endpoint}`;
  } else if (baseUrl.endsWith('/api')) {
    // Has /api but not /v3, add v3 and endpoint
    return `${baseUrl}/v3/${endpoint}`;
  } else {
    // Standard case: append /api/v3
    return `${baseUrl}/api/v3/${endpoint}`;
  }
}

/**
 * Sonarr API service
 * Handles interactions with Sonarr for adding TV shows
 */

/**
 * Search for a TV show in Sonarr by TMDB ID
 */
export async function searchTVShowInSonarr(tmdbId) {
  try {
    if (!SONARR_API_KEY || !SONARR_BASE_URL) {
      throw new Error('Sonarr is not configured. Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables.');
    }

    // Build the API URL using the helper function
    const apiUrl = buildSonarrApiUrl('series/lookup');
    
    console.log('Searching Sonarr for TV show:', {
      baseUrl: SONARR_BASE_URL,
      apiUrl,
      tmdbId,
      term: `tmdb:${tmdbId}`,
      hasApiKey: !!SONARR_API_KEY,
    });

    const response = await axios.get(apiUrl, {
      params: {
        term: `tmdb:${tmdbId}`,
      },
      headers: {
        'X-Api-Key': SONARR_API_KEY,
        'Accept': 'application/json',
      },
      // Don't set responseType to 'json' if we want to detect HTML responses
      // But ensure we validate the response format
      validateStatus: function (status) {
        // Accept 200-299, but we'll check the content
        return status >= 200 && status < 300;
      },
    });

    // Check response content type to ensure we got JSON
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      const responsePreview = typeof response.data === 'string' 
        ? response.data.substring(0, 200) 
        : JSON.stringify(response.data).substring(0, 200);
      console.error('Sonarr returned non-JSON response:', {
        contentType,
        status: response.status,
        url: apiUrl,
        responsePreview,
      });
      throw new Error(`Sonarr API returned ${contentType} instead of JSON. This usually means:
1. The API URL is incorrect - check SONARR_BASE_URL (should be like http://flinknas.local:8989/sonar)
2. The API key is invalid - check SONARR_API_KEY in Sonarr Settings → General → Security
3. Sonarr might be behind a reverse proxy - ensure the URL includes the correct subdirectory
Current URL attempted: ${apiUrl}`);
    }

    // Check if we got HTML instead of JSON (safety check)
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype')) {
      throw new Error(`Sonarr returned HTML instead of JSON. This usually means the API URL is incorrect, the API key is invalid, or Sonarr is not accessible. Please check your SONARR_BASE_URL (currently: ${SONARR_BASE_URL}) and SONARR_API_KEY configuration. Attempted URL: ${apiUrl}`);
    }

    // Validate that we got an array
    if (!Array.isArray(response.data)) {
      console.error('Unexpected Sonarr response format:', typeof response.data, response.data);
      throw new Error(`Sonarr lookup returned unexpected format. Expected an array, got ${typeof response.data}. Response: ${JSON.stringify(response.data).substring(0, 200)}`);
    }

    return response.data;
  } catch (error) {
    console.error('Sonarr search error:', error.message);
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      
      // Check if response is HTML (wrong endpoint or auth issue)
      if (typeof error.response.data === 'string' && error.response.data.trim().startsWith('<!doctype')) {
        throw new Error(`Sonarr API returned HTML instead of JSON (Status: ${status}). This usually means the API URL is incorrect, the API key is invalid, or you're not authenticated. Please check your SONARR_BASE_URL (should be like http://localhost:8989) and SONARR_API_KEY configuration.`);
      }
      
      if (status === 401) {
        throw new Error('Invalid Sonarr API key. Please check your SONARR_API_KEY in the .env file.');
      } else if (status === 404) {
        throw new Error(`Sonarr API endpoint not found (404). Please check your SONARR_BASE_URL is correct (should be like http://localhost:8989). Attempted URL: ${error.config?.url || 'unknown'}`);
      } else {
        throw new Error(`Sonarr API error (${status} ${statusText}): ${error.response.data?.message || error.message}`);
      }
    }
    throw new Error(`Failed to search Sonarr: ${error.message}`);
  }
}

/**
 * Add a TV show to Sonarr
 * @param {number} tmdbId - TMDB ID of the TV show
 * @param {Object} options - Additional options (qualityProfileId, rootFolderPath, monitored, etc.)
 */
export async function addTVShowToSonarr(tmdbId, options = {}) {
  try {
    if (!SONARR_API_KEY || !SONARR_BASE_URL) {
      throw new Error('Sonarr is not configured. Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables.');
    }

    // First, search for the TV show
    const searchResults = await searchTVShowInSonarr(tmdbId);
    
    if (!searchResults || searchResults.length === 0) {
      throw new Error(`TV show with TMDB ID ${tmdbId} not found in Sonarr lookup. This might mean the TV show doesn't exist in Sonarr's database or the TMDB ID is incorrect.`);
    }

    // Get the TV show from search results - it should be an array
    const tvShow = Array.isArray(searchResults) ? searchResults[0] : searchResults;
    
    // Log the lookup result for debugging
    console.log('Sonarr lookup result:', JSON.stringify(tvShow, null, 2));
    
    // Validate that we have a valid TV show object
    if (!tvShow || typeof tvShow !== 'object') {
      throw new Error(`Invalid TV show data returned from Sonarr lookup. Expected an object, got: ${typeof tvShow}`);
    }

    // Get default quality profile and root folder if not provided
    let qualityProfileId = options.qualityProfileId;
    let rootFolderPath = options.rootFolderPath;

    if (!qualityProfileId || !rootFolderPath) {
      try {
        // Fetch quality profiles and root folders
        const [profilesResponse, rootFoldersResponse] = await Promise.all([
          axios.get(buildSonarrApiUrl('qualityProfile'), {
            headers: { 'X-Api-Key': SONARR_API_KEY },
          }),
          axios.get(buildSonarrApiUrl('rootFolder'), {
            headers: { 'X-Api-Key': SONARR_API_KEY },
          }),
        ]);

        const profiles = profilesResponse.data || [];
        const rootFolders = rootFoldersResponse.data || [];

        if (!qualityProfileId) {
          if (profiles.length === 0) {
            throw new Error('No quality profiles found in Sonarr. Please create at least one quality profile in Sonarr Settings → Profiles.');
          }
          qualityProfileId = profiles[0].id; // Use first profile
          console.log(`Using quality profile: ${profiles[0].name} (ID: ${qualityProfileId})`);
        }

        if (!rootFolderPath) {
          if (rootFolders.length === 0) {
            throw new Error('No root folders found in Sonarr. Please add at least one root folder in Sonarr Settings → Media Management → Root Folders.');
          }
          rootFolderPath = rootFolders[0].path; // Use first root folder
          console.log(`Using root folder: ${rootFolderPath}`);
        }
      } catch (error) {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.message || error.message;
          
          if (status === 401) {
            throw new Error('Invalid Sonarr API key. Please check your SONARR_API_KEY in the .env file.');
          } else if (status === 404) {
            throw new Error('Sonarr API endpoint not found. Please check your SONARR_BASE_URL is correct.');
          } else {
            throw new Error(`Sonarr API error: ${message}`);
          }
        }
        // Re-throw if it's already our custom error
        if (error.message.includes('No quality profiles') || error.message.includes('No root folders')) {
          throw error;
        }
        throw new Error(`Failed to fetch Sonarr configuration: ${error.message}`);
      }
    }

    // Check if TV show already exists
    try {
      const existingTVShowsResponse = await axios.get(buildSonarrApiUrl('series'), {
        headers: { 'X-Api-Key': SONARR_API_KEY },
      });

      // Handle different response structures
      let existingTVShows = [];
      if (Array.isArray(existingTVShowsResponse.data)) {
        existingTVShows = existingTVShowsResponse.data;
      } else if (existingTVShowsResponse.data && Array.isArray(existingTVShowsResponse.data.items)) {
        existingTVShows = existingTVShowsResponse.data.items;
      } else if (existingTVShowsResponse.data && typeof existingTVShowsResponse.data === 'object') {
        // If it's a single TV show object, wrap it in an array
        existingTVShows = [existingTVShowsResponse.data];
      }

      const existingTVShow = existingTVShows.find(s => s.tvdbId === tvShow.tvdbId || s.tmdbId === tmdbId);
      if (existingTVShow) {
        return {
          success: true,
          message: 'TV show already exists in Sonarr',
          tvShow: existingTVShow,
          alreadyExists: true,
        };
      }
    } catch (error) {
      // If checking for existing TV shows fails, log but continue
      console.warn('Could not check for existing TV shows in Sonarr:', error.message);
      // Continue with adding the TV show anyway
    }

    // Ensure tmdbId is set properly (it might be in externalIds)
    if (!tvShow.tmdbId && tvShow.externalIds?.tmdbId) {
      tvShow.tmdbId = tvShow.externalIds.tmdbId;
    }

    // Prepare TV show data for adding
    // Use the TV show object from lookup (it already has the correct structure)
    // and only add/override the fields we need to set
    // Note: Sonarr's addOptions structure is different from Radarr
    const tvShowData = {
      ...tvShow, // Start with all fields from lookup
      qualityProfileId: qualityProfileId,
      rootFolderPath: rootFolderPath,
      monitored: options.monitored !== undefined ? options.monitored : true,
      addOptions: {
        ignoreEpisodesWithFiles: options.ignoreEpisodesWithFiles !== undefined ? options.ignoreEpisodesWithFiles : false,
        ignoreEpisodesWithoutFiles: options.ignoreEpisodesWithoutFiles !== undefined ? options.ignoreEpisodesWithoutFiles : false,
        monitor: options.monitor || 'all', // 'all', 'future', 'missing', 'existing', 'firstSeason', 'latestSeason', 'none'
        searchForMissingEpisodes: options.searchForMissingEpisodes !== undefined ? options.searchForMissingEpisodes : false,
        searchForCutoffUnmetEpisodes: options.searchForCutoffUnmetEpisodes !== undefined ? options.searchForCutoffUnmetEpisodes : false,
      },
    };

    // Prepare data for adding to Sonarr
    // Start with the lookup result and add/override only what we need to set
    // IMPORTANT: Sonarr expects most fields from the lookup response, but NOT these read-only fields:
    // - id (read-only, assigned by Sonarr)
    // - seasons (created automatically by Sonarr)
    // - path (set by Sonarr based on rootFolderPath)
    // - folderName (set by Sonarr)
    // - statistics (computed by Sonarr)
    const filteredData = {
      ...tvShow, // Start with all fields from lookup
      qualityProfileId: qualityProfileId,
      rootFolderPath: rootFolderPath,
      monitored: options.monitored !== undefined ? options.monitored : true,
      addOptions: {
        ignoreEpisodesWithFiles: options.ignoreEpisodesWithFiles !== undefined ? options.ignoreEpisodesWithFiles : false,
        ignoreEpisodesWithoutFiles: options.ignoreEpisodesWithoutFiles !== undefined ? options.ignoreEpisodesWithoutFiles : false,
        monitor: options.monitor || 'all',
        searchForMissingEpisodes: options.searchForMissingEpisodes !== undefined ? options.searchForMissingEpisodes : false,
        searchForCutoffUnmetEpisodes: options.searchForCutoffUnmetEpisodes !== undefined ? options.searchForCutoffUnmetEpisodes : false,
      },
    };

    // Remove read-only/problematic fields that Sonarr doesn't want in POST requests
    delete filteredData.id;
    // Note: We'll rebuild seasons array based on user selection if seasonNumbers is provided
    const originalSeasons = filteredData.seasons || [];
    delete filteredData.seasons;
    delete filteredData.path;
    delete filteredData.folderName;
    delete filteredData.statistics;
    delete filteredData.added;
    delete filteredData.status;
    
    // If seasonNumbers is provided, build a seasons array with monitored status
    // Otherwise, Sonarr will use default monitoring (all seasons monitored)
    if (options.seasonNumbers && Array.isArray(options.seasonNumbers) && originalSeasons.length > 0) {
      const selectedSeasonNumbers = new Set(options.seasonNumbers.map(num => parseInt(num)));
      filteredData.seasons = originalSeasons.map(season => ({
        seasonNumber: season.seasonNumber,
        monitored: selectedSeasonNumbers.has(season.seasonNumber),
      }));
      console.log('Setting season monitoring:', {
        selectedSeasons: Array.from(selectedSeasonNumbers),
        seasonsConfig: filteredData.seasons,
      });
    }
    
    // If externalIds exists, extract the IDs to the top level if not already there
    if (filteredData.externalIds && !filteredData.tmdbId && filteredData.externalIds.tmdbId) {
      filteredData.tmdbId = filteredData.externalIds.tmdbId;
    }
    if (filteredData.externalIds && !filteredData.tvdbId && filteredData.externalIds.tvdbId) {
      filteredData.tvdbId = filteredData.externalIds.tvdbId;
    }
    // Keep externalIds if it exists (Sonarr might use it), but also ensure IDs are at top level

    // Ensure required fields are present
    // Check for title - it might be in different fields depending on Sonarr version
    if (!filteredData.title) {
      console.error('TV show data missing title field:', JSON.stringify(filteredData, null, 2));
      // Try alternative field names
      if (tvShow.name) {
        filteredData.title = tvShow.name;
        console.log('Using "name" field as title:', tvShow.name);
      } else {
        throw new Error(`TV show title is required but missing from Sonarr lookup response. Available fields: ${Object.keys(tvShow).join(', ')}`);
      }
    }
    if (!filteredData.tmdbId && !filteredData.tvdbId) {
      throw new Error(`TV show TMDB ID or TVDB ID is required but missing from Sonarr lookup response. Available fields: ${Object.keys(tvShow).join(', ')}`);
    }

    // Log the data we're sending for debugging
    console.log('TV show data being sent to Sonarr:', JSON.stringify(filteredData, null, 2));

    // Build the API URL using the helper function
    const addUrl = buildSonarrApiUrl('series');

    console.log('Adding TV show to Sonarr:', {
      url: addUrl,
      tmdbId: tvShow.tmdbId || tvShow.tvdbId,
      title: tvShow.title,
      qualityProfileId,
      rootFolderPath,
    });

    // Add the TV show
    const addResponse = await axios.post(
      addUrl,
      filteredData,
      {
        headers: {
          'X-Api-Key': SONARR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const addedSeries = addResponse.data;

    // If requested, search for missing episodes after adding
    let searchCommand = null;
    if (options.searchForMissingEpisodesAfterAdd) {
      try {
        searchCommand = await searchMissingEpisodes(addedSeries.id);
      } catch (error) {
        // Log but don't fail the add operation if search fails
        console.warn('Failed to search for missing episodes after adding series:', error.message);
      }
    }

    return {
      success: true,
      message: 'TV show added to Sonarr successfully',
      tvShow: addedSeries,
      alreadyExists: false,
      searchCommand: searchCommand,
    };
  } catch (error) {
    console.error('Sonarr add TV show error:', error.message);
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      const errorMessage = responseData?.message || responseData?.error || error.message;
      
      // Log full error details for debugging
      console.error('Sonarr API error response:', {
        status,
        statusText: error.response.statusText,
        data: responseData,
      });
      
      if (status === 405) {
        throw new Error(`Method not allowed (405). This usually means the Sonarr API endpoint doesn't accept POST requests. Please check your SONARR_BASE_URL is correct and points to a Sonarr v3 instance. URL attempted: ${buildSonarrApiUrl('series')}`);
      } else if (status === 400) {
        const detailedError = responseData?.message || responseData?.error || errorMessage;
        console.error('Sonarr 400 error details:', JSON.stringify(responseData, null, 2));
        throw new Error(`Bad request (400): ${detailedError}. Check that all required fields (title, tmdbId/tvdbId, qualityProfileId, rootFolderPath) are valid.`);
      } else if (status === 401) {
        throw new Error(`Unauthorized (401): Invalid Sonarr API key. Please check your SONARR_API_KEY.`);
      } else if (status === 500) {
        // Internal server error - likely an issue with the data format
        const detailedError = responseData?.message || responseData?.error || errorMessage;
        console.error('Sonarr 500 error details:', JSON.stringify(responseData, null, 2));
        throw new Error(`Sonarr server error (500): ${detailedError || 'The request format may be incorrect. Please check the TV show data and Sonarr configuration.'}`);
      } else {
        throw new Error(`Failed to add TV show to Sonarr (${status}): ${errorMessage}`);
      }
    }
    throw new Error(`Failed to add TV show to Sonarr: ${error.message}`);
  }
}

/**
 * Check if Sonarr is configured
 */
export function isSonarrConfigured() {
  return !!(SONARR_API_KEY && SONARR_BASE_URL);
}

/**
 * Search for missing episodes in a series
 * Uses Sonarr's command API to trigger a search
 * @param {number} seriesId - Sonarr series ID
 */
export async function searchMissingEpisodes(seriesId) {
  try {
    if (!SONARR_API_KEY || !SONARR_BASE_URL) {
      throw new Error('Sonarr is not configured. Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables.');
    }

    const commandUrl = buildSonarrApiUrl('command');
    const response = await axios.post(
      commandUrl,
      {
        name: 'SeriesSearch',
        seriesId: seriesId,
      },
      {
        headers: {
          'X-Api-Key': SONARR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      message: 'Search for missing episodes initiated',
      command: response.data,
    };
  } catch (error) {
    console.error('Sonarr search missing episodes error:', error.message);
    if (error.response) {
      throw new Error(`Sonarr API error: ${error.response.data?.message || error.message}`);
    }
    throw new Error(`Failed to search for missing episodes: ${error.message}`);
  }
}

/**
 * Search for missing episodes in a specific season
 * @param {number} seriesId - Sonarr series ID
 * @param {number} seasonNumber - Season number
 */
export async function searchMissingSeason(seriesId, seasonNumber) {
  try {
    if (!SONARR_API_KEY || !SONARR_BASE_URL) {
      throw new Error('Sonarr is not configured. Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables.');
    }

    const commandUrl = buildSonarrApiUrl('command');
    const response = await axios.post(
      commandUrl,
      {
        name: 'SeasonSearch',
        seriesId: seriesId,
        seasonNumber: seasonNumber,
      },
      {
        headers: {
          'X-Api-Key': SONARR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      message: `Search for missing episodes in season ${seasonNumber} initiated`,
      command: response.data,
    };
  } catch (error) {
    console.error('Sonarr search missing season error:', error.message);
    if (error.response) {
      throw new Error(`Sonarr API error: ${error.response.data?.message || error.message}`);
    }
    throw new Error(`Failed to search for missing season: ${error.message}`);
  }
}

/**
 * Search for a specific episode
 * @param {number} episodeId - Sonarr episode ID
 */
export async function searchEpisode(episodeId) {
  try {
    if (!SONARR_API_KEY || !SONARR_BASE_URL) {
      throw new Error('Sonarr is not configured. Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables.');
    }

    const commandUrl = buildSonarrApiUrl('command');
    const response = await axios.post(
      commandUrl,
      {
        name: 'EpisodeSearch',
        episodeIds: [episodeId],
      },
      {
        headers: {
          'X-Api-Key': SONARR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      message: 'Search for episode initiated',
      command: response.data,
    };
  } catch (error) {
    console.error('Sonarr search episode error:', error.message);
    if (error.response) {
      throw new Error(`Sonarr API error: ${error.response.data?.message || error.message}`);
    }
    throw new Error(`Failed to search for episode: ${error.message}`);
  }
}

/**
 * Get missing episodes (wanted/missing)
 * @param {Object} params - Query parameters (page, pageSize, sortKey, sortDirection, etc.)
 */
export async function getMissingEpisodes(params = {}) {
  try {
    if (!SONARR_API_KEY || !SONARR_BASE_URL) {
      throw new Error('Sonarr is not configured. Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables.');
    }

    const wantedUrl = buildSonarrApiUrl('wanted/missing');
    const response = await axios.get(
      wantedUrl,
      {
        params: {
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          sortKey: params.sortKey || 'airDateUtc',
          sortDirection: params.sortDirection || 'descending',
          ...params,
        },
        headers: {
          'X-Api-Key': SONARR_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Sonarr get missing episodes error:', error.message);
    if (error.response) {
      throw new Error(`Sonarr API error: ${error.response.data?.message || error.message}`);
    }
    throw new Error(`Failed to get missing episodes: ${error.message}`);
  }
}

/**
 * Get Sonarr series by TMDB ID
 * @param {number} tmdbId - TMDB ID of the series
 */
export async function getSeriesByTmdbId(tmdbId) {
  try {
    if (!SONARR_API_KEY || !SONARR_BASE_URL) {
      throw new Error('Sonarr is not configured. Please set SONARR_API_KEY and SONARR_BASE_URL in environment variables.');
    }

    const seriesUrl = buildSonarrApiUrl('series');
    const response = await axios.get(
      seriesUrl,
      {
        headers: {
          'X-Api-Key': SONARR_API_KEY,
        },
      }
    );

    const series = Array.isArray(response.data) ? response.data : [];
    const foundSeries = series.find(s => s.tmdbId === tmdbId || s.externalIds?.tmdbId === tmdbId);
    
    return foundSeries || null;
  } catch (error) {
    console.error('Sonarr get series error:', error.message);
    if (error.response) {
      throw new Error(`Sonarr API error: ${error.response.data?.message || error.message}`);
    }
    throw new Error(`Failed to get series: ${error.message}`);
  }
}

