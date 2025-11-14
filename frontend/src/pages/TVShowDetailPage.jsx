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

// Modal styles for season selection
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${(props) => props.theme.spacing.xl};
`;

const ModalContent = styled.div`
  background: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: ${(props) => props.theme.spacing.xl};
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: ${(props) => props.theme.shadows.xl};
`;

const ModalHeader = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const ModalTitle = styled.h2`
  font-size: ${(props) => props.theme.fontSizes.xl};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin: 0 0 ${(props) => props.theme.spacing.sm} 0;
`;

const ModalDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0;
`;

const SeasonsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.lg};
  max-height: 500px;
  overflow-y: auto;
  padding: ${(props) => props.theme.spacing.sm};
`;

const SeasonItem = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${(props) => props.theme.spacing.sm};
  background: ${(props) => props.theme.colors.surface};
  border: 2px solid ${(props) => props.$selected ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    border-color: ${(props) => props.theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.shadows.md};
  }
`;

const SeasonCheckbox = styled.input`
  position: absolute;
  top: ${(props) => props.theme.spacing.xs};
  right: ${(props) => props.theme.spacing.xs};
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: ${(props) => props.theme.colors.primary};
  z-index: 1;
`;

const SeasonPoster = styled.img`
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  margin-bottom: ${(props) => props.theme.spacing.sm};
`;

const SeasonInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  text-align: center;
`;

const SeasonNumber = styled.div`
  font-size: ${(props) => props.theme.fontSizes.md};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: ${(props) => props.theme.spacing.xs};
`;

const SeasonEpisodeCount = styled.div`
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.textSecondary};
`;

const SeasonPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 2/3;
  background: ${(props) => props.theme.colors.surfaceDark};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  margin-bottom: ${(props) => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.xs};
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
  justify-content: space-between;
  flex-wrap: wrap;
`;

const QuickSelectButtons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.sm};
`;

const QuickSelectButton = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: ${(props) => props.theme.colors.text};
  font-size: ${(props) => props.theme.fontSizes.sm};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const ModalButtonGroup = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
`;

