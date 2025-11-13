import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${(props) => props.theme.spacing.xl};
  position: relative;
`;

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: ${(props) => props.theme.spacing.xl};
  position: relative;

  @media (max-width: ${(props) => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  min-width: 0; // Prevent grid overflow
`;

const Sidebar = styled.div`
  position: sticky;
  top: 100px; // Account for navigation
  height: fit-content;
  max-height: calc(100vh - 120px);
  overflow-y: auto;

  @media (max-width: ${(props) => props.theme.breakpoints.lg}) {
    position: relative;
    top: 0;
    max-height: none;
  }
`;

const Backdrop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: ${(props) =>
    props.$backdropUrl ? `url(${props.$backdropUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.1;
  z-index: 0;
  filter: blur(10px);
  transform: scale(1.1);
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.sm};
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: ${(props) => props.theme.colors.text};
  text-decoration: none;
  margin-bottom: ${(props) => props.theme.spacing.lg};
  transition: all 0.2s;
  font-size: ${(props) => props.theme.fontSizes.sm};

  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const Header = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.xl};
  margin-bottom: ${(props) => props.theme.spacing.xl};
  flex-wrap: wrap;

  @media (max-width: ${(props) => props.theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const Poster = styled.img`
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.xl};
`;

const PlaceholderPoster = styled.div`
  width: 100%;
  max-width: 300px;
  aspect-ratio: 2/3;
  background: ${(props) => props.theme.colors.surfaceLight};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.xl};
`;

const Info = styled.div`
  flex: 1;
  min-width: 300px;
`;

const Title = styled.h1`
  font-size: ${(props) => props.theme.fontSizes.xxxl};
  margin: 0 0 ${(props) => props.theme.spacing.md} 0;
  color: ${(props) => props.theme.colors.text};
`;

const Tagline = styled.p`
  font-size: ${(props) => props.theme.fontSizes.lg};
  font-style: italic;
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0 0 ${(props) => props.theme.spacing.md} 0;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.md};
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.textSecondary};
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xs};
`;

const Genres = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing.sm};
  margin-bottom: ${(props) => props.theme.spacing.md};
`;

const Genre = styled.span`
  padding: ${(props) => props.theme.spacing.xs} ${(props) => props.theme.spacing.sm};
  background: ${(props) => props.theme.colors.surfaceLight};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.text};
`;

const Overview = styled.p`
  font-size: ${(props) => props.theme.fontSizes.md};
  line-height: 1.6;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const Button = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.sm};
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.lg};
  background: ${(props) => props.theme.colors.primary};
  color: white;
  text-decoration: none;
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: background 0.2s;
  font-weight: 600;
  font-size: ${(props) => props.theme.fontSizes.sm};

  &:hover {
    background: ${(props) => props.theme.colors.primaryDark};
  }
`;

const SecondaryButton = styled(Button)`
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};

  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const TrailerSection = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const TrailerTitle = styled.h2`
  font-size: ${(props) => props.theme.fontSizes.xxl};
  margin: 0 0 ${(props) => props.theme.spacing.md} 0;
  color: ${(props) => props.theme.colors.text};
`;

const TrailerContainer = styled.div`
  position: relative;
  padding-bottom: 56.25%; // 16:9 aspect ratio
  height: 0;
  overflow: hidden;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.xl};
  background: ${(props) => props.theme.colors.surfaceDark};
`;

const TrailerIframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
`;

const PlaceholderTrailer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.lg};
`;

const ProductionSection = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${(props) => props.theme.fontSizes.xl};
  margin: 0 0 ${(props) => props.theme.spacing.md} 0;
  color: ${(props) => props.theme.colors.text};
`;

const ProductionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing.md};
`;

const ProductionItem = styled.span`
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: ${(props) => props.theme.fontSizes.sm};
`;

const SimilarMoviesSection = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: ${(props) => props.theme.spacing.md};
`;

const SimilarMoviesTitle = styled.h3`
  font-size: ${(props) => props.theme.fontSizes.lg};
  margin: 0 0 ${(props) => props.theme.spacing.md} 0;
  color: ${(props) => props.theme.colors.text};
  font-weight: 600;
`;

const SimilarMovieItem = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.sm};
  margin-bottom: ${(props) => props.theme.spacing.md};
  padding: ${(props) => props.theme.spacing.sm};
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const SimilarMoviePoster = styled.img`
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  background: ${(props) => props.theme.colors.surfaceLight};
  flex-shrink: 0;
`;

