import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import TVShowsPage from './pages/TVShowsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import MovieDetailPage from './pages/MovieDetailPage';
import TVShowDetailPage from './pages/TVShowDetailPage';
import PersonDetailPage from './pages/PersonDetailPage';

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
`;

const MainContent = styled.main`
  padding-top: 80px; // Account for fixed navigation
`;

function App() {
  return (
    <AppContainer>
      <Navigation />
      <MainContent>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tv-shows" element={<TVShowsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/movie/:tmdbId" element={<MovieDetailPage />} />
          <Route path="/tv/:tmdbId" element={<TVShowDetailPage />} />
          <Route path="/person/:personId" element={<PersonDetailPage />} />
        </Routes>
      </MainContent>
    </AppContainer>
  );
}

export default App;

