import express from 'express';
import { getTVDetails, getSimilarTV, formatTVData } from '../services/tmdb.js';
import { addMatchScoresToMovies } from '../services/matchScore.js';
import { addUserPreferencesToMovies } from '../services/userPreferences.js';
import { validateTmdbId } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/tv/:tmdbId
 * Get detailed TV show information including videos and external IDs
 * 
 * Returns:
 * - Full TV show details
 * - Videos (trailers, teasers, etc.)
 * - External IDs (IMDB, TVDB, etc.)
 * - Seasons and episodes
 * - Cast and crew
 * - Similar TV shows
 */
router.get('/:tmdbId', validateTmdbId, async (req, res, next) => {
  try {
    const tmdbId = req.validatedTmdbId;

    // Fetch TV show details with videos, external IDs, and credits
    const tvDetails = await getTVDetails(tmdbId);

    // Extract trailer (first YouTube trailer)
    const videos = tvDetails.videos?.results || [];
    const trailer = videos.find(
      (video) => video.type === 'Trailer' && video.site === 'YouTube'
    ) || videos.find((video) => video.site === 'YouTube');

    // Extract external IDs
    const externalIds = tvDetails.external_ids || {};

    // Extract creators from created_by
    const creators = tvDetails.created_by || [];

    // Extract cast
    const cast = tvDetails.credits?.cast || [];
    const formattedCast = cast.slice(0, 20).map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character || 'N/A',
      profilePath: person.profile_path
        ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
        : null,
      order: person.order || 999,
    }));

    // Extract crew (directors, writers, etc.)
    const crew = tvDetails.credits?.crew || [];
    const creatorsInfo = creators.map((creator) => ({
      id: creator.id,
      name: creator.name,
      profilePath: creator.profile_path
        ? `https://image.tmdb.org/t/p/w500${creator.profile_path}`
        : null,
      role: 'Creator',
    }));

    const directors = crew
      .filter((person) => person.job === 'Director')
      .map((person) => ({
        id: person.id,
        name: person.name,
        profilePath: person.profile_path
          ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
          : null,
        role: person.job,
      }));

    const writers = crew
      .filter((person) => person.department === 'Writing')
      .slice(0, 10)
      .map((person) => ({
        id: person.id,
        name: person.name,
        profilePath: person.profile_path
          ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
          : null,
        role: person.job,
      }));

    // Format seasons
    const seasons = (tvDetails.seasons || []).map((season) => ({
      id: season.id,
      name: season.name,
      overview: season.overview || '',
      seasonNumber: season.season_number,
      episodeCount: season.episode_count || 0,
      airDate: season.air_date || null,
      posterPath: season.poster_path
        ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
        : null,
    }));

    // Get similar TV shows
    let similarTVShows = [];
    try {
      const similarResponse = await getSimilarTV(tmdbId, 1);
      const similarResults = (similarResponse.results || []).slice(0, 20);
      similarTVShows = similarResults.map(formatTVData);

      // Add match scores for similar TV shows
      const similarWithScores = await addMatchScoresToMovies(similarTVShows);
      const similarWithPreferences = await addUserPreferencesToMovies(similarWithScores);
      similarTVShows = similarWithPreferences;
    } catch (error) {
      console.warn('Failed to fetch similar TV shows:', error.message);
      similarTVShows = [];
    }

    // Format response
    const response = {
      id: tvDetails.id,
      tmdbId: tvDetails.id,
      title: tvDetails.name,
      overview: tvDetails.overview || '',
      posterPath: tvDetails.poster_path
        ? `https://image.tmdb.org/t/p/w500${tvDetails.poster_path}`
        : null,
      backdropPath: tvDetails.backdrop_path
        ? `https://image.tmdb.org/t/p/original${tvDetails.backdrop_path}`
        : null,
      firstAirDate: tvDetails.first_air_date || null,
      lastAirDate: tvDetails.last_air_date || null,
      releaseDate: tvDetails.first_air_date || null, // For compatibility
      numberOfSeasons: tvDetails.number_of_seasons || 0,
      numberOfEpisodes: tvDetails.number_of_episodes || 0,
      episodeRunTime: tvDetails.episode_run_time || [],
      genres: tvDetails.genres || [],
      voteAverage: tvDetails.vote_average || 0,
      voteCount: tvDetails.vote_count || 0,
      popularity: tvDetails.popularity || 0,
      tagline: tvDetails.tagline || null,
      productionCompanies: tvDetails.production_companies || [],
      productionCountries: tvDetails.production_countries || [],
      spokenLanguages: tvDetails.spoken_languages || [],
      homepage: tvDetails.homepage || null,
      status: tvDetails.status || null,
      type: tvDetails.type || null,
      inProduction: tvDetails.in_production || false,
      networks: tvDetails.networks || [],
      seasons: seasons,
      imdbId: externalIds.imdb_id || null,
      imdbUrl: externalIds.imdb_id
        ? `https://www.imdb.com/title/${externalIds.imdb_id}`
        : null,
      tvdbId: externalIds.tvdb_id || null,
      tvdbUrl: externalIds.tvdb_id
        ? `https://www.thetvdb.com/dereferrer/series/${externalIds.tvdb_id}`
        : null,
      tmdbUrl: `https://www.themoviedb.org/tv/${tvDetails.id}`,
      trailer: trailer
        ? {
            id: trailer.id,
            key: trailer.key,
            name: trailer.name,
            site: trailer.site,
            type: trailer.type,
            youtubeUrl: `https://www.youtube.com/watch?v=${trailer.key}`,
          }
        : null,
      cast: formattedCast,
      creators: creatorsInfo,
      directors: directors,
      writers: writers,
      similarTVShows: similarTVShows,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