const PlaceholderSimilarPoster = styled.div`
  width: 60px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.colors.surfaceLight};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.xs};
  flex-shrink: 0;
`;

const SimilarMovieInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const SimilarMovieTitle = styled.div`
  font-size: ${(props) => props.theme.fontSizes.sm};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: ${(props) => props.theme.spacing.xs};
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const SimilarMovieMeta = styled.div`
  font-size: ${(props) => props.theme.fontSizes.xs};
  color: ${(props) => props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xs};
`;

const SimilarMovieRating = styled.span`
  color: ${(props) => props.theme.colors.primary};
  font-weight: 600;
`;

const CastSection = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const CastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: ${(props) => props.theme.spacing.md};
  margin-top: ${(props) => props.theme.spacing.md};

  @media (max-width: ${(props) => props.theme.breakpoints.md}) {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: ${(props) => props.theme.spacing.sm};
  }
`;

const CastCard = styled.div`
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
`;

const CastPhoto = styled.img`
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: ${(props) => props.theme.borderRadius.md};
  margin-bottom: ${(props) => props.theme.spacing.xs};
  background: ${(props) => props.theme.colors.surfaceLight};
`;

const PlaceholderCastPhoto = styled.div`
  width: 100%;
  aspect-ratio: 2/3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.colors.surfaceLight};
  border-radius: ${(props) => props.theme.borderRadius.md};
  margin-bottom: ${(props) => props.theme.spacing.xs};
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.xs};
`;

const CastName = styled.div`
  font-size: ${(props) => props.theme.fontSizes.sm};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: ${(props) => props.theme.spacing.xs};
  line-height: 1.3;
`;

const CastCharacter = styled.div`
  font-size: ${(props) => props.theme.fontSizes.xs};
  color: ${(props) => props.theme.colors.textSecondary};
  line-height: 1.3;
`;

const DirectorSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.lg};
  padding: ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    border-color: ${(props) => props.theme.colors.primary};
  }

  @media (max-width: ${(props) => props.theme.breakpoints.md}) {
    flex-direction: column;
    text-align: center;
  }
`;

const DirectorPhoto = styled.img`
  width: 80px;
  height: 80px;
  border-radius: ${(props) => props.theme.borderRadius.full};
  object-fit: cover;
  background: ${(props) => props.theme.colors.surfaceLight};
`;

const PlaceholderDirectorPhoto = styled.div`
  width: 80px;
  height: 80px;
  border-radius: ${(props) => props.theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.colors.surfaceLight};
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.xs};
`;

const DirectorInfo = styled.div`
  flex: 1;
