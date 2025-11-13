import express from 'express';
import { prisma } from '../server.js';
import { getMovieDetails, getSimilarMovies, formatMovieData } from '../services/tmdb.js';

const router = express.Router();

/**
 * GET /api/movies/:tmdbId
 * Get detailed movie information including videos and external IDs
 * 
 * Returns:
 * - Full movie details
 * - Videos (trailers, teasers, etc.)
 * - External IDs (IMDB, etc.)
 */
router.get('/:tmdbId', async (req, res, next) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId);

    if (!tmdbId || isNaN(tmdbId)) {
      return res.status(400).json({ error: 'Invalid TMDB ID' });
    }

    // Fetch movie details with videos, external IDs, and credits
    const movieDetails = await getMovieDetails(tmdbId);

    // Extract trailer (first YouTube trailer)
    const videos = movieDetails.videos?.results || [];
    const trailer = videos.find(
      (video) => video.type === 'Trailer' && video.site === 'YouTube'
    ) || videos.find((video) => video.site === 'YouTube');

    // Extract external IDs
    const externalIds = movieDetails.external_ids || {};

    // Extract directors from crew (some movies have multiple directors)
    const crew = movieDetails.credits?.crew || [];
    const directors = crew.filter((person) => person.job === 'Director');
    const director = directors.length > 0 ? directors[0] : null; // Primary director

    // Extract writers from crew (filter for common writing jobs)
    const writerJobs = ['Writer', 'Screenplay', 'Story', 'Novel', 'Characters', 'Teleplay'];
    const writers = crew
      .filter((person) => writerJobs.includes(person.job))
      .map((writer) => ({
        id: writer.id,
        name: writer.name,
        job: writer.job,
        profilePath: writer.profile_path
          ? `https://image.tmdb.org/t/p/w185${writer.profile_path}`
          : null,
      }))
      // Remove duplicates by person ID
      .filter((writer, index, self) => 
        index === self.findIndex((w) => w.id === writer.id)
      );

    // Extract cast (limit to top 20 for performance, already sorted by order from TMDB)
    const cast = (movieDetails.credits?.cast || [])
      .slice(0, 20)
      .map((actor) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profilePath: actor.profile_path
          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
          : null,
        order: actor.order,
      }));

    // Fetch similar movies (limit to top 10)
    let similarMovies = [];
    try {
      const similarResponse = await getSimilarMovies(tmdbId, 1);
      similarMovies = (similarResponse.results || [])
        .slice(0, 10)
        .map((movie) => formatMovieData(movie));
    } catch (error) {
      console.error('Error fetching similar movies:', error.message);
      // Don't fail the entire request if similar movies fail
      similarMovies = [];
    }

    // Check if movie is already liked
    let isLiked = false;
    try {
      const existingLike = await prisma.userLike.findUnique({
        where: { tmdbId },
      });
      isLiked = !!existingLike;
    } catch (error) {
      console.error('Error checking liked status:', error.message);
      // Don't fail the entire request if liked status check fails
      isLiked = false;
    }

    // Check if movie is already disliked
    let isDisliked = false;
    try {
      const existingDislike = await prisma.userDislike.findUnique({
        where: { tmdbId },
      });
      isDisliked = !!existingDislike;
    } catch (error) {
      console.error('Error checking disliked status:', error.message);
      // Don't fail the entire request if disliked status check fails
      isDisliked = false;
    }

    // Format response
    const response = {
      id: movieDetails.id,
      tmdbId: movieDetails.id,
      title: movieDetails.title,
      overview: movieDetails.overview || '',
      posterPath: movieDetails.poster_path
        ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
        : null,
      backdropPath: movieDetails.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`
        : null,
      releaseDate: movieDetails.release_date || null,
      runtime: movieDetails.runtime || null,
      genres: movieDetails.genres || [],
      voteAverage: movieDetails.vote_average || 0,
      voteCount: movieDetails.vote_count || 0,
      popularity: movieDetails.popularity || 0,
      budget: movieDetails.budget || null,
      revenue: movieDetails.revenue || null,
      tagline: movieDetails.tagline || null,
      productionCompanies: movieDetails.production_companies || [],
      productionCountries: movieDetails.production_countries || [],
      spokenLanguages: movieDetails.spoken_languages || [],
      homepage: movieDetails.homepage || null,
      imdbId: externalIds.imdb_id || null,
      imdbUrl: externalIds.imdb_id
        ? `https://www.imdb.com/title/${externalIds.imdb_id}`
        : null,
      tmdbUrl: `https://www.themoviedb.org/movie/${movieDetails.id}`,
      trailer: trailer
        ? {
            key: trailer.key,
            name: trailer.name,
            type: trailer.type,
            site: trailer.site,
            youtubeUrl: `https://www.youtube.com/watch?v=${trailer.key}`,
            youtubeEmbedUrl: `https://www.youtube.com/embed/${trailer.key}`,
          }
        : null,
      videos: videos.map((video) => ({
        key: video.key,
        name: video.name,
        type: video.type,
        site: video.site,
        youtubeUrl:
          video.site === 'YouTube'
            ? `https://www.youtube.com/watch?v=${video.key}`
            : null,
        youtubeEmbedUrl:
          video.site === 'YouTube'
            ? `https://www.youtube.com/embed/${video.key}`
            : null,
      })),
      director: director
        ? {
            id: director.id,
            name: director.name,
            profilePath: director.profile_path
              ? `https://image.tmdb.org/t/p/w185${director.profile_path}`
              : null,
          }
        : null,
      writers: writers.length > 0 ? writers : null,
      cast,
      similarMovies: similarMovies.length > 0 ? similarMovies : null,
      isLiked,
      isDisliked,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

