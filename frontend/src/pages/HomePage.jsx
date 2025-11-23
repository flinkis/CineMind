import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const SearchContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${(props) => props.theme.spacing.md};
  padding-right: ${(props) => props.$hasValue ? '3rem' : props.theme.spacing.md};
  font-size: ${(props) => props.theme.fontSizes.md};
  background: ${(props) => props.theme.colors.surface};
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: ${(props) => props.theme.colors.text};
  transition: border-color 0.2s, padding-right 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${(props) => props.theme.colors.textMuted};
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: ${(props) => props.theme.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  background: ${(props) => props.theme.colors.surfaceLight};
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.full};
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.lg};
  line-height: 1;
  transition: all 0.2s;
  padding: 0;
  font-weight: 600;

  &:hover {
    background: ${(props) => props.theme.colors.surfaceLight};
    color: ${(props) => props.theme.colors.text};
    transform: translateY(-50%) scale(1.1);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${(props) => props.theme.colors.primary};
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

const Tabs = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.xl};
  flex-wrap: wrap;
  justify-content: center;
  border-bottom: 2px solid ${(props) => props.theme.colors.border};
  padding-bottom: ${(props) => props.theme.spacing.md};
`;

const Tab = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.lg};
  background: ${(props) =>
    props.$active
      ? props.theme.colors.primary
      : 'transparent'};
  color: ${(props) =>
    props.$active ? 'white' : props.theme.colors.text};
  border: none;
  border-bottom: 2px solid ${(props) =>
    props.$active
      ? props.theme.colors.primary
      : 'transparent'};
  border-radius: ${(props) => props.theme.borderRadius.md} ${(props) => props.theme.borderRadius.md} 0 0;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: ${(props) => (props.$active ? 600 : 400)};
  font-size: ${(props) => props.theme.fontSizes.sm};
  margin-bottom: -${(props) => props.theme.spacing.md};

  &:hover {
    background: ${(props) =>
    props.$active
      ? props.theme.colors.primaryDark
      : props.theme.colors.surfaceLight};
    color: ${(props) =>
    props.$active ? 'white' : props.theme.colors.primary};
  }
`;

const SectionTitle = styled.h2`
  font-size: ${(props) => props.theme.fontSizes.xxl};
  margin: ${(props) => props.theme.spacing.xl} 0 ${(props) => props.theme.spacing.md} 0;
  color: ${(props) => props.theme.colors.text};
  text-align: center;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${(props) => props.theme.spacing.md};
  margin: ${(props) => props.theme.spacing.xl} 0;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  font-size: ${(props) => props.theme.fontSizes.sm};
  background: ${(props) =>
    props.$disabled
      ? props.theme.colors.surfaceDark
      : props.theme.colors.primary};
  color: ${(props) =>
    props.$disabled ? props.theme.colors.textMuted : 'white'};
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s;
  font-weight: 600;
  min-width: 100px;

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const PageInfo = styled.div`
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.textSecondary};
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
`;

const LoadMoreButton = styled.button`
  padding: ${(props) => props.theme.spacing.md} ${(props) => props.theme.spacing.xl};
  font-size: ${(props) => props.theme.fontSizes.md};
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  margin: ${(props) => props.theme.spacing.xl} auto;
  display: block;

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SortContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.lg};
  flex-wrap: wrap;
`;

const SortLabel = styled.label`
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.textSecondary};
  font-weight: 500;
