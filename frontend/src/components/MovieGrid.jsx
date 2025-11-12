import styled from 'styled-components';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${(props) => props.theme.spacing.lg};

  @media (max-width: ${(props) => props.theme.breakpoints.sm}) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: ${(props) => props.theme.spacing.md};
  }
`;

function MovieGrid({ children }) {
  return <Grid>{children}</Grid>;
}

export default MovieGrid;

