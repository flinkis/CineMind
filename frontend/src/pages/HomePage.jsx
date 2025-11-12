import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
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

const SearchContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${(props) => props.theme.spacing.md};
  font-size: ${(props) => props.theme.fontSizes.md};
  background: ${(props) => props.theme.colors.surface};
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: ${(props) => props.theme.colors.text};
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${(props) => props.theme.colors.textMuted};
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

function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [likedMovies, setLikedMovies] = useState(new Set());

  // Search movies
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Call backend search endpoint
      const response = await axios.get('/api/search/movies', {
        params: {
          q: searchQuery,
        },
      });

      setMovies(response.data.results || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to search movies. Please try again.'
      );
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Like a movie
  const handleLike = async (tmdbId) => {
    try {
      await axios.post('/api/dev/user_like', { tmdbId });
      setLikedMovies((prev) => new Set([...prev, tmdbId]));
    } catch (err) {
      console.error('Like error:', err);
      throw err;
    }
  };

  return (
    <Container>
      <Header>
        <Title>Discover Movies</Title>
        <Subtitle>Search for movies and build your taste profile</Subtitle>
      </Header>

      <SearchContainer>
        <form onSubmit={handleSearch}>
          <SearchInput
            type="text"
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </SearchContainer>

      {loading && <Loading>Searching movies...</Loading>}

      {error && <Error>{error}</Error>}

      {!loading && !error && movies.length > 0 && (
        <MovieGrid>
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onLike={handleLike}
              isLiked={likedMovies.has(movie.id)}
            />
          ))}
        </MovieGrid>
      )}

      {!loading && !error && movies.length === 0 && searchQuery && (
        <EmptyState>No movies found. Try a different search term.</EmptyState>
      )}

      {!loading && !error && movies.length === 0 && !searchQuery && (
        <EmptyState>
          Enter a movie title above to start discovering movies.
        </EmptyState>
      )}
    </Container>
  );
}

export default HomePage;

