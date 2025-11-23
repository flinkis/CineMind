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

// Filter drawer styles
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

const FiltersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing.md};
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

const LanguageOptions = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const LanguageOption = styled.label`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xs};
  cursor: pointer;
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.text};
  user-select: none;
  
  input[type="radio"] {
    cursor: pointer;
    accent-color: ${(props) => props.theme.colors.primary};
  }
  
  &:hover {
    color: ${(props) => props.theme.colors.primary};
  }
`;

const NetworkOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: ${(props) => props.theme.spacing.sm};
  max-height: 300px;
  overflow-y: auto;
`;

const NetworkButton = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  font-size: ${(props) => props.theme.fontSizes.sm};
  background: ${(props) => props.$selected ? props.theme.colors.primary : props.theme.colors.surface};
  border: 2px solid ${(props) => props.$selected ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: ${(props) => props.$selected ? 'white' : props.theme.colors.text};
  cursor: pointer;
  transition: all 0.2s;
  font-weight: ${(props) => props.$selected ? '600' : '400'};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: ${(props) => props.$selected ? props.theme.colors.primaryDark : props.theme.colors.surfaceLight};
    border-color: ${(props) => props.theme.colors.primary};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
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

function TVShowsPage() {
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
  
  // Filter state
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [networkId, setNetworkId] = useState(() => searchParams.get('network') || '');
  const [genreIds, setGenreIds] = useState(() => {
    const genres = searchParams.get('genres');
    return genres ? genres.split(',').filter(Boolean) : [];
  });
  const [minRating, setMinRating] = useState(() => searchParams.get('minRating') || '');
  const [language, setLanguage] = useState(() => searchParams.get('language') || '');
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  
  // Available filter options
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const [tvShows, setTVShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchTotalResults, setSearchTotalResults] = useState(0);
  const [discoveryTVShows, setDiscoveryTVShows] = useState([]);
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
    
    // Update filters from URL
    const urlStatus = searchParams.get('status') || '';
    if (urlStatus !== status) {
      setStatus(urlStatus);
    }
    
    const urlNetwork = searchParams.get('network') || '';
    if (urlNetwork !== networkId) {
      setNetworkId(urlNetwork);
    }
    
    const urlGenres = searchParams.get('genres');
    const urlGenreIds = urlGenres ? urlGenres.split(',').filter(Boolean) : [];
    if (JSON.stringify(urlGenreIds.sort()) !== JSON.stringify(genreIds.sort())) {
      setGenreIds(urlGenreIds);
    }
    
    const urlMinRating = searchParams.get('minRating') || '';
    if (urlMinRating !== minRating) {
      setMinRating(urlMinRating);
    }
    
    const urlLanguage = searchParams.get('language') || '';
    if (urlLanguage !== language) {
      setLanguage(urlLanguage);
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
    
    // Add filter params
    if (status) {
      params.set('status', status);
    }
    if (networkId) {
      params.set('network', networkId);
    }
    if (genreIds.length > 0) {
      params.set('genres', genreIds.join(','));
    }
    if (minRating) {
      params.set('minRating', minRating);
    }
    if (language) {
      params.set('language', language);
    }

    // Only update if params have actually changed
    const currentParamsString = searchParams.toString();
    const newParamsString = params.toString();

    if (currentParamsString !== newParamsString) {
      setSearchParams(params, { replace: true });
    }
  }, [searchQuery, activeTab, currentPage, searchPage, sortBy, status, networkId, genreIds, minRating, language, searchParams, setSearchParams]);

  // Handle tab change - reset page when tab changes
  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
      setCurrentPage(1);
      setDiscoveryTVShows([]);
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
      setTVShows([]);
      setSearchTotalPages(1);
      setSearchTotalResults(0);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchPage(1);
    setTVShows([]);
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

  // Load available filters
  useEffect(() => {
    const loadFilters = async () => {
      setLoadingFilters(true);
      try {
        const [genresResponse, networksResponse] = await Promise.all([
          axios.get('/api/discover/tv/genres').catch(() => ({ data: { genres: [] } })),
          axios.get('/api/discover/tv/networks').catch(() => ({ data: { networks: [] } })),
        ]);
        
        setAvailableGenres(genresResponse.data.genres || []);
        setAvailableNetworks(networksResponse.data.networks || []);
      } catch (err) {
        console.error('Failed to load filters:', err);
      } finally {
        setLoadingFilters(false);
      }
    };
    
    loadFilters();
  }, []);

  // Handle filter changes
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setCurrentPage(1);
    setLoadedPages(new Set([1]));
  };

  const handleNetworkChange = (newNetworkId) => {
    // Toggle off if clicking the same network
    if (networkId === newNetworkId) {
      setNetworkId('');
    } else {
      setNetworkId(newNetworkId);
    }
    setCurrentPage(1);
    setLoadedPages(new Set([1]));
  };

  const handleGenreChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setGenreIds(selected);
    setCurrentPage(1);
    setLoadedPages(new Set([1]));
  };

  const handleMinRatingChange = (newRating) => {
    setMinRating(newRating);
    setCurrentPage(1);
    setLoadedPages(new Set([1]));
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCurrentPage(1);
    setLoadedPages(new Set([1]));
  };

  const handleClearFilters = () => {
    setStatus('');
    setNetworkId('');
    setGenreIds([]);
    setMinRating('');
    setLanguage('');
    setCurrentPage(1);
    setLoadedPages(new Set([1]));
  };

  const handleOpenFiltersDrawer = () => {
    setFiltersDrawerOpen(true);
  };

  const handleCloseFiltersDrawer = () => {
    setFiltersDrawerOpen(false);
  };

  // Check if any filters are active
  const hasActiveFilters = status || networkId || genreIds.length > 0 || minRating || language;

  // Fetch discovery TV shows based on active tab and current page
  // Only runs when page changes via pagination (not load more)
  useEffect(() => {
    // Only fetch discovery TV shows if there's no search query
    if (searchQuery.trim()) {
      return;
    }

    // Skip if we're currently loading more (to avoid replacing appended results)
    if (loadingMore) {
      return;
    }

    const fetchDiscoveryTVShows = async () => {
      setLoadingDiscovery(true);
      setError(null);

      try {
        let endpoint = '/api/discover/tv/popular';
        switch (activeTab) {
          case 'popular':
            endpoint = '/api/discover/tv/popular';
            break;
          case 'top-rated':
            endpoint = '/api/discover/tv/top-rated';
            break;
          case 'on-the-air':
            endpoint = '/api/discover/tv/on-the-air';
            break;
          case 'airing-today':
            endpoint = '/api/discover/tv/airing-today';
            break;
          default:
            endpoint = '/api/discover/tv/popular';
        }

        const params = {
          page: currentPage,
          sort: sortBy,
        };
        
        // Add filter parameters
        if (status) {
          params.status = status;
        }
        if (networkId) {
          params.networks = networkId;
        }
        if (genreIds.length > 0) {
          params.genres = genreIds.join(',');
        }
        if (minRating) {
          params['vote_average.gte'] = minRating;
        }
        if (language) {
          params.language = language;
        }

        const response = await axios.get(endpoint, { params });

        const newTVShows = response.data.results || [];

        // Replace existing TV shows when page changes (pagination)
        setDiscoveryTVShows(newTVShows);
        setLoadedPages(new Set([currentPage]));

        // Update pagination metadata
        setTotalPages(response.data.totalPages || 1);
        setTotalResults(response.data.totalResults || 0);
      } catch (err) {
        console.error('Discovery TV shows error:', err);
        setError(err.response?.data?.message || 'Failed to load TV shows. Please try again.');
        setDiscoveryTVShows([]);
      } finally {
        setLoadingDiscovery(false);
      }
    };

    fetchDiscoveryTVShows();
  }, [activeTab, currentPage, searchQuery, sortBy, status, networkId, genreIds, minRating, language]);

  // Search TV shows - fetch when search query or search page changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTVShows([]);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        // Call backend search endpoint with page and sort parameters
        const response = await axios.get('/api/search/tv', {
          params: {
            q: searchQuery,
            page: searchPage,
            sort: sortBy,
          },
        });

        setTVShows(response.data.results || []);
        setSearchTotalPages(response.data.totalPages || 1);
        setSearchTotalResults(response.data.totalResults || 0);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to search TV shows. Please try again.'
        );
        console.error('Search error:', err);
        setTVShows([]);
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
      // If search is cleared, show discovery TV shows
      setTVShows([]);
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
      let endpoint = '/api/discover/tv/popular';
      switch (activeTab) {
        case 'popular':
          endpoint = '/api/discover/tv/popular';
          break;
        case 'top-rated':
          endpoint = '/api/discover/tv/top-rated';
          break;
        case 'on-the-air':
          endpoint = '/api/discover/tv/on-the-air';
          break;
        case 'airing-today':
          endpoint = '/api/discover/tv/airing-today';
          break;
        default:
          endpoint = '/api/discover/tv/popular';
      }

      const params = {
        page: nextPage,
        sort: sortBy,
      };
      
      // Add filter parameters
      if (status) {
        params.status = status;
      }
      if (networkId) {
        params.networks = networkId;
      }
      if (genreIds.length > 0) {
        params.genres = genreIds.join(',');
      }
      if (minRating) {
        params['vote_average.gte'] = minRating;
      }
      if (language) {
        params.language = language;
      }

      const response = await axios.get(endpoint, { params });

      const newTVShows = response.data.results || [];

      // Append new TV shows (don't replace)
      setDiscoveryTVShows(prev => [...prev, ...newTVShows]);

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
      setError(err.response?.data?.message || 'Failed to load more TV shows. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };


  return (
    <Container>
      <Header>
        <Title>Discover TV Shows</Title>
        <Subtitle>Search for TV shows and build your taste profile</Subtitle>
      </Header>

      <SearchContainer>
        <form onSubmit={handleSearch}>
          <SearchInputWrapper>
            <SearchInput
              type="text"
              placeholder="Search for a TV show..."
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
          <LoadingText>Searching TV shows...</LoadingText>
        </LoadingContainer>
      )}

      {error && <Error>{error}</Error>}

      {/* Search Results */}
      {!loading && !error && tvShows.length > 0 && searchQuery && (
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
              <option value="release-desc">First Air Date (Newest First)</option>
              <option value="release-asc">First Air Date (Oldest First)</option>
              <option value="popularity-desc">Popularity (High to Low)</option>
              <option value="popularity-asc">Popularity (Low to High)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </SortSelect>
          </SortContainer>
          <MovieGrid>
            {tvShows.map((tvShow) => (
              <MovieCard
                key={tvShow.tmdbId}
                movie={{ ...tvShow, type: 'tv' }}
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

      {!loading && !error && tvShows.length === 0 && searchQuery && (
        <EmptyState>No TV shows found. Try a different search term.</EmptyState>
      )}

      {/* Discovery TV Shows */}
      {!searchQuery && (
        <>
          {/* Filters Button */}
          <FiltersButton onClick={handleOpenFiltersDrawer} $hasActive={hasActiveFilters}>
            <span>🔍</span>
            <span>Filters</span>
            {hasActiveFilters && <span>(Active)</span>}
          </FiltersButton>

          {/* Filters Drawer */}
          <DrawerOverlay $isOpen={filtersDrawerOpen} onClick={handleCloseFiltersDrawer} />
          <DrawerContainer $isOpen={filtersDrawerOpen} onClick={(e) => e.stopPropagation()}>
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerCloseButton onClick={handleCloseFiltersDrawer} aria-label="Close filters">
                ×
              </DrawerCloseButton>
            </DrawerHeader>
            <DrawerContent>
              <FiltersContainer>
                <FiltersGrid>
                <FilterGroup>
                  <FilterLabel htmlFor="filter-status">Status</FilterLabel>
                  <FilterSelect
                    id="filter-status"
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="0">Returning Series (Ongoing)</option>
                    <option value="1">Planned</option>
                    <option value="2">In Production</option>
                    <option value="3">Ended</option>
                    <option value="4">Cancelled</option>
                    <option value="5">Pilot</option>
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel>Network</FilterLabel>
                  <NetworkOptions>
                    <NetworkButton
                      type="button"
                      $selected={networkId === ''}
                      onClick={() => handleNetworkChange('')}
                      disabled={loadingFilters}
                    >
                      All Networks
                    </NetworkButton>
                    {availableNetworks.map((network) => (
                      <NetworkButton
                        key={network.id}
                        type="button"
                        $selected={networkId === String(network.id)}
                        onClick={() => handleNetworkChange(String(network.id))}
                        disabled={loadingFilters}
                      >
                        {network.name}
                      </NetworkButton>
                    ))}
                  </NetworkOptions>
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
                  <FilterLabel>Language</FilterLabel>
                  <LanguageOptions>
                    <LanguageOption>
                      <input
                        type="radio"
                        name="language"
                        value=""
                        checked={language === ''}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        disabled={loadingFilters}
                      />
                      <span>All Languages</span>
                    </LanguageOption>
                    <LanguageOption>
                      <input
                        type="radio"
                        name="language"
                        value="en"
                        checked={language === 'en'}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        disabled={loadingFilters}
                      />
                      <span>English</span>
                    </LanguageOption>
                    <LanguageOption>
                      <input
                        type="radio"
                        name="language"
                        value="sv"
                        checked={language === 'sv'}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        disabled={loadingFilters}
                      />
                      <span>Swedish</span>
                    </LanguageOption>
                  </LanguageOptions>
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
              $active={activeTab === 'on-the-air'}
              onClick={() => handleTabChange('on-the-air')}
            >
              On The Air
            </Tab>
            <Tab
              $active={activeTab === 'airing-today'}
              onClick={() => handleTabChange('airing-today')}
            >
              Airing Today
            </Tab>
          </Tabs>

          {loadingDiscovery && discoveryTVShows.length === 0 && (
            <SkeletonMovieGrid count={12} />
          )}

          {!loadingDiscovery && discoveryTVShows.length > 0 && (
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
                  <option value="release-desc">First Air Date (Newest First)</option>
                  <option value="release-asc">First Air Date (Oldest First)</option>
                  <option value="popularity-desc">Popularity (High to Low)</option>
                  <option value="popularity-asc">Popularity (Low to High)</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                </SortSelect>
              </SortContainer>
              <MovieGrid>
                {discoveryTVShows.map((tvShow) => (
                  <MovieCard
                    key={tvShow.tmdbId}
                    movie={{ ...tvShow, type: 'tv' }}
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

          {!loadingDiscovery && discoveryTVShows.length === 0 && !error && (
            <EmptyState>
              No TV shows available at the moment. Please try again later.
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

export default TVShowsPage;

