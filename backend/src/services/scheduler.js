import { refreshUpcomingMovies, getRefreshStatus } from './movieRefresh.js';

/**
 * Scheduler Service
 * Handles background jobs for automatic movie refresh
 */

let refreshInterval = null;
let isRefreshing = false;

/**
 * Start the background scheduler
 * @param {Object} options - Scheduler options
 * @param {number} options.intervalHours - Hours between refreshes (default: 24)
 * @param {number} options.initialDelayMinutes - Minutes to wait before first refresh (default: 5)
 */
export function startScheduler(options = {}) {
  const {
    intervalHours = 24,
    initialDelayMinutes = 5,
  } = options;

  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  console.log(`📅 Starting movie refresh scheduler`);
  console.log(`   Initial delay: ${initialDelayMinutes} minutes`);
  console.log(`   Refresh interval: ${intervalHours} hours`);

  // Initial delay before first refresh (to let server start up)
  const initialDelayMs = initialDelayMinutes * 60 * 1000;
  const intervalMs = intervalHours * 60 * 60 * 1000;

  // Schedule first refresh after initial delay
  setTimeout(async () => {
    await performScheduledRefresh();
    
    // Then schedule regular refreshes
    refreshInterval = setInterval(async () => {
      await performScheduledRefresh();
    }, intervalMs);
  }, initialDelayMs);
}

/**
 * Stop the background scheduler
 */
export function stopScheduler() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('📅 Scheduler stopped');
  }
}

/**
 * Perform a scheduled refresh
 */
async function performScheduledRefresh() {
  // Prevent concurrent refreshes
  if (isRefreshing) {
    console.log('⏭️  Refresh already in progress, skipping...');
    return;
  }

  isRefreshing = true;
  
  try {
    console.log('🔄 Starting scheduled movie refresh...');
    
    // Check if refresh is needed
    const status = await getRefreshStatus();
    
    if (!status.needsRefresh) {
      console.log(`⏭️  Movies are fresh (${status.upcomingMoviesCount} movies, updated ${status.hoursSinceLastUpdate?.toFixed(1)}h ago), skipping refresh`);
      return;
    }

    console.log(`🔄 Refreshing movies (${status.upcomingMoviesCount} movies, last update: ${status.lastUpdate || 'never'})`);
    
    // Refresh movies (fetch ALL pages for complete coverage)
    const result = await refreshUpcomingMovies({
      page: 1,
      maxPages: null, // null means fetch all pages
      force: false,
    });

    if (result.success) {
      console.log(`✅ Scheduled refresh complete: ${result.stats.totalProcessed} created, ${result.stats.totalUpdated} updated`);
    } else {
      console.error(`❌ Scheduled refresh failed: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error in scheduled refresh:', error);
  } finally {
    isRefreshing = false;
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning: refreshInterval !== null,
    isRefreshing,
  };
}

