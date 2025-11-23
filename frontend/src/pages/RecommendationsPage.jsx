import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import MovieGrid from '../components/MovieGrid';
import { SkeletonMovieGrid, LoadingContainer, LoadingSpinner, LoadingText } from '../components/SkeletonLoader';

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

const RefreshButton = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.lg};
  font-size: ${(props) => props.theme.fontSizes.md};
  background: ${(props) => 
    props.disabled 
      ? props.theme.colors.surfaceLight
      : props.theme.colors.success};
  color: white;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: background 0.2s;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.colors.success};
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.5;
  }
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

const InfoBox = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.md};
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: ${(props) => props.theme.fontSizes.sm};
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spacing.sm};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const InfoValue = styled.span`
  color: ${(props) => props.theme.colors.textSecondary};
`;

const StepsList = styled.ul`
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
  padding-left: ${(props) => props.theme.spacing.lg};
  color: ${(props) => props.theme.colors.textSecondary};
  
  li {
    margin-bottom: ${(props) => props.theme.spacing.sm};
  }
`;

const SuccessBox = styled(InfoBox)`
  background: ${(props) => props.theme.colors.surface};
  border: 2px solid ${(props) => props.theme.colors.success};
  border-radius: ${(props) => props.theme.borderRadius.md};
`;

const SuccessLabel = styled(InfoLabel)`
  color: ${(props) => props.theme.colors.success};
`;

const ErrorValue = styled(InfoValue)`
  color: ${(props) => props.theme.colors.error};
`;

// Filter drawer styles (inspired by TVShowsPage)
const FiltersButton = styled.button`
  position: fixed;
  bottom: ${(props) => props.theme.spacing.xl};
  right: ${(props) => props.theme.spacing.xl};
  padding: ${(props) => props.theme.spacing.md} ${(props) => props.theme.spacing.lg};
  font-size: ${(props) => props.theme.fontSizes.md};
  background: ${(props) => props.theme.colors.primary};
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.full};
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.sm};
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    background: ${(props) => props.theme.colors.primaryDark};
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  ${(props) => props.$hasActive && `
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 3px ${props.theme.colors.primary}40;
  `}
`;

const DrawerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: ${(props) => props.$isOpen ? 1 : 0};
  visibility: ${(props) => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
`;

const DrawerContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 90vw;
  background: ${(props) => props.theme.colors.surface};
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  transform: translateX(${(props) => props.$isOpen ? '0' : '100%'});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 100vw;
    max-width: 100vw;
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing.lg};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const DrawerTitle = styled.h3`
  font-size: ${(props) => props.theme.fontSizes.lg};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin: 0;
`;

const DrawerCloseButton = styled.button`
  background: none;
  border: none;
  font-size: ${(props) => props.theme.fontSizes.xl};
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    color: ${(props) => props.theme.colors.text};
  }
`;

const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${(props) => props.theme.spacing.lg};
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.lg};
`;

const FiltersGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.xs};
`;

const FilterLabel = styled.label`
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.textSecondary};
  font-weight: 500;
`;

const FilterSelect = styled.select`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  font-size: ${(props) => props.theme.fontSizes.sm};
  background: ${(props) => props.theme.colors.background};
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: ${(props) => props.theme.colors.text};
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const FilterMultiSelect = styled.select`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  font-size: ${(props) => props.theme.fontSizes.sm};
  background: ${(props) => props.theme.colors.background};
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: ${(props) => props.theme.colors.text};
  cursor: pointer;
  transition: all 0.2s;
  min-height: 100px;
  max-height: 150px;
  overflow-y: auto;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const FilterActions = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.sm};
  flex-wrap: wrap;
  margin-top: ${(props) => props.theme.spacing.md};
  padding-top: ${(props) => props.theme.spacing.md};
  border-top: 1px solid ${(props) => props.theme.colors.border};
`;

const ClearFiltersButton = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  font-size: ${(props) => props.theme.fontSizes.sm};
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: ${(props) => props.theme.colors.text};
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;

  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

