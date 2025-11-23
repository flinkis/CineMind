import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import MovieGrid from '../components/MovieGrid';
import { SkeletonDetailHeader, LoadingContainer, LoadingSpinner, LoadingText } from '../components/SkeletonLoader';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${(props) => props.theme.spacing.xl};
  position: relative;
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

const ProfilePhoto = styled.img`
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.xl};
`;

const PlaceholderPhoto = styled.div`
  width: 100%;
  max-width: 300px;
  aspect-ratio: 2/3;
  background: ${(props) => props.theme.colors.surfaceLight};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.xxxl};
`;

const Info = styled.div`
  flex: 1;
  min-width: 300px;
`;

const Name = styled.h1`
  font-size: ${(props) => props.theme.fontSizes.xxxl};
  margin: 0 0 ${(props) => props.theme.spacing.md} 0;
  color: ${(props) => props.theme.colors.text};
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

const Biography = styled.p`
  font-size: ${(props) => props.theme.fontSizes.md};
  line-height: 1.6;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const BiographyContainer = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const ReadMoreButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.primary};
  cursor: pointer;
  font-size: ${(props) => props.theme.fontSizes.sm};
  font-weight: 600;
  padding: 0;
  margin-top: ${(props) => props.theme.spacing.xs};
  text-decoration: underline;
  transition: color 0.2s;

  &:hover {
    color: ${(props) => props.theme.colors.primaryDark};
  }
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2000;
  display: ${(props) => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.theme.spacing.lg};
  animation: ${(props) => props.$isOpen ? 'fadeIn 0.2s ease' : 'none'};

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: ${(props) => props.$isOpen ? 'slideUp 0.3s ease' : 'none'};

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing.lg};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const ModalTitle = styled.h2`
  font-size: ${(props) => props.theme.fontSizes.xl};
  margin: 0;
  color: ${(props) => props.theme.colors.text};
`;

const ModalCloseButton = styled.button`
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

const ModalContent = styled.div`
  padding: ${(props) => props.theme.spacing.lg};
  overflow-y: auto;
  flex: 1;
`;

const ModalBiography = styled.p`
  font-size: ${(props) => props.theme.fontSizes.md};
  line-height: 1.8;
  color: ${(props) => props.theme.colors.textSecondary};
  white-space: pre-wrap;
  margin: 0;
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

const Section = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: ${(props) => props.theme.fontSizes.xxl};
  margin: 0 0 ${(props) => props.theme.spacing.md} 0;
  color: ${(props) => props.theme.colors.text};
`;

const Tabs = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const Tab = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.lg};
  background: ${(props) =>
        props.$active
            ? props.theme.colors.primary
            : props.theme.colors.surface};
  color: ${(props) =>
        props.$active ? 'white' : props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;
  font-weight: ${(props) => (props.$active ? 600 : 400)};
  font-size: ${(props) => props.theme.fontSizes.sm};

  &:hover {
    background: ${(props) =>
        props.$active
            ? props.theme.colors.primaryDark
            : props.theme.colors.surfaceLight};
    border-color: ${(props) => props.theme.colors.primary};
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
  padding: ${(props) => props.theme.spacing.xl};
  color: ${(props) => props.theme.colors.textMuted};
`;

