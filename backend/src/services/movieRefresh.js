import { prisma } from '../server.js';
import {
  getUpcomingMovies,
  getMovieDetails,
  formatMovieData,
} from './tmdb.js';
import {
  computeMovieEmbedding,
  stringifyEmbedding,
} from './embeddings.js';
import { clearNormalizationCache } from './matchScore.js';

/**
 * Movie Refresh Service
 * Handles fetching upcoming movies from TMDB and computing embeddings
 */

/**
 * Refresh upcoming movies from TMDB
 * @param {Object} options - Refresh options
 * @param {number} options.page - Page number to start from (default: 1)
 * @param {number|null} options.maxPages - Maximum number of pages to fetch. Use null, Infinity, or 0 to fetch all pages (default: null, which fetches all pages)
 * @param {boolean} options.force - Force refresh even if movies were recently updated (default: false)
 * @returns {Promise<Object>} Refresh statistics with pagesFetched, totalPages, totalFetched, totalProcessed, totalUpdated, totalErrors
 */
export async function refreshUpcomingMovies(options = {}) {
  // Default to fetching all pages (null means fetch all)
  const { page = 1, maxPages = null, force = false } = options;

  let totalFetched = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let pageErrors = 0; // Track consecutive page errors
  let totalPages = null;
  let pagesFetched = 0;

  try {
    // Determine if we should fetch all pages
    const fetchAllPages = maxPages === null || maxPages === Infinity || maxPages === 0;
    const logMessage = fetchAllPages 
      ? `🔄 Starting movie refresh: page=${page}, fetching ALL pages, force=${force}`
      : `🔄 Starting movie refresh: page=${page}, maxPages=${maxPages}, force=${force}`;
    console.log(logMessage);

    let currentPage = page;
    let lastPage = null;
    let maxAttempts = 1000; // Safety limit to prevent infinite loops
    let attempts = 0;

    // Fetch movies page by page
    while (attempts < maxAttempts) {
      attempts++;
      
      // Check if we've reached the max pages limit (if not fetching all)
      if (!fetchAllPages && currentPage >= page + maxPages) {
        console.log(`Reached max pages limit (${maxPages} pages, from page ${page})`);
        break;
      }
      
      // Safety check: if we're fetching all pages but don't know total pages yet,
      // and we've attempted many pages, something might be wrong
      if (fetchAllPages && totalPages === null && attempts > 100) {
        console.warn(`⚠️  Attempted ${attempts} pages but still don't know total pages. This might indicate an issue.`);
        // Continue anyway, but log a warning
      }

      try {
        const tmdbResponse = await getUpcomingMovies(currentPage);
        const movies = tmdbResponse.results || [];

        // Set total pages from first response if not set
        if (totalPages === null) {
          totalPages = tmdbResponse.total_pages || 1;
          lastPage = totalPages;
          console.log(`📚 Total pages available: ${totalPages}`);
        }

        if (movies.length === 0) {
          console.log(`No movies found on page ${currentPage}`);
          break;
        }

        totalFetched += movies.length;
        pagesFetched++;
        console.log(`📥 Fetched ${movies.length} movies from page ${currentPage}/${totalPages}`);

        // Process each movie
        for (const tmdbMovie of movies) {
          try {
            const movieData = formatMovieData(tmdbMovie);

            // Check if movie exists and was recently updated (skip if not forcing)
            if (!force) {
              const existingMovie = await prisma.movie.findUnique({
                where: { tmdbId: movieData.tmdbId },
              });

              // Skip if movie exists and was updated in the last 24 hours
              if (existingMovie && existingMovie.updatedAt) {
                const hoursSinceUpdate =
                  (Date.now() - new Date(existingMovie.updatedAt).getTime()) /
                  (1000 * 60 * 60);
                if (hoursSinceUpdate < 24 && existingMovie.embedding) {
                  // Skip without logging to reduce noise (we'll log progress periodically)
                  continue;
                }
              }
            }

            // Fetch full movie details (with credits, keywords, etc.) for richer embeddings
            const fullMovieDetails = await getMovieDetails(tmdbMovie.id);

            // Compute embedding with full TMDB data for richer representation
            const embedding = await computeMovieEmbedding(
              movieData,
              fullMovieDetails
            );
            const embeddingString = stringifyEmbedding(embedding);

            // Check if movie exists
            const existingMovie = await prisma.movie.findUnique({
              where: { tmdbId: movieData.tmdbId },
            });

            if (existingMovie) {
              // Update existing movie
              await prisma.movie.update({
                where: { tmdbId: movieData.tmdbId },
                data: {
                  title: movieData.title,
                  overview: movieData.overview,
                  posterPath: movieData.posterPath,
                  releaseDate: movieData.releaseDate,
                  popularity: movieData.popularity,
                  voteAverage: movieData.voteAverage,
                  embedding: embeddingString,
                  isUpcoming: true,
                  updatedAt: new Date(),
                },
              });
              totalUpdated++;
            } else {
              // Create new movie
              await prisma.movie.create({
                data: {
                  tmdbId: movieData.tmdbId,
                  title: movieData.title,
                  overview: movieData.overview,
                  posterPath: movieData.posterPath,
                  releaseDate: movieData.releaseDate,
                  popularity: movieData.popularity,
                  voteAverage: movieData.voteAverage,
                  embedding: embeddingString,
                  isUpcoming: true,
                },
              });
              totalProcessed++;
            }
            
            // Log progress every 20 movies to reduce noise
            const totalProcessedSoFar = totalProcessed + totalUpdated;
            if (totalProcessedSoFar > 0 && totalProcessedSoFar % 20 === 0) {
              console.log(`📊 Progress: ${totalProcessedSoFar} movies processed (${totalProcessed} new, ${totalUpdated} updated)...`);
            }
          } catch (error) {
            totalErrors++;
            console.error(
              `❌ Error processing movie ${tmdbMovie.id} (${tmdbMovie.title}):`,
              error.message
            );
            // Continue with next movie even if one fails
          }
        }

        // Reset page error counter on successful page fetch
        pageErrors = 0;

        // Check if we've reached the last page
        // Update lastPage if TMDB reports a different total (shouldn't happen, but be safe)
        if (tmdbResponse.total_pages && tmdbResponse.total_pages !== lastPage) {
          lastPage = tmdbResponse.total_pages;
          totalPages = tmdbResponse.total_pages;
        }
        
        // If we've reached the last page, break
        if (lastPage && currentPage >= lastPage) {
          console.log(`✅ Reached last page (${lastPage} of ${totalPages})`);
          break;
        }

        // Move to next page
        currentPage++;

        // Add a small delay between pages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error fetching page ${currentPage}:`, error.message);
        pageErrors++;
        totalErrors++;
        
        // If we've had too many consecutive page errors, stop
        // (Individual movie errors don't count towards this limit)
        if (pageErrors >= 5) {
          console.error(`❌ Too many consecutive page errors (${pageErrors}), stopping refresh`);
          break;
        }
        
        // Try to continue with next page
        currentPage++;
        
        // Add delay before retrying next page
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Refresh complete: ${pagesFetched} pages, ${totalFetched} movies fetched, ${totalProcessed} created, ${totalUpdated} updated, ${totalErrors} errors`);

    // Clear normalization cache when movies are refreshed (reference set changed)
    // This ensures match scores use the updated set of upcoming movies
    if (totalProcessed > 0 || totalUpdated > 0) {
      clearNormalizationCache();
      console.log('🔄 Cleared normalization cache (movies updated)');
    }

    return {
      success: true,
      stats: {
        pagesFetched,
        totalPages,
        totalFetched,
        totalProcessed,
        totalUpdated,
        totalErrors,
      },
    };
  } catch (error) {
    console.error('❌ Error in refreshUpcomingMovies:', error);
    return {
      success: false,
      error: error.message,
      stats: {
        pagesFetched: 0,
        totalPages: null,
        totalFetched,
        totalProcessed,
        totalUpdated,
        totalErrors,
      },
    };
  }
}

/**
 * Check if movies need to be refreshed
 * @returns {Promise<Object>} Status information
 */
export async function getRefreshStatus() {
  try {
    // Count upcoming movies with embeddings
    const upcomingMoviesCount = await prisma.movie.count({
      where: {
        isUpcoming: true,
        embedding: {
          not: null,
        },
      },
    });

    // Get the most recently updated movie
    const mostRecentMovie = await prisma.movie.findFirst({
      where: {
        isUpcoming: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const hoursSinceLastUpdate = mostRecentMovie
      ? (Date.now() - new Date(mostRecentMovie.updatedAt).getTime()) /
        (1000 * 60 * 60)
      : Infinity;

    // Consider movies stale if they haven't been updated in 24 hours
    const isStale = hoursSinceLastUpdate > 24;

    return {
      upcomingMoviesCount,
      lastUpdate: mostRecentMovie?.updatedAt || null,
      hoursSinceLastUpdate: mostRecentMovie ? hoursSinceLastUpdate : null,
      isStale,
      needsRefresh: upcomingMoviesCount === 0 || isStale,
    };
  } catch (error) {
    console.error('Error getting refresh status:', error);
    return {
      upcomingMoviesCount: 0,
      lastUpdate: null,
      hoursSinceLastUpdate: null,
      isStale: true,
      needsRefresh: true,
      error: error.message,
    };
  }
}

