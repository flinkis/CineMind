/**
 * TV Show Sorting Service
 * Provides server-side sorting for TV shows based on various criteria
 */

/**
 * Sort TV shows based on the specified sort option
 * 
 * @param {Array} tvShows - Array of TV show objects to sort
 * @param {string} sortBy - Sort option (default, rating-desc, rating-asc, release-desc, etc.)
 * @returns {Array} Sorted array of TV shows
 */
export function sortTVShows(tvShows, sortBy = 'default') {
  if (!tvShows || tvShows.length === 0) {
    return tvShows;
  }

  const sorted = [...tvShows];

  switch (sortBy) {
    case 'rating-desc':
      // Sort by rating (highest first)
      sorted.sort((a, b) => {
        const aRating = a.voteAverage || 0;
        const bRating = b.voteAverage || 0;
        return bRating - aRating;
      });
      break;

    case 'rating-asc':
      // Sort by rating (lowest first)
      sorted.sort((a, b) => {
        const aRating = a.voteAverage || 0;
        const bRating = b.voteAverage || 0;
        return aRating - bRating;
      });
      break;

    case 'release-desc':
      // Sort by first air date (newest first)
      sorted.sort((a, b) => {
        const aDate = a.releaseDate || a.firstAirDate;
        const bDate = b.releaseDate || b.firstAirDate;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return new Date(bDate) - new Date(aDate);
      });
      break;

    case 'release-asc':
      // Sort by first air date (oldest first)
      sorted.sort((a, b) => {
        const aDate = a.releaseDate || a.firstAirDate;
        const bDate = b.releaseDate || b.firstAirDate;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return new Date(aDate) - new Date(bDate);
      });
      break;

    case 'popularity-desc':
      // Sort by popularity (highest first)
      sorted.sort((a, b) => {
        const aPop = a.popularity || 0;
        const bPop = b.popularity || 0;
        return bPop - aPop;
      });
      break;

    case 'popularity-asc':
      // Sort by popularity (lowest first)
      sorted.sort((a, b) => {
        const aPop = a.popularity || 0;
        const bPop = b.popularity || 0;
        return aPop - bPop;
      });
      break;

    case 'title-asc':
      // Sort by title (A-Z)
      sorted.sort((a, b) => {
        const aTitle = (a.title || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
      break;

    case 'title-desc':
      // Sort by title (Z-A)
      sorted.sort((a, b) => {
        const aTitle = (a.title || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();
        return bTitle.localeCompare(aTitle);
      });
      break;

    case 'default':
    default:
      // Keep original order (from API)
      break;
  }

  return sorted;
}

