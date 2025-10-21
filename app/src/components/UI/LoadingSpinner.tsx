import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large' | 'lg';
  fullScreen?: boolean;
}

/**
 * Loading spinner component with customizable size and message
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'medium', 
  fullScreen = false 
}) => {
  // Map size string to pixel value
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
    lg: 60
  };

  const spinnerSize = sizeMap[size];
  
  // Styles for full screen mode
  const fullScreenStyles = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  } : {};

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        ...fullScreenStyles
      }}
    >
      <CircularProgress 
        size={spinnerSize} 
        thickness={4}
        color="primary"
      />
      {message && (
        <Typography 
          variant="body1" 
          color="textSecondary" 
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;