function PersonDetailPage() {
    const { personId } = useParams();
    const [person, setPerson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('movies'); // 'movies' or 'tv'
    const [activeTab, setActiveTab] = useState('knownFor'); // 'knownFor', 'topRated', 'all'
    const [biographyModalOpen, setBiographyModalOpen] = useState(false);
    
    const MAX_BIOGRAPHY_LENGTH = 300;

    useEffect(() => {
        const fetchPersonDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.get(`/api/persons/${personId}`);
                setPerson(response.data);
            } catch (err) {
                setError(
                    err.response?.data?.error ||
                    'Failed to load person details. Please try again.'
                );
                console.error('Person details error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (personId) {
            fetchPersonDetails();
        }
    }, [personId]);

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const calculateAge = (birthday, deathday) => {
        if (!birthday) return null;
        const birth = new Date(birthday);
        const end = deathday ? new Date(deathday) : new Date();
        const age = end.getFullYear() - birth.getFullYear();
        const monthDiff = end.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
            return age - 1;
        }
        return age;
    };

    if (loading) {
        return (
            <Container>
                <Content>
                    <LoadingContainer>
                        <SkeletonDetailHeader />
                        <LoadingSpinner size="48px" />
                        <LoadingText>Loading person details...</LoadingText>
                    </LoadingContainer>
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

    if (!person) {
        return (
            <Container>
                <Content>
                    <Error>Person not found</Error>
                    <BackButton to="/">← Back to Discover</BackButton>
                </Content>
            </Container>
        );
    }

    // Get movies or TV shows to display based on active category and tab
    const getItemsToDisplay = () => {
        if (activeCategory === 'tv') {
            switch (activeTab) {
                case 'knownFor':
                    return person.knownForTVShows || [];
                case 'topRated':
                    return person.topRatedTVShows || [];
                case 'all':
                    return person.tvShows || [];
                default:
                    return person.knownForTVShows || [];
            }
        } else {
            switch (activeTab) {
                case 'knownFor':
                    return person.knownForMovies || [];
                case 'topRated':
                    return person.topRatedMovies || [];
                case 'all':
                    return person.movies || [];
                default:
                    return person.knownForMovies || [];
            }
        }
    };

    return (
        <Container>
            <Content>
                <BackButton to="/">← Back to Discover</BackButton>

                <Header>
                    {person.profilePath ? (
                        <ProfilePhoto src={person.profilePath} alt={person.name} />
                    ) : (
                        <PlaceholderPhoto>{person.name.charAt(0)}</PlaceholderPhoto>
                    )}

                    <Info>
                        <Name>{person.name}</Name>

                        <Meta>
                            {person.birthday && (
                                <MetaItem>
                                    <strong>Born:</strong> {formatDate(person.birthday)}
                                    {person.deathday && ` - ${formatDate(person.deathday)}`}
                                    {calculateAge(person.birthday, person.deathday) && (
                                        <span>
                                            {' '}
                                            ({calculateAge(person.birthday, person.deathday)} years
                                            {person.deathday ? '' : ' old'})
                                        </span>
                                    )}
                                </MetaItem>
                            )}
                            {person.placeOfBirth && (
                                <MetaItem>
                                    <strong>Place of Birth:</strong> {person.placeOfBirth}
                                </MetaItem>
                            )}
                            {person.knownForDepartment && (
                                <MetaItem>
                                    <strong>Known For:</strong> {person.knownForDepartment}
                                </MetaItem>
                            )}
                        </Meta>

                        {person.biography && (
                            <BiographyContainer>
                                <Biography>
                                    {person.biography.length > MAX_BIOGRAPHY_LENGTH
                                        ? `${person.biography.substring(0, MAX_BIOGRAPHY_LENGTH)}...`
                                        : person.biography}
                                </Biography>
                                {person.biography.length > MAX_BIOGRAPHY_LENGTH && (
                                    <ReadMoreButton onClick={() => setBiographyModalOpen(true)}>
                                        Read more
                                    </ReadMoreButton>
                                )}
                            </BiographyContainer>
                        )}

                        <Actions>
                            {person.imdbUrl && (
                                <SecondaryButton
                                    href={person.imdbUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    IMDb
                                </SecondaryButton>
                            )}
                            {person.tmdbUrl && (
                                <SecondaryButton
                                    href={person.tmdbUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    TMDB
                                </SecondaryButton>
                            )}
                        </Actions>
                    </Info>
                </Header>

                <Stats>
                    {person.totalMovies > 0 && (
                        <Stat>
                            <StatLabel>Total Movies</StatLabel>
                            <StatValue>{person.totalMovies}</StatValue>
                        </Stat>
                    )}
                    {person.totalTVShows > 0 && (
                        <Stat>
                            <StatLabel>Total TV Shows</StatLabel>
                            <StatValue>{person.totalTVShows}</StatValue>
                        </Stat>
                    )}
                    {(person.castCount > 0 || person.castTVCount > 0) && (
                        <Stat>
                            <StatLabel>As Actor</StatLabel>
                            <StatValue>{person.castCount + (person.castTVCount || 0)}</StatValue>
                        </Stat>
                    )}
                    {(person.crewCount > 0 || person.crewTVCount > 0) && (
                        <Stat>
                            <StatLabel>As Crew</StatLabel>
                            <StatValue>{person.crewCount + (person.crewTVCount || 0)}</StatValue>
                        </Stat>
                    )}
                    {person.popularity > 0 && (
                        <Stat>
                            <StatLabel>Popularity</StatLabel>
                            <StatValue>{person.popularity.toFixed(0)}</StatValue>
                        </Stat>
                    )}
                </Stats>

                <Section>
                    <SectionTitle>Filmography</SectionTitle>
                    
                    {/* Category Tabs: Movies vs TV Shows */}
                    <Tabs style={{ marginBottom: '1rem' }}>
                        <Tab
                            $active={activeCategory === 'movies'}
                            onClick={() => {
                                setActiveCategory('movies');
                                setActiveTab('knownFor');
                            }}
                        >
                            Movies ({person.totalMovies || 0})
                        </Tab>
                        <Tab
                            $active={activeCategory === 'tv'}
                            onClick={() => {
                                setActiveCategory('tv');
                                setActiveTab('knownFor');
                            }}
                        >
                            TV Shows ({person.totalTVShows || 0})
                        </Tab>
                    </Tabs>

                    {/* Sub-tabs: Known For, Top Rated, All */}
                    <Tabs>
                        <Tab
                            $active={activeTab === 'knownFor'}
                            onClick={() => setActiveTab('knownFor')}
                        >
                            Known For ({activeCategory === 'movies' 
                                ? (person.knownForMovies?.length || 0)
                                : (person.knownForTVShows?.length || 0)})
                        </Tab>
                        <Tab
                            $active={activeTab === 'topRated'}
                            onClick={() => setActiveTab('topRated')}
                        >
                            Top Rated ({activeCategory === 'movies'
                                ? (person.topRatedMovies?.length || 0)
                                : (person.topRatedTVShows?.length || 0)})
                        </Tab>
                        <Tab
                            $active={activeTab === 'all'}
                            onClick={() => setActiveTab('all')}
                        >
                            All {activeCategory === 'movies' ? 'Movies' : 'TV Shows'} ({activeCategory === 'movies'
                                ? (person.movies?.length || 0)
                                : (person.tvShows?.length || 0)})
                        </Tab>
                    </Tabs>
                    
                    {getItemsToDisplay().length > 0 ? (
                        <MovieGrid>
                            {getItemsToDisplay().map((item) => (
                                <MovieCard
                                    key={item.tmdbId}
                                    movie={item}
                                    showScore={true}
                                />
                            ))}
                        </MovieGrid>
                    ) : (
                        <EmptyState>
                            No {activeCategory === 'movies' ? 'movies' : 'TV shows'} found
                        </EmptyState>
                    )}
                </Section>
            </Content>

            {/* Biography Modal */}
            {person.biography && (
                <ModalOverlay 
                    $isOpen={biographyModalOpen} 
                    onClick={() => setBiographyModalOpen(false)}
                >
                    <ModalContainer 
                        $isOpen={biographyModalOpen}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ModalHeader>
                            <ModalTitle>About {person.name}</ModalTitle>
                            <ModalCloseButton 
                                onClick={() => setBiographyModalOpen(false)}
                                aria-label="Close modal"
                            >
                                ×
                            </ModalCloseButton>
                        </ModalHeader>
                        <ModalContent>
                            <ModalBiography>{person.biography}</ModalBiography>
                        </ModalContent>
                    </ModalContainer>
                </ModalOverlay>
            )}
        </Container>
    );
}

export default PersonDetailPage;

