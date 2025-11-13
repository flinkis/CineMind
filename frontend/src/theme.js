/**
 * CineMind theme configuration
 * Brand colors and design tokens for styled-components
 */

export const theme = {
  colors: {
    // Primary brand colors
    primary: '#6366f1', // Indigo
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8',
    
    // Secondary colors
    secondary: '#ec4899', // Pink
    secondaryDark: '#db2777',
    secondaryLight: '#f472b6',
    
    // Neutral colors
    background: '#0f172a', // Dark slate
    surface: '#1e293b', // Slate
    surfaceLight: '#334155',
    surfaceDark: '#0c1220',
    
    // Text colors
    text: '#f1f5f9', // Light slate
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    
    // Accent colors
    success: '#10b981', // Green
    warning: '#f59e0b', // Amber
    error: '#ef4444', // Red
    info: '#3b82f6', // Blue
    
    // Interactive colors
    like: '#ef4444', // Red for like button
    likeHover: '#dc2626',
    dislike: '#8b5cf6', // Purple for dislike button
    dislikeHover: '#7c3aed',
    
    // Border colors
    border: '#334155',
    borderLight: '#475569',
  },
  
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    xxl: '3rem', // 48px
  },
  
  borderRadius: {
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    full: '9999px',
  },
  
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  
  fontSizes: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    md: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    xxl: '1.5rem', // 24px
    xxxl: '2rem', // 32px
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