`;

const DirectorLabel = styled.div`
  font-size: ${(props) => props.theme.fontSizes.xs};
  color: ${(props) => props.theme.colors.textMuted};
  margin-bottom: ${(props) => props.theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DirectorName = styled.div`
  font-size: ${(props) => props.theme.fontSizes.lg};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const WritersSection = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const WritersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: ${(props) => props.theme.spacing.md};
  margin-top: ${(props) => props.theme.spacing.md};

  @media (max-width: ${(props) => props.theme.breakpoints.md}) {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: ${(props) => props.theme.spacing.sm};
  }
`;

const WriterCard = styled.div`
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
`;

const WriterPhoto = styled.img`
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: ${(props) => props.theme.borderRadius.md};
  margin-bottom: ${(props) => props.theme.spacing.xs};
  background: ${(props) => props.theme.colors.surfaceLight};
`;

const PlaceholderWriterPhoto = styled.div`
  width: 100%;
  aspect-ratio: 2/3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.colors.surfaceLight};
  border-radius: ${(props) => props.theme.borderRadius.md};
  margin-bottom: ${(props) => props.theme.spacing.xs};
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.xs};
`;

const WriterName = styled.div`
  font-size: ${(props) => props.theme.fontSizes.sm};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: ${(props) => props.theme.spacing.xs};
  line-height: 1.3;
`;

const WriterJob = styled.div`
  font-size: ${(props) => props.theme.fontSizes.xs};
  color: ${(props) => props.theme.colors.textSecondary};
  line-height: 1.3;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.sm};
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.lg};
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  font-size: ${(props) => props.theme.fontSizes.sm};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LikeButton = styled(ActionButton)`
  background: ${(props) =>
    props.$liked
      ? props.theme.colors.like
      : props.theme.colors.surface};
  color: ${(props) =>
    props.$liked
      ? 'white'
      : props.theme.colors.text};
  border: 1px solid ${(props) =>
    props.$liked
      ? props.theme.colors.like
      : props.theme.colors.border};

  &:hover {
    background: ${(props) =>
    props.$liked
      ? props.theme.colors.likeHover
      : props.theme.colors.surfaceLight};
    border-color: ${(props) =>
    props.$liked
      ? props.theme.colors.likeHover
      : props.theme.colors.primary};
  }
`;

const DislikeButton = styled(ActionButton)`
  background: ${(props) =>
    props.$disliked
      ? props.theme.colors.dislike
      : props.theme.colors.surface};
  color: ${(props) =>
    props.$disliked
      ? 'white'
      : props.theme.colors.text};
  border: 1px solid ${(props) =>
    props.$disliked
      ? props.theme.colors.dislike
      : props.theme.colors.border};

  &:hover {
    background: ${(props) =>
    props.$disliked
      ? props.theme.colors.dislikeHover
      : props.theme.colors.surfaceLight};
    border-color: ${(props) =>
    props.$disliked
      ? props.theme.colors.dislikeHover
      : props.theme.colors.primary};
  }
`;

// Simple heart icon SVG component
const HeartIcon = ({ filled, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

// Thumbs down icon SVG component
const ThumbsDownIcon = ({ filled, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
  </svg>
);

const Loading = styled.div`
  text-align: center;
  padding: ${(props) => props.theme.spacing.xxl};
  color: ${(props) => props.theme.colors.textSecondary};
`;

const Error = styled.div`
  text-align: center;
  padding: ${(props) => props.theme.spacing.xl};
  color: ${(props) => props.theme.colors.error};
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid ${(props) => props.theme.colors.error};
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const Stat = styled.div`
  padding: ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: ${(props) => props.theme.fontSizes.xs};
  color: ${(props) => props.theme.colors.textMuted};
  margin-bottom: ${(props) => props.theme.spacing.xs};
`;

const StatValue = styled.div`
  font-size: ${(props) => props.theme.fontSizes.lg};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const MatchScoreValue = styled(StatValue)`
  color: ${(props) => props.theme.colors.primary};
  font-size: ${(props) => props.theme.fontSizes.xl};
`;

function MovieDetailPage() {
  const { tmdbId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [disliking, setDisliking] = useState(false);
  const [likeError, setLikeError] = useState(null);
  const [dislikeError, setDislikeError] = useState(null);
  const [radarrConfigured, setRadarrConfigured] = useState(false);
  const [addingToRadarr, setAddingToRadarr] = useState(false);
  const [radarrError, setRadarrError] = useState(null);
  const [radarrSuccess, setRadarrSuccess] = useState(null);

  const handlePersonClick = (personId) => {
    navigate(`/person/${personId}`);
  };

  const handleSimilarMovieClick = (tmdbId) => {
    navigate(`/movie/${tmdbId}`);
  };

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        // Reset liked/disliked status when loading new movie
        setIsLiked(false);
        setIsDisliked(false);
        setLikeError(null);
        setDislikeError(null);
        setRadarrError(null);
        setRadarrSuccess(null);

        const response = await axios.get(`/api/movies/${tmdbId}`);
        setMovie(response.data);
        // Update liked/disliked status from API response
        setIsLiked(response.data.isLiked || false);
        setIsDisliked(response.data.isDisliked || false);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to load movie details. Please try again.'
        );
        console.error('Movie details error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Check if Radarr is configured
    const checkRadarrStatus = async () => {
      try {
        const response = await axios.get('/api/radarr/status');
        setRadarrConfigured(response.data.configured || false);
      } catch (err) {
        // Silently fail - Radarr is optional
        setRadarrConfigured(false);
      }
    };

    if (tmdbId) {
      fetchMovieDetails();
      checkRadarrStatus();
    }
  }, [tmdbId]);

  // Handle like/unlike button
  const handleLike = async () => {
    if (liking || disliking || !tmdbId) return;

    setLiking(true);
    setLikeError(null);

    try {
      if (isLiked) {
        // Unlike the movie
        await axios.delete(`/api/dev/user_like/${tmdbId}`);
        setIsLiked(false);
      } else {
        // Like the movie - remove from dislikes if it was disliked
        if (isDisliked) {
          await axios.delete(`/api/dev/user_dislike/${tmdbId}`);
          setIsDisliked(false);
        }
        await axios.post('/api/dev/user_like', { tmdbId: parseInt(tmdbId) });
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Like/Unlike error:', err);
      const errorMessage = err.response?.data?.error || err.message || `Failed to ${isLiked ? 'unlike' : 'like'} movie`;
      setLikeError(errorMessage);

      // Format quota/billing errors
      if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
        setLikeError('OpenAI API quota exceeded. Please check your billing at https://platform.openai.com/account/billing');
      }
    } finally {
      setLiking(false);
    }
  };

  // Handle dislike/undislike button
  const handleDislike = async () => {
    if (liking || disliking || !tmdbId) return;

    setDisliking(true);
    setDislikeError(null);

    try {
      if (isDisliked) {
        // Undislike the movie
        await axios.delete(`/api/dev/user_dislike/${tmdbId}`);
        setIsDisliked(false);
      } else {
        // Dislike the movie - remove from likes if it was liked
        if (isLiked) {
          await axios.delete(`/api/dev/user_like/${tmdbId}`);
          setIsLiked(false);
        }
        await axios.post('/api/dev/user_dislike', { tmdbId: parseInt(tmdbId) });
        setIsDisliked(true);
      }
    } catch (err) {
      console.error('Dislike/Undislike error:', err);
      const errorMessage = err.response?.data?.error || err.message || `Failed to ${isDisliked ? 'undislike' : 'dislike'} movie`;
      setDislikeError(errorMessage);

      // Format quota/billing errors
      if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
        setDislikeError('OpenAI API quota exceeded. Please check your billing at https://platform.openai.com/account/billing');
      }
    } finally {
      setDisliking(false);
    }
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle adding movie to Radarr
  const handleAddToRadarr = async () => {
    if (addingToRadarr || !tmdbId) return;

    setAddingToRadarr(true);
    setRadarrError(null);
    setRadarrSuccess(null);

    try {
      const response = await axios.post(`/api/radarr/add/${tmdbId}`);
      if (response.data.alreadyExists) {
        setRadarrSuccess('Movie already exists in Radarr');
      } else {
        setRadarrSuccess('Movie added to Radarr successfully!');
      }
    } catch (err) {
      console.error('Add to Radarr error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add movie to Radarr';
      setRadarrError(errorMessage);
    } finally {
      setAddingToRadarr(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Content>
          <Loading>Loading movie details...</Loading>
        </Content>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Content>
          <Error>{error}</Error>
          <BackButton to="/">← Back to Discover</BackButton>
        </Content>
      </Container>
    );
  }

  if (!movie) {
    return (
      <Container>
        <Content>
          <Error>Movie not found</Error>
          <BackButton to="/">← Back to Discover</BackButton>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      {movie.backdropPath && <Backdrop $backdropUrl={movie.backdropPath} />}
      <Content>
        <BackButton to="/">← Back to Discover</BackButton>

        <MainLayout>
          <MainContent>
            <Header>
              {movie.posterPath ? (
                <Poster src={movie.posterPath} alt={movie.title} />
              ) : (
                <PlaceholderPoster>No Poster</PlaceholderPoster>
              )}

              <Info>
                <Title>{movie.title}</Title>
                {movie.tagline && <Tagline>{movie.tagline}</Tagline>}

                <Meta>
                  {movie.releaseDate && (
                    <MetaItem>
                      <strong>Release:</strong> {new Date(movie.releaseDate).getFullYear()}
                    </MetaItem>
                  )}
                  {movie.runtime && (
                    <MetaItem>
                      <strong>Runtime:</strong> {formatRuntime(movie.runtime)}
                    </MetaItem>
                  )}
                  {movie.voteAverage > 0 && (
                    <MetaItem>
                      <strong>Rating:</strong> {movie.voteAverage.toFixed(1)}/10
                    </MetaItem>
                  )}
                </Meta>

                {movie.genres && movie.genres.length > 0 && (
                  <Genres>
                    {movie.genres.map((genre) => (
                      <Genre key={genre.id}>{genre.name}</Genre>
                    ))}
                  </Genres>
                )}

                {movie.overview && <Overview>{movie.overview}</Overview>}

                <Actions>
                  <LikeButton
                    $liked={isLiked}
                    onClick={handleLike}
                    disabled={liking || disliking}
                    aria-label={isLiked ? 'Remove from likes' : 'Add to likes'}
                  >
                    <HeartIcon filled={isLiked} size={16} />
                    {liking ? (isLiked ? 'Unliking...' : 'Liking...') : (isLiked ? 'Unlike' : 'Like')}
                  </LikeButton>
                  <DislikeButton
                    $disliked={isDisliked}
                    onClick={handleDislike}
                    disabled={liking || disliking}
                    aria-label={isDisliked ? 'Remove from dislikes' : 'Add to dislikes'}
                  >
                    <ThumbsDownIcon filled={isDisliked} size={16} />
                    {disliking ? (isDisliked ? 'Undisliking...' : 'Disliking...') : (isDisliked ? 'Undislike' : 'Dislike')}
                  </DislikeButton>
                  {movie.trailer && (
                    <Button href={movie.trailer.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      ▶ Watch Trailer
                    </Button>
                  )}
                  {movie.imdbUrl && (
                    <SecondaryButton href={movie.imdbUrl} target="_blank" rel="noopener noreferrer">
                      IMDb
                    </SecondaryButton>
                  )}
                  {movie.tmdbUrl && (
                    <SecondaryButton href={movie.tmdbUrl} target="_blank" rel="noopener noreferrer">
                      TMDB
                    </SecondaryButton>
                  )}
                  {movie.homepage && (
                    <SecondaryButton href={movie.homepage} target="_blank" rel="noopener noreferrer">
                      Official Website
                    </SecondaryButton>
                  )}
                  {radarrConfigured && (
                    <SecondaryButton
                      onClick={handleAddToRadarr}
                      disabled={addingToRadarr}
                      as="button"
                      style={{ cursor: addingToRadarr ? 'not-allowed' : 'pointer' }}
                    >
                      {addingToRadarr ? 'Adding...' : '📥 Add to Radarr'}
                    </SecondaryButton>
                  )}
                </Actions>
                {likeError && (
                  <Error style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                    {likeError}
                  </Error>
                )}
                {dislikeError && (
                  <Error style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                    {dislikeError}
                  </Error>
                )}
                {radarrError && (
                  <Error style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                    {radarrError}
                  </Error>
                )}
                {radarrSuccess && (
                  <div style={{
                    marginTop: '1rem',
                    fontSize: '0.875rem',
                    color: '#10b981',
                    background: '#1e293b',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #10b981'
                  }}>
                    {radarrSuccess}
                  </div>
                )}
              </Info>
            </Header>

            <Stats>
              {((movie.normalizedSimilarity !== undefined && movie.normalizedSimilarity !== null) || 
               (movie.similarity !== undefined && movie.similarity !== null)) ? (
                <Stat>
                  <StatLabel>Match Score</StatLabel>
                  <MatchScoreValue>
                    {((movie.normalizedSimilarity !== undefined ? movie.normalizedSimilarity : movie.similarity) * 100).toFixed(1)}%
                  </MatchScoreValue>
                </Stat>
              ) : null}
              {movie.voteAverage > 0 && (
                <Stat>
                  <StatLabel>Rating</StatLabel>
                  <StatValue>{movie.voteAverage.toFixed(1)}/10</StatValue>
                </Stat>
              )}
              {movie.voteCount > 0 && (
                <Stat>
                  <StatLabel>Votes</StatLabel>
                  <StatValue>{movie.voteCount.toLocaleString()}</StatValue>
                </Stat>
              )}
              {movie.popularity > 0 && (
                <Stat>
                  <StatLabel>Popularity</StatLabel>
                  <StatValue>{movie.popularity.toFixed(0)}</StatValue>
                </Stat>
              )}
              {movie.budget > 0 && (
                <Stat>
                  <StatLabel>Budget</StatLabel>
                  <StatValue>{formatCurrency(movie.budget)}</StatValue>
                </Stat>
              )}
              {movie.revenue > 0 && (
                <Stat>
                  <StatLabel>Revenue</StatLabel>
                  <StatValue>{formatCurrency(movie.revenue)}</StatValue>
                </Stat>
              )}
            </Stats>

            {movie.trailer && (
              <TrailerSection>
                <TrailerTitle>Trailer</TrailerTitle>
                <TrailerContainer>
                  <TrailerIframe
                    src={movie.trailer.youtubeEmbedUrl}
                    title={movie.trailer.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </TrailerContainer>
              </TrailerSection>
            )}

            {movie.director && (
              <DirectorSection onClick={() => handlePersonClick(movie.director.id)}>
                {movie.director.profilePath ? (
                  <DirectorPhoto
                    src={movie.director.profilePath}
                    alt={movie.director.name}
                  />
                ) : (
                  <PlaceholderDirectorPhoto>
                    {movie.director.name.charAt(0)}
                  </PlaceholderDirectorPhoto>
                )}
                <DirectorInfo>
                  <DirectorLabel>Director</DirectorLabel>
                  <DirectorName>{movie.director.name}</DirectorName>
                </DirectorInfo>
              </DirectorSection>
            )}

            {movie.writers && movie.writers.length > 0 && (
              <WritersSection>
                <SectionTitle>Writers</SectionTitle>
                <WritersGrid>
                  {movie.writers.map((writer) => (
                    <WriterCard
                      key={writer.id}
                      onClick={() => handlePersonClick(writer.id)}
                    >
                      {writer.profilePath ? (
                        <WriterPhoto src={writer.profilePath} alt={writer.name} />
                      ) : (
                        <PlaceholderWriterPhoto>
                          {writer.name.charAt(0)}
                        </PlaceholderWriterPhoto>
                      )}
                      <WriterName>{writer.name}</WriterName>
                      {writer.job && <WriterJob>{writer.job}</WriterJob>}
                    </WriterCard>
                  ))}
                </WritersGrid>
              </WritersSection>
            )}

            {movie.cast && movie.cast.length > 0 && (
              <CastSection>
                <SectionTitle>Cast</SectionTitle>
                <CastGrid>
                  {movie.cast.map((actor) => (
                    <CastCard
                      key={actor.id}
                      onClick={() => handlePersonClick(actor.id)}
                    >
                      {actor.profilePath ? (
                        <CastPhoto src={actor.profilePath} alt={actor.name} />
                      ) : (
                        <PlaceholderCastPhoto>
                          {actor.name.charAt(0)}
                        </PlaceholderCastPhoto>
                      )}
                      <CastName>{actor.name}</CastName>
                      {actor.character && (
                        <CastCharacter>{actor.character}</CastCharacter>
                      )}
                    </CastCard>
                  ))}
                </CastGrid>
              </CastSection>
            )}

            {movie.productionCompanies && movie.productionCompanies.length > 0 && (
              <ProductionSection>
                <SectionTitle>Production Companies</SectionTitle>
                <ProductionList>
                  {movie.productionCompanies.map((company) => (
                    <ProductionItem key={company.id}>{company.name}</ProductionItem>
                  ))}
                </ProductionList>
              </ProductionSection>
            )}
          </MainContent>

          {/* Similar Movies Sidebar */}
          {movie.similarMovies && movie.similarMovies.length > 0 && (
            <Sidebar>
              <SimilarMoviesSection>
                <SimilarMoviesTitle>Similar Movies</SimilarMoviesTitle>
                {movie.similarMovies.map((similarMovie) => (
                  <SimilarMovieItem
                    key={similarMovie.tmdbId}
                    onClick={() => handleSimilarMovieClick(similarMovie.tmdbId)}
                  >
                    {similarMovie.posterPath ? (
                      <SimilarMoviePoster
                        src={similarMovie.posterPath}
                        alt={similarMovie.title}
                      />
                    ) : (
                      <PlaceholderSimilarPoster>
                        {similarMovie.title.charAt(0)}
                      </PlaceholderSimilarPoster>
                    )}
                    <SimilarMovieInfo>
                      <SimilarMovieTitle>{similarMovie.title}</SimilarMovieTitle>
                      <SimilarMovieMeta>
                        {similarMovie.releaseDate && (
                          <span>{new Date(similarMovie.releaseDate).getFullYear()}</span>
                        )}
                        {similarMovie.voteAverage > 0 && (
                          <>
                            <span>•</span>
                            <SimilarMovieRating>
                              {similarMovie.voteAverage.toFixed(1)}
                            </SimilarMovieRating>
                          </>
                        )}
                      </SimilarMovieMeta>
                    </SimilarMovieInfo>
                  </SimilarMovieItem>
                ))}
              </SimilarMoviesSection>
            </Sidebar>
          )}
        </MainLayout>
      </Content>
    </Container>
  );
}

export default MovieDetailPage;

