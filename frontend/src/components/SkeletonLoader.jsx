import React from 'react';
import styled, { keyframes } from 'styled-components';

// Shimmer animation for skeleton loading
const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg,
    ${(props) => props.theme.colors.surfaceLight} 0%,
    ${(props) => props.theme.colors.surface} 50%,
    ${(props) => props.theme.colors.surfaceLight} 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: ${(props) => props.theme.borderRadius.md};
`;

// Skeleton Movie Card
export const SkeletonMovieCard = styled(SkeletonBase)`
  width: 100%;
  aspect-ratio: 2/3;
  border-radius: ${(props) => props.theme.borderRadius.lg};
`;

// Skeleton Text
export const SkeletonText = styled(SkeletonBase)`
  height: ${(props) => props.height || '1rem'};
  width: ${(props) => props.width || '100%'};
  margin-bottom: ${(props) => props.marginBottom || '0.5rem'};
`;

// Skeleton Circle (for avatars, etc.)
export const SkeletonCircle = styled(SkeletonBase)`
  width: ${(props) => props.size || '40px'};
  height: ${(props) => props.size || '40px'};
  border-radius: 50%;
`;

// Skeleton Rectangle
export const SkeletonRect = styled(SkeletonBase)`
  width: ${(props) => props.width || '100%'};
  height: ${(props) => props.height || '1rem'};
  border-radius: ${(props) => props.theme.borderRadius.md};
`;

// Skeleton Movie Card with all elements
const SkeletonCardContainer = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const SkeletonCardContent = styled.div`
  padding: ${(props) => props.theme.spacing.md};
`;

export const SkeletonMovieCardFull = () => (
  <SkeletonCardContainer>
    <SkeletonMovieCard />
    <SkeletonCardContent>
      <SkeletonText height="1.25rem" width="80%" marginBottom="0.5rem" />
      <SkeletonText height="0.875rem" width="60%" marginBottom="0.5rem" />
      <SkeletonText height="0.875rem" width="40%" />
    </SkeletonCardContent>
  </SkeletonCardContainer>
);

// Skeleton Grid for multiple cards
export const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${(props) => props.theme.spacing.lg};
  padding: ${(props) => props.theme.spacing.xl} 0;
`;

// Skeleton Movie Grid (shows multiple skeleton cards)
export const SkeletonMovieGrid = ({ count = 12 }) => (
  <SkeletonGrid>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonMovieCardFull key={index} />
    ))}
  </SkeletonGrid>
);

// Skeleton Detail Page Header
const SkeletonHeaderContainer = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.xl};
  margin-bottom: ${(props) => props.theme.spacing.xl};
  flex-wrap: wrap;
`;

const SkeletonHeaderInfo = styled.div`
  flex: 1;
  min-width: 300px;
`;

const SkeletonPoster = styled(SkeletonRect)`
  border-radius: ${(props) => props.theme.borderRadius.lg};
`;

export const SkeletonDetailHeader = () => (
  <SkeletonHeaderContainer>
    <SkeletonPoster width="300px" height="450px" />
    <SkeletonHeaderInfo>
      <SkeletonText height="2rem" width="70%" marginBottom="1rem" />
      <SkeletonText height="1rem" width="50%" marginBottom="0.5rem" />
      <SkeletonText height="1rem" width="60%" marginBottom="0.5rem" />
      <SkeletonText height="1rem" width="40%" marginBottom="1.5rem" />
      <SkeletonText height="0.875rem" width="100%" marginBottom="0.5rem" />
      <SkeletonText height="0.875rem" width="100%" marginBottom="0.5rem" />
      <SkeletonText height="0.875rem" width="90%" marginBottom="0.5rem" />
      <SkeletonText height="0.875rem" width="95%" />
    </SkeletonHeaderInfo>
  </SkeletonHeaderContainer>
);

// Skeleton Loading Spinner (alternative to skeleton)
export const LoadingSpinner = styled.div`
  display: inline-block;
  width: ${(props) => props.size || '40px'};
  height: ${(props) => props.size || '40px'};
  border: 3px solid ${(props) => props.theme.colors.surfaceLight};
  border-top-color: ${(props) => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Loading Container with spinner
export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.theme.spacing.xxl};
  gap: ${(props) => props.theme.spacing.md};
  color: ${(props) => props.theme.colors.textSecondary};
`;

export const LoadingText = styled.p`
  font-size: ${(props) => props.theme.fontSizes.md};
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0;
`;

