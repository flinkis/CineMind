import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  padding: ${(props) => props.theme.spacing.md} ${(props) => props.theme.spacing.xl};
  z-index: 1000;
  box-shadow: ${(props) => props.theme.shadows.md};
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: ${(props) => props.theme.fontSizes.xxl};
  font-weight: bold;
  color: ${(props) => props.theme.colors.primary};
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: ${(props) => props.theme.colors.primaryLight};
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.lg};
`;

const NavLink = styled(Link)`
  color: ${(props) =>
    props.$active
      ? props.theme.colors.primary
      : props.theme.colors.textSecondary};
  text-decoration: none;
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: all 0.2s;

  &:hover {
    color: ${(props) => props.theme.colors.primary};
    background: ${(props) => props.theme.colors.surfaceLight};
  }
`;

function Navigation() {
  const location = useLocation();

  return (
    <Nav>
      <NavContainer>
        <Logo to="/">CineMind</Logo>
        <NavLinks>
          <NavLink to="/" $active={location.pathname === '/'}>
            Movies
          </NavLink>
          <NavLink
            to="/tv-shows"
            $active={location.pathname === '/tv-shows'}
          >
            TV Shows
          </NavLink>
          <NavLink
            to="/recommendations"
            $active={location.pathname === '/recommendations'}
          >
            Recommendations
          </NavLink>
        </NavLinks>
      </NavContainer>
    </Nav>
  );
}

export default Navigation;