`;

const SortSelect = styled.select`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  font-size: ${(props) => props.theme.fontSizes.sm};
  background: ${(props) => props.theme.colors.surface};
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: ${(props) => props.theme.colors.text};
  cursor: pointer;
  transition: all 0.2s;
  min-width: 160px;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'popular');
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [searchPage, setSearchPage] = useState(() => {
    // If there's a search query, use page param for search, otherwise use for discovery
    const pageParam = searchParams.get('page');
    return (searchParams.get('q') && pageParam) ? parseInt(pageParam, 10) : 1;
  });
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'default');

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchTotalResults, setSearchTotalResults] = useState(0);
  const [discoveryMovies, setDiscoveryMovies] = useState([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedPages, setLoadedPages] = useState(() => {
    const pageParam = searchParams.get('page');
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    return new Set([initialPage]);
  });

  // Sync state with URL params when URL changes (e.g., browser back/forward)
  // This effect runs when searchParams change externally (e.g., browser navigation)
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlPage = searchParams.get('page');
    const urlTab = searchParams.get('tab') || 'popular';

    // Only update if URL params differ from current state
    // This prevents unnecessary re-renders and infinite loops
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }

    if (urlTab !== activeTab && !urlQuery.trim()) {
      // Only update tab if there's no search query (search takes priority)
      setActiveTab(urlTab);
    }

    // Update page based on whether there's a search query
    if (urlQuery.trim()) {
      const page = urlPage ? parseInt(urlPage, 10) : 1;
      if (page !== searchPage) {
        setSearchPage(page);
      }
    } else {
      const page = urlPage ? parseInt(urlPage, 10) : 1;
      if (page !== currentPage) {
        setCurrentPage(page);
      }
    }

    // Update sort
    const urlSort = searchParams.get('sort') || 'default';
    if (urlSort !== sortBy) {
      setSortBy(urlSort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set('q', searchQuery);
      // Use searchPage when there's a search query
      if (searchPage > 1) {
        params.set('page', searchPage.toString());
      }
    } else {
      // Use currentPage for discovery when there's no search query
      if (activeTab !== 'popular') {
        params.set('tab', activeTab);
      }
      if (currentPage > 1) {
        params.set('page', currentPage.toString());
      }
    }

    // Add sort param if not default
    if (sortBy !== 'default') {
      params.set('sort', sortBy);
    }

    // Only update if params have actually changed
    const currentParamsString = searchParams.toString();
    const newParamsString = params.toString();

    if (currentParamsString !== newParamsString) {
      setSearchParams(params, { replace: true });
    }
  }, [searchQuery, activeTab, currentPage, searchPage, sortBy, searchParams, setSearchParams]);

  // Handle tab change - reset page when tab changes
  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
      setCurrentPage(1);
      setDiscoveryMovies([]);
      setLoadedPages(new Set([1]));
    }
  };

  // Handle search change
  const handleSearchChange = (value) => {
    // If the search query is changing to a different value, reset to page 1
    // This prevents being on an invalid page (e.g., page 5 when new search only has 2 pages)
    if (value.trim() !== searchQuery.trim()) {
      setSearchPage(1);
    }
    setSearchQuery(value);
    if (!value.trim()) {
      setMovies([]);
      setSearchTotalPages(1);
      setSearchTotalResults(0);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchPage(1);
    setMovies([]);
    setSearchTotalPages(1);
    setSearchTotalResults(0);
  };

  // Handle search page change
  const handleSearchPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= searchTotalPages) {
      setSearchPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setLoadedPages(new Set([newPage]));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    // Reset to page 1 when sort changes to show sorted results from the beginning
    if (searchQuery.trim()) {
      setSearchPage(1);
    } else {
      setCurrentPage(1);
    }
  };

  // Fetch discovery movies based on active tab and current page
  // Only runs when page changes via pagination (not load more)
  useEffect(() => {
    // Only fetch discovery movies if there's no search query
    if (searchQuery.trim()) {
      return;
    }

    // Skip if we're currently loading more (to avoid replacing appended results)
    if (loadingMore) {
      return;
    }

    const fetchDiscoveryMovies = async () => {
      setLoadingDiscovery(true);
      setError(null);

      try {
        let endpoint = '/api/discover/popular';
        switch (activeTab) {
          case 'popular':
            endpoint = '/api/discover/popular';
            break;
          case 'top-rated':
            endpoint = '/api/discover/top-rated';
            break;
          case 'now-playing':
            endpoint = '/api/discover/now-playing';
            break;
          case 'upcoming':
            endpoint = '/api/discover/upcoming';
            break;
          default:
            endpoint = '/api/discover/popular';
        }

        const response = await axios.get(endpoint, {
          params: {
            page: currentPage,
            sort: sortBy,
          },
        });

        const newMovies = response.data.results || [];

        // Replace existing movies when page changes (pagination)
        setDiscoveryMovies(newMovies);
        setLoadedPages(new Set([currentPage]));

        // Update pagination metadata
        setTotalPages(response.data.totalPages || 1);
        setTotalResults(response.data.totalResults || 0);
      } catch (err) {
        console.error('Discovery movies error:', err);
        setError(err.response?.data?.message || 'Failed to load movies. Please try again.');
        setDiscoveryMovies([]);
      } finally {
        setLoadingDiscovery(false);
      }
    };

    fetchDiscoveryMovies();
  }, [activeTab, currentPage, searchQuery, sortBy]);

  // Search movies - fetch when search query or search page changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMovies([]);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        // Call backend search endpoint with page and sort parameters
        const response = await axios.get('/api/search/movies', {
          params: {
            q: searchQuery,
            page: searchPage,
            sort: sortBy,
          },
        });

        setMovies(response.data.results || []);
        setSearchTotalPages(response.data.totalPages || 1);
        setSearchTotalResults(response.data.totalResults || 0);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to search movies. Please try again.'
        );
        console.error('Search error:', err);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPage, sortBy]);

  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // If search is cleared, show discovery movies
      setMovies([]);
      setSearchPage(1);
      setSearchTotalPages(1);
      setSearchTotalResults(0);
      return;
    }

    // Reset to page 1 when submitting a new search
    // The useEffect will handle the actual fetch when searchPage changes
    if (searchPage !== 1) {
      setSearchPage(1);
    }
    // If already on page 1, the useEffect will fetch when searchQuery changes
  };


  // Handle load more - appends next page of results
  const handleLoadMore = async () => {
    // Find the highest loaded page, then load the next one
    const loadedPagesArray = Array.from(loadedPages);
    const maxLoadedPage = loadedPagesArray.length > 0 ? Math.max(...loadedPagesArray) : 0;
    const nextPage = maxLoadedPage + 1;

    // If next page exceeds total pages or we're already loading, return
    if (nextPage > totalPages || loadingDiscovery || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      let endpoint = '/api/discover/popular';
      switch (activeTab) {
        case 'popular':
          endpoint = '/api/discover/popular';
          break;
        case 'top-rated':
          endpoint = '/api/discover/top-rated';
          break;
        case 'now-playing':
          endpoint = '/api/discover/now-playing';
          break;
        case 'upcoming':
          endpoint = '/api/discover/upcoming';
          break;
        default:
          endpoint = '/api/discover/popular';
      }

      const response = await axios.get(endpoint, {
        params: {
          page: nextPage,
          sort: sortBy,
        },
      });

      const newMovies = response.data.results || [];

      // Append new movies (don't replace)
      setDiscoveryMovies(prev => [...prev, ...newMovies]);

      // Mark this page as loaded
      setLoadedPages(prev => new Set([...prev, nextPage]));

      // Update total pages/results if needed
      if (response.data.totalPages) {
        setTotalPages(response.data.totalPages);
      }
      if (response.data.totalResults) {
        setTotalResults(response.data.totalResults);
      }
    } catch (err) {
      console.error('Load more error:', err);
      setError(err.response?.data?.message || 'Failed to load more movies. Please try again.');
    } finally {
      setLoadingMore(false);
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
          <SearchInputWrapper>
            <SearchInput
              type="text"
              placeholder="Search for a movie..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              $hasValue={!!searchQuery.trim()}
            />
            {searchQuery.trim() && (
              <ClearButton
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                title="Clear search"
              >
                ×
              </ClearButton>
            )}
          </SearchInputWrapper>
        </form>
      </SearchContainer>

      {loading && (
        <LoadingContainer>
          <LoadingSpinner size="48px" />
          <LoadingText>Searching movies...</LoadingText>
        </LoadingContainer>
      )}

      {error && <Error>{error}</Error>}

      {/* Search Results */}
      {!loading && !error && movies.length > 0 && searchQuery && (
        <>
          <SectionTitle>
            Search Results
            {searchTotalResults > 0 && (
              <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                ({searchTotalResults.toLocaleString()} results)
              </span>
            )}
          </SectionTitle>
          <SortContainer>
            <SortLabel htmlFor="search-sort">Sort by:</SortLabel>
            <SortSelect
              id="search-sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="rating-desc">Rating (High to Low)</option>
              <option value="rating-asc">Rating (Low to High)</option>
              <option value="release-desc">Release Date (Newest First)</option>
              <option value="release-asc">Release Date (Oldest First)</option>
              <option value="popularity-desc">Popularity (High to Low)</option>
              <option value="popularity-asc">Popularity (Low to High)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </SortSelect>
          </SortContainer>
          <MovieGrid>
            {movies.map((movie) => (
              <MovieCard
                key={movie.tmdbId}
                movie={movie}
              />
            ))}
          </MovieGrid>

          {/* Search Pagination Controls */}
          {searchTotalPages > 1 && (
            <PaginationContainer>
              <PaginationButton
                onClick={() => handleSearchPageChange(searchPage - 1)}
                disabled={searchPage === 1 || loading}
              >
                Previous
              </PaginationButton>

              <PageInfo>
                Page {searchPage} of {searchTotalPages}
              </PageInfo>

              <PaginationButton
                onClick={() => handleSearchPageChange(searchPage + 1)}
                disabled={searchPage >= searchTotalPages || loading}
              >
                Next
              </PaginationButton>
            </PaginationContainer>
          )}
        </>
      )}

      {!loading && !error && movies.length === 0 && searchQuery && (
        <EmptyState>No movies found. Try a different search term.</EmptyState>
      )}

      {/* Discovery Movies */}
      {!searchQuery && (
        <>
          <Tabs>
            <Tab
              $active={activeTab === 'popular'}
              onClick={() => handleTabChange('popular')}
            >
              Popular
            </Tab>
            <Tab
              $active={activeTab === 'top-rated'}
              onClick={() => handleTabChange('top-rated')}
            >
              Top Rated
            </Tab>
            <Tab
              $active={activeTab === 'now-playing'}
              onClick={() => handleTabChange('now-playing')}
            >
              Now Playing
            </Tab>
            <Tab
              $active={activeTab === 'upcoming'}
              onClick={() => handleTabChange('upcoming')}
            >
              Upcoming
            </Tab>
          </Tabs>

          {loadingDiscovery && discoveryMovies.length === 0 && (
            <SkeletonMovieGrid count={12} />
          )}

          {!loadingDiscovery && discoveryMovies.length > 0 && (
            <>
              <SortContainer>
                <SortLabel htmlFor="discovery-sort">Sort by:</SortLabel>
                <SortSelect
                  id="discovery-sort"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="rating-desc">Rating (High to Low)</option>
                  <option value="rating-asc">Rating (Low to High)</option>
                  <option value="release-desc">Release Date (Newest First)</option>
                  <option value="release-asc">Release Date (Oldest First)</option>
                  <option value="popularity-desc">Popularity (High to Low)</option>
                  <option value="popularity-asc">Popularity (Low to High)</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                </SortSelect>
              </SortContainer>
              <MovieGrid>
                {discoveryMovies.map((movie) => (
                  <MovieCard
                    key={movie.tmdbId}
                    movie={movie}
                  />
                ))}
              </MovieGrid>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <PaginationContainer>
                  <PaginationButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loadingDiscovery}
                  >
                    Previous
                  </PaginationButton>

                  <PageInfo>
                    Page {currentPage} of {totalPages}
                    {totalResults > 0 && (
                      <span> ({totalResults.toLocaleString()} results)</span>
                    )}
                  </PageInfo>

                  <PaginationButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || loadingDiscovery}
                  >
                    Next
                  </PaginationButton>
                </PaginationContainer>
              )}

              {/* Load More Button (appends more results) */}
              {/* Only show when on first page or when multiple pages are loaded */}
              {(currentPage === 1 || loadedPages.size > 1) && loadedPages.size < totalPages && (
                <LoadMoreButton
                  onClick={handleLoadMore}
                  disabled={loadingDiscovery || loadingMore}
                >
                  {loadingMore ? 'Loading...' : `Load More (${loadedPages.size}/${totalPages} pages)`}
                </LoadMoreButton>
              )}
            </>
          )}

          {!loadingDiscovery && discoveryMovies.length === 0 && !error && (
            <EmptyState>
              No movies available at the moment. Please try again later.
            </EmptyState>
          )}

          {error && !loadingDiscovery && (
            <Error>{error}</Error>
          )}
        </>
      )}
    </Container>
  );
}

export default HomePage;

