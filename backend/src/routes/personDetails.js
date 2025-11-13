import express from 'express';
import { getPersonDetails } from '../services/tmdb.js';

const router = express.Router();

/**
 * GET /api/persons/:personId
 * Get detailed person information including filmography
 * 
 * Returns:
 * - Full person details
 * - Movies they worked on (as cast and crew)
 * - Top rated movies they are known for
 * - External IDs (IMDB, etc.)
 */
router.get('/:personId', async (req, res, next) => {
  try {
    const personId = parseInt(req.params.personId);

    if (!personId || isNaN(personId)) {
      return res.status(400).json({ error: 'Invalid person ID' });
    }

    // Fetch person details with filmography
    const personDetails = await getPersonDetails(personId);

    // Extract external IDs
    const externalIds = personDetails.external_ids || {};

    // Get all movies (cast + crew)
    const castMovies = personDetails.movie_credits?.cast || [];
    const crewMovies = personDetails.movie_credits?.crew || [];

    // Combine and deduplicate movies
    const allMovies = [...castMovies, ...crewMovies];
    const uniqueMovies = allMovies.reduce((acc, movie) => {
      if (!acc.find((m) => m.id === movie.id)) {
        acc.push(movie);
      }
      return acc;
    }, []);

    // Format movies with role information
    const movies = uniqueMovies.map((movie) => {
      const castRole = castMovies.find((m) => m.id === movie.id);
      const crewRole = crewMovies.find((m) => m.id === movie.id);

      return {
        id: movie.id,
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview || '',
        posterPath: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,
        releaseDate: movie.release_date || null,
        voteAverage: movie.vote_average || 0,
        voteCount: movie.vote_count || 0,
        popularity: movie.popularity || 0,
        character: castRole?.character || null,
        job: crewRole?.job || null,
        department: crewRole?.department || null,
        role: castRole
          ? `Actor - ${castRole.character}`
          : crewRole
          ? `${crewRole.job}${crewRole.department ? ` (${crewRole.department})` : ''}`
          : null,
      };
    });

    // Sort movies by release date (newest first)
    movies.sort((a, b) => {
      if (!a.releaseDate) return 1;
      if (!b.releaseDate) return -1;
      return new Date(b.releaseDate) - new Date(a.releaseDate);
    });

    // Get top rated movies (rated 7.0 or higher, sorted by vote average)
    const topRatedMovies = movies
      .filter((movie) => movie.voteAverage >= 7.0 && movie.voteCount >= 100)
      .sort((a, b) => b.voteAverage - a.voteAverage)
      .slice(0, 10);

    // Get known for movies (top popular movies)
    const knownForMovies = movies
      .filter((movie) => movie.popularity > 0 && movie.voteCount >= 50)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);

    // Format response
    const response = {
      id: personDetails.id,
      personId: personDetails.id,
      name: personDetails.name,
      biography: personDetails.biography || '',
      birthday: personDetails.birthday || null,
      deathday: personDetails.deathday || null,
      placeOfBirth: personDetails.place_of_birth || null,
      profilePath: personDetails.profile_path
        ? `https://image.tmdb.org/t/p/w500${personDetails.profile_path}`
        : null,
      knownForDepartment: personDetails.known_for_department || null,
      popularity: personDetails.popularity || 0,
      imdbId: externalIds.imdb_id || null,
      imdbUrl: externalIds.imdb_id
        ? `https://www.imdb.com/name/${externalIds.imdb_id}`
        : null,
      tmdbUrl: `https://www.themoviedb.org/person/${personDetails.id}`,
      movies,
      topRatedMovies,
      knownForMovies,
      castCount: castMovies.length,
      crewCount: crewMovies.length,
      totalMovies: uniqueMovies.length,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

