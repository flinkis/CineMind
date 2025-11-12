import React, { useState } from 'react';
import styled from 'styled-components';

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

const Card = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid ${(props) => props.theme.colors.border};

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

const LikeButton = styled.button`
  position: absolute;
  top: ${(props) => props.theme.spacing.sm};
  right: ${(props) => props.theme.spacing.sm};
  background: ${(props) =>
    props.$liked
      ? props.theme.colors.like
      : 'rgba(0, 0, 0, 0.6)'};
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

  &:hover {
    background: ${(props) =>
      props.$liked
        ? props.theme.colors.likeHover
        : 'rgba(0, 0, 0, 0.8)'};
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

function MovieCard({ movie, onLike, isLiked = false, showScore = false }) {
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking || isLiked) return;
    
    setLiking(true);
    try {
      await onLike(movie.tmdbId || movie.id);
    } catch (error) {
      console.error('Error liking movie:', error);
    } finally {
      setLiking(false);
    }
  };

  const posterUrl = movie.posterPath || movie.poster_path;
  const title = movie.title;
  const overview = movie.overview;
  const releaseDate = movie.releaseDate || movie.release_date;
  const score = movie.similarity
    ? `${(movie.similarity * 100).toFixed(1)}% match`
    : movie.voteAverage
    ? `${movie.voteAverage.toFixed(1)}/10`
    : null;

  return (
    <Card>
      <PosterContainer>
        {posterUrl ? (
          <Poster src={posterUrl} alt={title} />
        ) : (
          <PlaceholderPoster>No Poster</PlaceholderPoster>
        )}
        {onLike && (
          <LikeButton
            $liked={isLiked}
            onClick={handleLike}
            disabled={liking || isLiked}
            aria-label={isLiked ? 'Remove from likes' : 'Add to likes'}
          >
            <HeartIcon filled={isLiked} size={20} />
          </LikeButton>
        )}
      </PosterContainer>
      <CardContent>
        <Title>{title}</Title>
        {overview && <Overview>{overview}</Overview>}
        <Meta>
          {releaseDate && <span>{new Date(releaseDate).getFullYear()}</span>}
          {showScore && score && <Score>{score}</Score>}
        </Meta>
      </CardContent>
    </Card>
  );
}

export default MovieCard;