function RecommendationsPage() {
  const [apiToken, setApiToken] = useState(
    localStorage.getItem('cinemind_api_token') || ''
  );
  const [limit, setLimit] = useState(20);
  const [movies, setMovies] = useState([]);
  // Start with loading true if API token exists (to auto-load), false otherwise
  const [loading, setLoading] = useState(!!localStorage.getItem('cinemind_api_token'));
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(null);
  const initialLoadRef = useRef(false);
  
  // Filter state
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [minRating, setMinRating] = useState('');
  const [genreIds, setGenreIds] = useState([]);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Load status information
  const loadStatus = async () => {
    if (!apiToken) {
      setStatus(null);
      return;
    }

    setLoadingStatus(true);
    try {
      const response = await axios.get('/api/recommendations/status', {
        params: {
          api_token: apiToken,
        },
      });
      setStatus({
        likedMovies: response.data.likedMovies,
        dislikedMovies: response.data.dislikedMovies,
        upcomingMovies: response.data.upcomingMovies,
        lastUpdate: response.data.lastUpdate,
        hoursSinceLastUpdate: response.data.hoursSinceLastUpdate,
        needsRefresh: response.data.needsRefresh,
        canGenerateRecommendations: response.data.canGenerateRecommendations,
      });
    } catch (err) {
      console.error('Status error:', err);
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Load available genres
  useEffect(() => {
    const loadGenres = async () => {
      setLoadingFilters(true);
      try {
        const response = await axios.get('/api/discover/movies/genres').catch(() => ({ data: { genres: [] } }));
        setAvailableGenres(response.data.genres || []);
      } catch (err) {
        console.error('Failed to load genres:', err);
      } finally {
        setLoadingFilters(false);
      }
    };
    
    loadGenres();
  }, []);

  // Load recommendations from JSON endpoint
  const loadRecommendations = async () => {
    if (!apiToken) {
      setError('API token is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        api_token: apiToken,
        limit,
      };
      
      // Add filter parameters
      if (minYear) {
        params.minYear = minYear;
      }
      if (maxYear) {
        params.maxYear = maxYear;
      }
      if (minRating) {
        params.minRating = minRating;
      }
      if (genreIds.length > 0) {
        params.genres = genreIds.join(',');
      }
      
      const response = await axios.get('/api/recommendations', { params });

      // Movies are already in the correct format
      setMovies(response.data.movies || []);
      
      // Update status from response if available
      if (response.data.status) {
        setStatus({
          likedMovies: response.data.status.likedMovies,
          dislikedMovies: response.data.status.dislikedMovies,
          upcomingMovies: response.data.status.upcomingMovies,
          lastUpdate: response.data.status.lastUpdate,
          hoursSinceLastUpdate: response.data.status.hoursSinceLastUpdate,
          needsRefresh: response.data.status.needsRefresh,
          canGenerateRecommendations: response.data.count > 0,
        });
      }
      
      // Show refresh info if movies were auto-refreshed
      if (response.data.refresh && response.data.refresh.refreshed) {
        console.log('✅ Movies were auto-refreshed:', response.data.refresh.stats);
      }
      
      // Mark initial load as complete after first successful load
      if (!initialLoadRef.current) {
        initialLoadRef.current = true;
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to load recommendations. Check your API token.'
      );
      console.error('Recommendations error:', err);
      // Still mark as complete even on error, so limit changes can retry
      if (!initialLoadRef.current) {
        initialLoadRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  };

  // Save API token to localStorage and auto-load recommendations
  useEffect(() => {
    if (apiToken) {
      localStorage.setItem('cinemind_api_token', apiToken);
      // Reset initial load flag when API token changes
      initialLoadRef.current = false;
      // Load status and recommendations when API token changes
      loadStatus();
      loadRecommendations();
    } else {
      setStatus(null);
      setMovies([]);
      setLoading(false);
      setError(null);
      initialLoadRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiToken]);

  // Auto-load recommendations when limit or filters change (if API token exists and initial load is done)
  useEffect(() => {
    if (apiToken && initialLoadRef.current && !loading) {
      // Reload recommendations when limit or filters change (only after initial load)
      loadRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, minYear, maxYear, minRating, genreIds]);

  // Auto-hide success message after 10 seconds
  useEffect(() => {
    if (refreshSuccess) {
      const timer = setTimeout(() => {
        setRefreshSuccess(null);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [refreshSuccess]);

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

  // Filter handlers
  const handleMinYearChange = (newYear) => {
    setMinYear(newYear);
  };

  const handleMaxYearChange = (newYear) => {
    setMaxYear(newYear);
  };

  const handleMinRatingChange = (newRating) => {
    setMinRating(newRating);
  };

  const handleGenreChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setGenreIds(selected);
  };

  const handleClearFilters = () => {
    setMinYear('');
    setMaxYear('');
    setMinRating('');
    setGenreIds([]);
  };

  const handleOpenFiltersDrawer = () => {
    setFiltersDrawerOpen(true);
  };

  const handleCloseFiltersDrawer = () => {
    setFiltersDrawerOpen(false);
  };

  // Check if any filters are active
  const hasActiveFilters = minYear || maxYear || minRating || genreIds.length > 0;

  // Refresh movies from TMDB
  const handleRefresh = async () => {
    if (!apiToken) {
      setRefreshError('API token is required');
      return;
    }

    setRefreshing(true);
    setRefreshError(null);
    setRefreshSuccess(null);

    try {
      const response = await axios.post('/api/dev/refresh_tmdb', {}, {
        params: {
          api_token: apiToken,
          page: 1,
          maxPages: 'all', // Fetch all pages
          force: false, // Don't force refresh of recently updated movies
        },
      });

      setRefreshSuccess({
        pagesFetched: response.data.stats.pagesFetched || 0,
        totalPages: response.data.stats.totalPages || 'unknown',
        totalFetched: response.data.stats.totalFetched || 0,
        totalProcessed: response.data.stats.totalProcessed || 0,
        totalUpdated: response.data.stats.totalUpdated || 0,
        totalErrors: response.data.stats.totalErrors || 0,
      });

      // Refresh status after successful refresh
      await loadStatus();

      // Automatically reload recommendations after refresh
      await loadRecommendations();
    } catch (err) {
      setRefreshError(
        err.response?.data?.error ||
          'Failed to refresh movies. Check your API token.'
      );
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
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
        <RefreshButton
          onClick={handleRefresh}
          disabled={refreshing || !apiToken || loading}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Movies'}
        </RefreshButton>
      </Controls>

      {apiToken && (
        <RSSUrl>
          <RSSUrlText>{getRSSUrl()}</RSSUrlText>
          <Button onClick={copyRSSUrl}>Copy RSS URL</Button>
        </RSSUrl>
      )}

      {/* Filters Button */}
      {apiToken && (
        <>
          <FiltersButton onClick={handleOpenFiltersDrawer} $hasActive={hasActiveFilters}>
            <span>🔍</span>
            <span>Filters</span>
            {hasActiveFilters && <span>(Active)</span>}
          </FiltersButton>

          {/* Filters Drawer */}
          <DrawerOverlay $isOpen={filtersDrawerOpen} onClick={handleCloseFiltersDrawer} />
          <DrawerContainer $isOpen={filtersDrawerOpen} onClick={(e) => e.stopPropagation()}>
            <DrawerHeader>
              <DrawerTitle>Filter Recommendations</DrawerTitle>
              <DrawerCloseButton onClick={handleCloseFiltersDrawer} aria-label="Close filters">
                ×
              </DrawerCloseButton>
            </DrawerHeader>
            <DrawerContent>
              <FiltersContainer>
                <FiltersGrid>
                  <FilterGroup>
                    <FilterLabel htmlFor="filter-min-year">Min Year</FilterLabel>
                    <FilterSelect
                      id="filter-min-year"
                      value={minYear}
                      onChange={(e) => handleMinYearChange(e.target.value)}
                    >
                      <option value="">Any Year</option>
                      {Array.from({ length: 50 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </FilterSelect>
                  </FilterGroup>

                  <FilterGroup>
                    <FilterLabel htmlFor="filter-max-year">Max Year</FilterLabel>
                    <FilterSelect
                      id="filter-max-year"
                      value={maxYear}
                      onChange={(e) => handleMaxYearChange(e.target.value)}
                    >
                      <option value="">Any Year</option>
                      {Array.from({ length: 50 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </FilterSelect>
                  </FilterGroup>

                  <FilterGroup>
                    <FilterLabel htmlFor="filter-rating">Min Rating</FilterLabel>
                    <FilterSelect
                      id="filter-rating"
                      value={minRating}
                      onChange={(e) => handleMinRatingChange(e.target.value)}
                    >
                      <option value="">Any Rating</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                      <option value="6">6+</option>
                      <option value="7">7+</option>
                      <option value="8">8+</option>
                      <option value="9">9+</option>
                    </FilterSelect>
                  </FilterGroup>

                  <FilterGroup>
                    <FilterLabel htmlFor="filter-genres">Genres (Hold Ctrl/Cmd to select multiple)</FilterLabel>
                    <FilterMultiSelect
                      id="filter-genres"
                      multiple
                      value={genreIds}
                      onChange={handleGenreChange}
                      disabled={loadingFilters}
                      size="4"
                    >
                      {availableGenres.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                          {genre.name}
                        </option>
                      ))}
                    </FilterMultiSelect>
                    {genreIds.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {genreIds.length} selected
                      </div>
                    )}
                  </FilterGroup>
                </FiltersGrid>
                
                {hasActiveFilters && (
                  <FilterActions>
                    <ClearFiltersButton onClick={handleClearFilters}>
                      Clear All Filters
                    </ClearFiltersButton>
                  </FilterActions>
                )}
              </FiltersContainer>
            </DrawerContent>
          </DrawerContainer>
        </>
      )}

      {status && !loadingStatus && (
        <InfoBox>
          <InfoItem>
            <InfoLabel>Liked Movies:</InfoLabel>
            <InfoValue>{status.likedMovies}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Upcoming Movies (with embeddings):</InfoLabel>
            <InfoValue>{status.upcomingMovies}</InfoValue>
          </InfoItem>
          {status.lastUpdate && (
            <InfoItem>
              <InfoLabel>Last Update:</InfoLabel>
              <InfoValue>
                {status.hoursSinceLastUpdate !== null
                  ? `${status.hoursSinceLastUpdate.toFixed(1)} hours ago`
                  : 'Unknown'}
              </InfoValue>
            </InfoItem>
          )}
          {status.needsRefresh && (
            <InfoItem>
              <InfoLabel>Refresh Status:</InfoLabel>
              <InfoValue style={{ color: '#f59e0b' }}>
                Movies will be refreshed automatically when needed
              </InfoValue>
            </InfoItem>
          )}
          <InfoItem>
            <InfoLabel>Status:</InfoLabel>
            <InfoValue>
              {status.canGenerateRecommendations
                ? '✅ Ready to generate recommendations'
                : '⏳ Need more data (movies are being fetched automatically)'}
            </InfoValue>
          </InfoItem>
        </InfoBox>
      )}

      {refreshSuccess && (
        <SuccessBox>
          <InfoItem>
            <SuccessLabel>✅ Refresh Successful!</SuccessLabel>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Pages Fetched:</InfoLabel>
            <InfoValue>{refreshSuccess.pagesFetched} / {refreshSuccess.totalPages}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Movies Fetched:</InfoLabel>
            <InfoValue>{refreshSuccess.totalFetched}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>New Movies Processed:</InfoLabel>
            <InfoValue>{refreshSuccess.totalProcessed}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Movies Updated:</InfoLabel>
            <InfoValue>{refreshSuccess.totalUpdated}</InfoValue>
          </InfoItem>
          {refreshSuccess.totalErrors > 0 && (
            <InfoItem>
              <InfoLabel>Errors:</InfoLabel>
              <ErrorValue>{refreshSuccess.totalErrors}</ErrorValue>
            </InfoItem>
          )}
        </SuccessBox>
      )}

      {refreshError && <Error>{refreshError}</Error>}

      {loading && (
        <LoadingContainer>
          <LoadingSpinner size="48px" />
          <LoadingText>Loading recommendations...</LoadingText>
        </LoadingContainer>
      )}

      {error && <Error>{error}</Error>}

      {!loading && !error && movies.length > 0 && (
        <MovieGrid>
          {movies.map((movie) => (
            <MovieCard 
              key={movie.tmdbId || movie.id} 
              movie={movie} 
              showScore={true}
              showExplanation={true}
            />
          ))}
        </MovieGrid>
      )}

      {!loading && !error && movies.length === 0 && apiToken && (
        <EmptyState>
          <div style={{ marginBottom: '1rem' }}>
            <strong>No recommendations yet.</strong>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            To get recommendations, you need to:
          </div>
          <StepsList>
            <li>
              <strong>Like some movies:</strong> Go to the Discover page and like
              movies you enjoy. This builds your taste profile.
            </li>
            <li>
              <strong>Wait for automatic refresh:</strong> Movies are automatically
              refreshed in the background. If you just liked your first movie, wait
              a moment and the recommendations will update automatically.
            </li>
            <li>
              <strong>Get recommendations:</strong> Once you have liked movies and
              upcoming movies with embeddings, recommendations will appear here automatically.
            </li>
          </StepsList>
          {status && (
            <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
              {status.likedMovies === 0 && (
                <div>⚠️ You haven't liked any movies yet.</div>
              )}
              {status.likedMovies > 0 && status.upcomingMovies === 0 && (
                <div>
                  ⚠️ You have {status.likedMovies} liked movie(s), but no upcoming
                  movies with embeddings yet. Movies are being fetched automatically.
                  {status.needsRefresh && (
                    <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                      (Auto-refresh will happen automatically when recommendations are loaded)
                    </div>
                  )}
                </div>
              )}
              {status.likedMovies > 0 && status.upcomingMovies > 0 && (
                <div>
                  ✅ You have {status.likedMovies} liked movie(s) and {status.upcomingMovies} upcoming
                  movies. Recommendations should appear above.
                </div>
              )}
            </div>
          )}
        </EmptyState>
      )}

      {!loading && !error && movies.length === 0 && !apiToken && (
        <EmptyState>Enter your API token to view recommendations.</EmptyState>
      )}
    </Container>
  );
}

export default RecommendationsPage;

