import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

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

const Card = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid ${(props) => props.theme.colors.border};
  cursor: ${(props) => (props.$clickable ? 'pointer' : 'default')};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${(props) => props.theme.shadows.xl};
  }
`;

const PosterContainer = styled.div`
  position: relative;
  width: 100%;
  padding-top: 150%; // 2:3 aspect ratio
  overflow: hidden;
  background: ${(props) => props.theme.colors.surfaceDark};
`;

const Poster = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlaceholderPoster = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.colors.surfaceLight};
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.xl};
`;

const ActionButton = styled.button`
  position: absolute;
  top: ${(props) => props.theme.spacing.sm};
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.full};
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  z-index: 10;

  &:hover {
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LikeButton = styled(ActionButton)`
  right: ${(props) => props.theme.spacing.sm};
  background: ${(props) =>
    props.$liked
      ? props.theme.colors.like
      : 'rgba(0, 0, 0, 0.6)'};

  &:hover {
    background: ${(props) =>
      props.$liked
        ? props.theme.colors.likeHover
        : 'rgba(0, 0, 0, 0.8)'};
  }
`;

const DislikeButton = styled(ActionButton)`
  left: ${(props) => props.theme.spacing.sm};
  background: ${(props) =>
    props.$disliked
      ? props.theme.colors.dislike
      : 'rgba(0, 0, 0, 0.6)'};

  &:hover {
    background: ${(props) =>
      props.$disliked
        ? props.theme.colors.dislikeHover
        : 'rgba(0, 0, 0, 0.8)'};
  }
`;

const CardContent = styled.div`
  padding: ${(props) => props.theme.spacing.md};
`;

const Title = styled.h3`
  font-size: ${(props) => props.theme.fontSizes.lg};
  font-weight: 600;
  margin: 0 0 ${(props) => props.theme.spacing.sm} 0;
  color: ${(props) => props.theme.colors.text};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Overview = styled.p`
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
`;

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${(props) => props.theme.spacing.sm};
  font-size: ${(props) => props.theme.fontSizes.xs};
  color: ${(props) => props.theme.colors.textMuted};
`;

const Score = styled.span`
  color: ${(props) => props.theme.colors.primary};
  font-weight: 600;
`;

function MovieCard({ 
  movie, 
  showScore = false,
  showActions = true
}) {
  const tmdbId = movie.tmdbId || movie.id;
  
  // Use isLiked/isDisliked from movie prop if available, otherwise default to false
  const [isLiked, setIsLiked] = useState(movie.isLiked || false);
  const [isDisliked, setIsDisliked] = useState(movie.isDisliked || false);
  const [liking, setLiking] = useState(false);
  const [disliking, setDisliking] = useState(false);
  const navigate = useNavigate();

  // Update state when movie prop changes (e.g., when switching pages)
  useEffect(() => {
    setIsLiked(movie.isLiked || false);
    setIsDisliked(movie.isDisliked || false);
  }, [movie.isLiked, movie.isDisliked]);

  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent card click when clicking like button
    if (liking || disliking || !tmdbId) return;
    
    // Only allow liking/disliking movies, not TV shows
    const type = movie.type || 'movie';
    if (type === 'tv') {
      console.warn('Like/dislike functionality is only available for movies');
      return;
    }
    
    setLiking(true);
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
        await axios.post('/api/dev/user_like', { tmdbId });
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error liking/unliking movie:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleDislike = async (e) => {
    e.stopPropagation(); // Prevent card click when clicking dislike button
    if (liking || disliking || !tmdbId) return;
    
    // Only allow liking/disliking movies, not TV shows
    const type = movie.type || 'movie';
    if (type === 'tv') {
      console.warn('Like/dislike functionality is only available for movies');
      return;
    }
    
    setDisliking(true);
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
        await axios.post('/api/dev/user_dislike', { tmdbId });
        setIsDisliked(true);
      }
    } catch (error) {
      console.error('Error disliking/undisliking movie:', error);
    } finally {
      setDisliking(false);
    }
  };

  const handleCardClick = () => {
    const tmdbId = movie.tmdbId || movie.id;
    const type = movie.type || 'movie'; // Default to 'movie', can be 'tv'
    if (tmdbId) {
      navigate(type === 'tv' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`);
    }
  };

  const posterUrl = movie.posterPath || movie.poster_path;
  const title = movie.title;
  const overview = movie.overview;
  const releaseDate = movie.releaseDate || movie.release_date;
  
  // Check if movie has a match score (similarity or normalizedSimilarity)
  // Use normalizedSimilarity if available, otherwise use raw similarity
  const matchScore = movie.normalizedSimilarity !== undefined 
    ? movie.normalizedSimilarity 
    : (movie.similarity !== undefined ? movie.similarity : null);
  
  const hasMatchScore = matchScore !== null && matchScore !== undefined;
  
  // Show match score if it exists, otherwise show vote average
  const score = hasMatchScore
    ? `${(matchScore * 100).toFixed(1)}% match`
    : movie.voteAverage
    ? `${movie.voteAverage.toFixed(1)}/10`
    : null;

  return (
    <Card $clickable={true} onClick={handleCardClick}>
      <PosterContainer>
        {posterUrl ? (
          <Poster src={posterUrl} alt={title} />
        ) : (
          <PlaceholderPoster>No Poster</PlaceholderPoster>
        )}
        {showActions && (movie.type || 'movie') === 'movie' && (
          <>
            <DislikeButton
              $disliked={isDisliked}
              onClick={handleDislike}
              disabled={disliking || liking}
              aria-label={isDisliked ? 'Remove from dislikes' : 'Add to dislikes'}
              title={isDisliked ? 'Undislike movie' : 'Dislike movie'}
            >
              <ThumbsDownIcon filled={isDisliked} size={20} />
            </DislikeButton>
            <LikeButton
              $liked={isLiked}
              onClick={handleLike}
              disabled={liking || disliking}
              aria-label={isLiked ? 'Remove from likes' : 'Add to likes'}
              title={isLiked ? 'Unlike movie' : 'Like movie'}
            >
              <HeartIcon filled={isLiked} size={20} />
            </LikeButton>
          </>
        )}
      </PosterContainer>
      <CardContent>
        <Title>{title}</Title>
        {overview && <Overview>{overview}</Overview>}
        <Meta>
          {releaseDate && <span>{new Date(releaseDate).getFullYear()}</span>}
          {/* Always show score if it exists (match score takes priority over vote average) */}
          {score && <Score>{score}</Score>}
        </Meta>
      </CardContent>
    </Card>
  );
}

export default MovieCard;