function TVShowDetailPage() {
  const { tmdbId } = useParams();
  const navigate = useNavigate();
  const [tvShow, setTVShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sonarrConfigured, setSonarrConfigured] = useState(false);
  const [addingToSonarr, setAddingToSonarr] = useState(false);
  const [sonarrError, setSonarrError] = useState(null);
  const [sonarrSuccess, setSonarrSuccess] = useState(null);
  const [searchingInSonarr, setSearchingInSonarr] = useState(false);
  const [tvShowInSonarr, setTVShowInSonarr] = useState(false);
  const [searchingSeason, setSearchingSeason] = useState(null);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState(new Set());
  const [pendingAutoSearch, setPendingAutoSearch] = useState(false);

  const handlePersonClick = (personId) => {
    navigate(`/person/${personId}`);
  };

  const handleSimilarTVShowClick = (tmdbId) => {
    navigate(`/tv/${tmdbId}`);
  };

  useEffect(() => {
    const fetchTVShowDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setSonarrError(null);
        setSonarrSuccess(null);
        // Reset Sonarr state when loading new TV show
        setTVShowInSonarr(false);

        const response = await axios.get(`/api/tv/${tmdbId}`);
        setTVShow(response.data);
        // Note: TV shows don't use the same like/dislike system as movies yet
        // We can add this later if needed
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to load TV show details. Please try again.'
        );
        console.error('TV show details error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Check if Sonarr is configured
    const checkSonarrStatus = async () => {
      try {
        const response = await axios.get('/api/sonarr/status');
        setSonarrConfigured(response.data.configured || false);
        // Note: We'll determine if TV show is in Sonarr when user tries to add/search
      } catch (err) {
        // Silently fail - Sonarr is optional
        setSonarrConfigured(false);
      }
    };

    if (tmdbId) {
      fetchTVShowDetails();
      checkSonarrStatus();
    }
  }, [tmdbId]);


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

  // Handle opening season selection modal
  const handleOpenSeasonModal = (autoSearch = false) => {
    if (!tvShow || !tvShow.seasons || tvShow.seasons.length === 0) {
      // If no seasons data, just add directly
      handleAddToSonarr(autoSearch, []);
      return;
    }

    setPendingAutoSearch(autoSearch);
    // Initialize with all seasons selected by default
    const allSeasons = new Set(tvShow.seasons.map(s => s.seasonNumber));
    setSelectedSeasons(allSeasons);
    setShowSeasonModal(true);
  };

  // Handle season checkbox change
  const handleSeasonToggle = (seasonNumber) => {
    setSelectedSeasons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seasonNumber)) {
        newSet.delete(seasonNumber);
      } else {
        newSet.add(seasonNumber);
      }
      return newSet;
    });
  };

  // Handle select all seasons
  const handleSelectAllSeasons = () => {
    if (!tvShow || !tvShow.seasons) return;
    const allSeasons = new Set(tvShow.seasons.map(s => s.seasonNumber));
    setSelectedSeasons(allSeasons);
  };

  // Handle deselect all seasons
  const handleDeselectAllSeasons = () => {
    setSelectedSeasons(new Set());
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setShowSeasonModal(false);
    setSelectedSeasons(new Set());
    setPendingAutoSearch(false);
  };

  // Handle adding TV show to Sonarr with selected seasons
  const handleAddToSonarr = async (autoSearch = false, seasonNumbers = null) => {
    if (addingToSonarr || !tmdbId) return;

    setAddingToSonarr(true);
    setSonarrError(null);
    setSonarrSuccess(null);
    setShowSeasonModal(false);

    try {
      const payload = {
        searchForMissingEpisodesAfterAdd: autoSearch,
      };

      // If season numbers are provided, include them in the payload
      if (seasonNumbers !== null && Array.isArray(seasonNumbers)) {
        payload.seasonNumbers = Array.from(seasonNumbers);
      } else if (seasonNumbers === null && selectedSeasons.size > 0) {
        // Use currently selected seasons from modal
        payload.seasonNumbers = Array.from(selectedSeasons);
      }

      const response = await axios.post(`/api/sonarr/add/${tmdbId}`, payload);
      if (response.data.alreadyExists) {
        setSonarrSuccess('TV show already exists in Sonarr');
        setTVShowInSonarr(true);
      } else {
        let message = 'TV show added to Sonarr successfully!';
        if (response.data.searchCommand) {
          message += ' Search for missing episodes initiated.';
        }
        setSonarrSuccess(message);
        setTVShowInSonarr(true);
      }

      // Clear modal state
      setSelectedSeasons(new Set());
      setPendingAutoSearch(false);
    } catch (err) {
      console.error('Add to Sonarr error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add TV show to Sonarr';
      setSonarrError(errorMessage);
    } finally {
      setAddingToSonarr(false);
    }
  };

  // Handle confirming season selection
  const handleConfirmSeasonSelection = () => {
    if (selectedSeasons.size === 0) {
      setSonarrError('Please select at least one season to add');
      return;
    }
    handleAddToSonarr(pendingAutoSearch, Array.from(selectedSeasons));
  };

  // Handle searching for missing episodes in Sonarr
  const handleSearchInSonarr = async () => {
    if (searchingInSonarr || !tmdbId) return;

    setSearchingInSonarr(true);
    setSonarrError(null);
    setSonarrSuccess(null);

    try {
      const response = await axios.post(`/api/sonarr/search/series/${tmdbId}`);
      setSonarrSuccess('Search for missing episodes initiated! Sonarr is now searching for available episodes.');
    } catch (err) {
      console.error('Search in Sonarr error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to search for TV show in Sonarr';
      setSonarrError(errorMessage);

      // If TV show not found, suggest adding it first
      if (err.response?.status === 404) {
        setTVShowInSonarr(false);
      }
    } finally {
      setSearchingInSonarr(false);
    }
  };

  // Handle searching for missing episodes in a specific season
  const handleSearchSeason = async (seasonNumber) => {
    if (searchingSeason === seasonNumber || !tmdbId) return;

    setSearchingSeason(seasonNumber);
    setSonarrError(null);
    setSonarrSuccess(null);

    try {
      const response = await axios.post(`/api/sonarr/search/season/${tmdbId}/${seasonNumber}`);
      setSonarrSuccess(`Search for missing episodes in Season ${seasonNumber} initiated!`);
    } catch (err) {
      console.error('Search season error:', err);
      const errorMessage = err.response?.data?.error || err.message || `Failed to search for Season ${seasonNumber}`;
      setSonarrError(errorMessage);
    } finally {
      setSearchingSeason(null);
    }
  };

  if (loading) {
    return (
      <Container>
        <Content>
          <Loading>Loading TV show details...</Loading>
        </Content>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Content>
          <Error>{error}</Error>
          <BackButton to="/tv-shows">← Back to TV Shows</BackButton>
        </Content>
      </Container>
    );
  }

  if (!tvShow) {
    return (
      <Container>
        <Content>
          <Error>TV show not found</Error>
          <BackButton to="/tv-shows">← Back to TV Shows</BackButton>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      {tvShow.backdropPath && <Backdrop $backdropUrl={tvShow.backdropPath} />}
      <Content>
        <BackButton to="/tv-shows">← Back to TV Shows</BackButton>

        <MainLayout>
          <MainContent>
            <Header>
              {tvShow.posterPath ? (
                <Poster src={tvShow.posterPath} alt={tvShow.title} />
              ) : (
                <PlaceholderPoster>No Poster</PlaceholderPoster>
              )}

              <Info>
                <Title>{tvShow.title}</Title>
                {tvShow.tagline && <Tagline>{tvShow.tagline}</Tagline>}

                <Meta>
                  {tvShow.firstAirDate && (
                    <MetaItem>
                      <strong>First Air:</strong> {new Date(tvShow.firstAirDate).getFullYear()}
                    </MetaItem>
                  )}
                  {tvShow.lastAirDate && (
                    <MetaItem>
                      <strong>Last Air:</strong> {new Date(tvShow.lastAirDate).getFullYear()}
                    </MetaItem>
                  )}
                  {tvShow.numberOfSeasons > 0 && (
                    <MetaItem>
                      <strong>Seasons:</strong> {tvShow.numberOfSeasons}
                    </MetaItem>
                  )}
                  {tvShow.numberOfEpisodes > 0 && (
                    <MetaItem>
                      <strong>Episodes:</strong> {tvShow.numberOfEpisodes}
                    </MetaItem>
                  )}
                  {tvShow.episodeRunTime && tvShow.episodeRunTime.length > 0 && (
                    <MetaItem>
                      <strong>Runtime:</strong> {tvShow.episodeRunTime[0]} min
                    </MetaItem>
                  )}
                  {tvShow.voteAverage > 0 && (
                    <MetaItem>
                      <strong>Rating:</strong> {tvShow.voteAverage.toFixed(1)}/10
                    </MetaItem>
                  )}
                  {tvShow.status && (
                    <MetaItem>
                      <strong>Status:</strong> {tvShow.status}
                    </MetaItem>
                  )}
                </Meta>

                {tvShow.genres && tvShow.genres.length > 0 && (
                  <Genres>
                    {tvShow.genres.map((genre) => (
                      <Genre key={genre.id}>{genre.name}</Genre>
                    ))}
                  </Genres>
                )}

                {tvShow.overview && <Overview>{tvShow.overview}</Overview>}

                <Actions>
                  {tvShow.trailer && (
                    <Button href={tvShow.trailer.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      ▶ Watch Trailer
                    </Button>
                  )}
                  {tvShow.imdbUrl && (
                    <SecondaryButton href={tvShow.imdbUrl} target="_blank" rel="noopener noreferrer">
                      IMDb
                    </SecondaryButton>
                  )}
                  {tvShow.tmdbUrl && (
                    <SecondaryButton href={tvShow.tmdbUrl} target="_blank" rel="noopener noreferrer">
                      TMDB
                    </SecondaryButton>
                  )}
                  {tvShow.homepage && (
                    <SecondaryButton href={tvShow.homepage} target="_blank" rel="noopener noreferrer">
                      Official Website
                    </SecondaryButton>
                  )}
                  {sonarrConfigured && (
                    <>
                      {!tvShowInSonarr ? (
                        <>
                          <SecondaryButton
                            onClick={() => handleOpenSeasonModal(false)}
                            disabled={addingToSonarr || searchingInSonarr}
                            as="button"
                            style={{ cursor: (addingToSonarr || searchingInSonarr) ? 'not-allowed' : 'pointer' }}
                          >
                            {addingToSonarr ? 'Adding...' : '📥 Add to Sonarr'}
                          </SecondaryButton>
                          <SecondaryButton
                            onClick={() => handleOpenSeasonModal(true)}
                            disabled={addingToSonarr || searchingInSonarr}
                            as="button"
                            style={{ cursor: (addingToSonarr || searchingInSonarr) ? 'not-allowed' : 'pointer' }}
                          >
                            {addingToSonarr ? 'Adding...' : '📥 Add & Search'}
                          </SecondaryButton>
                        </>
                      ) : (
                        <SecondaryButton
                          onClick={handleSearchInSonarr}
                          disabled={searchingInSonarr || addingToSonarr}
                          as="button"
                          style={{ cursor: (searchingInSonarr || addingToSonarr) ? 'not-allowed' : 'pointer' }}
                        >
                          {searchingInSonarr ? 'Searching...' : 'ðŸ” Search All Episodes'}
                        </SecondaryButton>
                      )}
                    </>
                  )}
                </Actions>
                {sonarrError && (
                  <Error style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                    {sonarrError}
                  </Error>
                )}
                {sonarrSuccess && (
                  <div style={{
                    marginTop: '1rem',
                    fontSize: '0.875rem',
                    color: '#10b981',
                    background: '#1e293b',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #10b981'
                  }}>
                    {sonarrSuccess}
                  </div>
                )}
              </Info>
            </Header>

            <Stats>
              {tvShow.voteAverage > 0 && (
                <Stat>
                  <StatLabel>Rating</StatLabel>
                  <StatValue>{tvShow.voteAverage.toFixed(1)}/10</StatValue>
                </Stat>
              )}
              {tvShow.voteCount > 0 && (
                <Stat>
                  <StatLabel>Votes</StatLabel>
                  <StatValue>{tvShow.voteCount.toLocaleString()}</StatValue>
                </Stat>
              )}
              {tvShow.popularity > 0 && (
                <Stat>
                  <StatLabel>Popularity</StatLabel>
                  <StatValue>{tvShow.popularity.toFixed(0)}</StatValue>
                </Stat>
              )}
              {tvShow.numberOfSeasons > 0 && (
                <Stat>
                  <StatLabel>Seasons</StatLabel>
                  <StatValue>{tvShow.numberOfSeasons}</StatValue>
                </Stat>
              )}
              {tvShow.numberOfEpisodes > 0 && (
                <Stat>
                  <StatLabel>Episodes</StatLabel>
                  <StatValue>{tvShow.numberOfEpisodes}</StatValue>
                </Stat>
              )}
            </Stats>

            {tvShow.trailer && (
              <TrailerSection>
                <TrailerTitle>Trailer</TrailerTitle>
                <TrailerContainer>
                  <TrailerIframe
                    src={tvShow.trailer.youtubeEmbedUrl || `https://www.youtube.com/embed/${tvShow.trailer.key}`}
                    title={tvShow.trailer.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </TrailerContainer>
              </TrailerSection>
            )}

            {tvShow.creators && tvShow.creators.length > 0 && (
              <DirectorSection onClick={() => handlePersonClick(tvShow.creators[0].id)}>
                {tvShow.creators[0].profilePath ? (
                  <DirectorPhoto
                    src={tvShow.creators[0].profilePath}
                    alt={tvShow.creators[0].name}
                  />
                ) : (
                  <PlaceholderDirectorPhoto>
                    {tvShow.creators[0].name.charAt(0)}
                  </PlaceholderDirectorPhoto>
                )}
                <DirectorInfo>
                  <DirectorLabel>Creator</DirectorLabel>
                  <DirectorName>{tvShow.creators[0].name}</DirectorName>
                </DirectorInfo>
              </DirectorSection>
            )}

            {tvShow.writers && tvShow.writers.length > 0 && (
              <WritersSection>
                <SectionTitle>Writers</SectionTitle>
                <WritersGrid>
                  {tvShow.writers.map((writer) => (
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

            {tvShow.cast && tvShow.cast.length > 0 && (
              <CastSection>
                <SectionTitle>Cast</SectionTitle>
                <CastGrid>
                  {tvShow.cast.map((actor) => (
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

            {tvShow.productionCompanies && tvShow.productionCompanies.length > 0 && (
              <ProductionSection>
                <SectionTitle>Production Companies</SectionTitle>
                <ProductionList>
                  {tvShow.productionCompanies.map((company) => (
                    <ProductionItem key={company.id}>{company.name}</ProductionItem>
                  ))}
                </ProductionList>
              </ProductionSection>
            )}
          </MainContent>

          {/* Similar Movies Sidebar */}
          {tvShow.similarTVShows && tvShow.similarTVShows.length > 0 && (
            <Sidebar>
              <SimilarMoviesSection>
                <SimilarMoviesTitle>Similar TV Shows</SimilarMoviesTitle>
                {tvShow.similarTVShows.map((similarTVShow) => (
                  <SimilarMovieItem
                    key={similarTVShow.tmdbId}
                    onClick={() => handleSimilarTVShowClick(similarTVShow.tmdbId)}
                  >
                    {similarTVShow.posterPath ? (
                      <SimilarMoviePoster
                        src={similarTVShow.posterPath}
                        alt={similarTVShow.title}
                      />
                    ) : (
                      <PlaceholderSimilarPoster>
                        {similarTVShow.title.charAt(0)}
                      </PlaceholderSimilarPoster>
                    )}
                    <SimilarMovieInfo>
                      <SimilarMovieTitle>{similarTVShow.title}</SimilarMovieTitle>
                      <SimilarMovieMeta>
                        {similarTVShow.firstAirDate && (
                          <span>{new Date(similarTVShow.firstAirDate).getFullYear()}</span>
                        )}
                        {similarTVShow.voteAverage > 0 && (
                          <>
                            <span>•</span>
                            <SimilarMovieRating>
                              {similarTVShow.voteAverage.toFixed(1)}
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

      {/* Season Selection Modal */}
      {showSeasonModal && tvShow && tvShow.seasons && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Select Seasons to Add</ModalTitle>
              <ModalDescription>
                Choose which seasons of "{tvShow.title}" you want to add to Sonarr. Only selected seasons will be monitored.
              </ModalDescription>
            </ModalHeader>

            <QuickSelectButtons>
              <QuickSelectButton onClick={handleSelectAllSeasons}>
                Select All
              </QuickSelectButton>
              <QuickSelectButton onClick={handleDeselectAllSeasons}>
                Deselect All
              </QuickSelectButton>
            </QuickSelectButtons>

            <SeasonsList>
              {tvShow.seasons
                .filter(season => season.seasonNumber >= 0) // Filter out specials (season 0) or include based on preference
                .sort((a, b) => a.seasonNumber - b.seasonNumber)
                .map((season) => (
                  <SeasonItem
                    key={season.id || season.seasonNumber}
                    $selected={selectedSeasons.has(season.seasonNumber)}
                  >
                    <SeasonCheckbox
                      type="checkbox"
                      checked={selectedSeasons.has(season.seasonNumber)}
                      onChange={() => handleSeasonToggle(season.seasonNumber)}
                    />
                    {season.posterPath ? (
                      <SeasonPoster src={season.posterPath} alt={season.name || `Season ${season.seasonNumber}`} />
                    ) : (
                      <SeasonPlaceholder>
                        No Poster
                      </SeasonPlaceholder>
                    )}
                    <SeasonInfo>
                      <SeasonNumber>
                        Season {season.seasonNumber}
                      </SeasonNumber>
                      <SeasonEpisodeCount>
                        {season.episodeCount} episode{season.episodeCount !== 1 ? 's' : ''}
                      </SeasonEpisodeCount>
                    </SeasonInfo>
                  </SeasonItem>
                ))}
            </SeasonsList>

            <ModalActions>
              <ModalButtonGroup>
                <SecondaryButton onClick={handleCloseModal} as="button">
                  Cancel
                </SecondaryButton>
                <Button
                  onClick={handleConfirmSeasonSelection}
                  disabled={selectedSeasons.size === 0 || addingToSonarr}
                  as="button"
                  style={{ cursor: selectedSeasons.size === 0 || addingToSonarr ? 'not-allowed' : 'pointer' }}
                >
                  {addingToSonarr ? 'Adding...' : `Add ${selectedSeasons.size} Season${selectedSeasons.size !== 1 ? 's' : ''}`}
                </Button>
              </ModalButtonGroup>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default TVShowDetailPage;



