/**
 * Movie Sorting Service
 * Provides server-side sorting for movies based on various criteria
 */

/**
 * Sort movies based on the specified sort option
 * 
 * @param {Array} movies - Array of movie objects to sort
 * @param {string} sortBy - Sort option (default, rating-desc, rating-asc, release-desc, etc.)
 * @returns {Array} Sorted array of movies
 */
export function sortMovies(movies, sortBy = 'default') {
  if (!movies || movies.length === 0) {
    return movies;
  }

  const sorted = [...movies];

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
      // Sort by release date (newest first)
      sorted.sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return new Date(b.releaseDate) - new Date(a.releaseDate);
      });
      break;

    case 'release-asc':
      // Sort by release date (oldest first)
      sorted.sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return new Date(a.releaseDate) - new Date(b.releaseDate);
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

