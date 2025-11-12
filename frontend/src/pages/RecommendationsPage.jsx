import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { parseString } from 'xml2js';
import MovieCard from '../components/MovieCard';
import MovieGrid from '../components/MovieGrid';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${(props) => props.theme.spacing.xl};
`;

const Header = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.xl};
  text-align: center;
`;

const Title = styled.h1`
  font-size: ${(props) => props.theme.fontSizes.xxxl};
  margin-bottom: ${(props) => props.theme.spacing.md};
  color: ${(props) => props.theme.colors.text};
`;

const Subtitle = styled.p`
  font-size: ${(props) => props.theme.fontSizes.lg};
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.xl};
  flex-wrap: wrap;
`;

const Input = styled.input`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  font-size: ${(props) => props.theme.fontSizes.md};
  background: ${(props) => props.theme.colors.surface};
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: ${(props) => props.theme.colors.text};
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const Button = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.lg};
  font-size: ${(props) => props.theme.fontSizes.md};
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;
  transition: background 0.2s;
  font-weight: 600;

  &:hover {
    background: ${(props) => props.theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

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

const EmptyState = styled.div`
  text-align: center;
  padding: ${(props) => props.theme.spacing.xxl};
  color: ${(props) => props.theme.colors.textMuted};
`;

const RSSUrl = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.xl};
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
  align-items: center;
  flex-wrap: wrap;
`;

const RSSUrlText = styled.code`
  flex: 1;
  min-width: 200px;
  padding: ${(props) => props.theme.spacing.sm};
  background: ${(props) => props.theme.colors.surfaceDark};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  color: ${(props) => props.theme.colors.text};
  font-size: ${(props) => props.theme.fontSizes.sm};
  word-break: break-all;
`;

function RecommendationsPage() {
  const [apiToken, setApiToken] = useState(
    localStorage.getItem('cinemind_api_token') || ''
  );
  const [limit, setLimit] = useState(20);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load recommendations from RSS feed
  const loadRecommendations = async () => {
    if (!apiToken) {
      setError('API token is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/rss/recommendations', {
        params: {
          api_token: apiToken,
          limit,
        },
        responseType: 'text',
      });

      // Parse RSS XML
      parseString(response.data, (err, result) => {
        if (err) {
          setError('Failed to parse RSS feed');
          return;
        }

        const items = result.rss?.channel?.[0]?.item || [];
        const parsedMovies = items.map((item) => {
          // Extract similarity score from description
          const description = item.description?.[0] || '';
          const similarityMatch = description.match(/Similarity Score: ([\d.]+)%/);
          const similarity = similarityMatch
            ? parseFloat(similarityMatch[1]) / 100
            : 0;

          // Extract release date
          const releaseDateMatch = description.match(/Release Date: (.+)/);
          const releaseDate = releaseDateMatch
            ? releaseDateMatch[1].trim()
            : null;

          // Get TMDB ID from link
          const link = item.link?.[0] || '';
          const tmdbIdMatch = link.match(/\/movie\/(\d+)/);
          const tmdbId = tmdbIdMatch ? parseInt(tmdbIdMatch[1]) : null;

          return {
            id: item.guid?.[0]?._ || tmdbId,
            tmdbId,
            title: item.title?.[0] || 'Unknown',
            overview: description.split('\n\n')[0] || '',
            posterPath: item.enclosure?.[0]?.$.url || null,
            releaseDate,
            similarity,
          };
        });

        setMovies(parsedMovies);
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to load recommendations. Check your API token.'
      );
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save API token to localStorage
  useEffect(() => {
    if (apiToken) {
      localStorage.setItem('cinemind_api_token', apiToken);
    }
  }, [apiToken]);

  // Get RSS URL for copying
  const getRSSUrl = () => {
    if (!apiToken) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/rss/recommendations?api_token=${apiToken}&limit=${limit}`;
  };

  // Copy RSS URL to clipboard
  const copyRSSUrl = () => {
    const url = getRSSUrl();
    navigator.clipboard.writeText(url).then(() => {
      alert('RSS URL copied to clipboard!');
    });
  };

  return (
    <Container>
      <Header>
        <Title>Your Recommendations</Title>
        <Subtitle>Movies tailored to your taste profile</Subtitle>
      </Header>

      <Controls>
        <Input
          type="text"
          placeholder="API Token"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Limit"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
          min="1"
          max="100"
        />
        <Button onClick={loadRecommendations} disabled={loading || !apiToken}>
          {loading ? 'Loading...' : 'Load Recommendations'}
        </Button>
      </Controls>

      {apiToken && (
        <RSSUrl>
          <RSSUrlText>{getRSSUrl()}</RSSUrlText>
          <Button onClick={copyRSSUrl}>Copy RSS URL</Button>
        </RSSUrl>
      )}

      {loading && <Loading>Loading recommendations...</Loading>}

      {error && <Error>{error}</Error>}

      {!loading && !error && movies.length > 0 && (
        <MovieGrid>
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} showScore={true} />
          ))}
        </MovieGrid>
      )}

      {!loading && !error && movies.length === 0 && apiToken && (
        <EmptyState>
          No recommendations yet. Like some movies first to build your taste
          profile!
        </EmptyState>
      )}

      {!loading && !error && movies.length === 0 && !apiToken && (
        <EmptyState>Enter your API token to view recommendations.</EmptyState>
      )}
    </Container>
  );
}

export default RecommendationsPage;

