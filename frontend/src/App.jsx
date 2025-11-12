import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import RecommendationsPage from './pages/RecommendationsPage';

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
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Routes>
      </MainContent>
    </AppContainer>
  );
}

export default App;

