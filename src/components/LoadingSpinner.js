import React from 'react';
import { Box, CircularProgress, Backdrop } from '@mui/material';
import { keyframes } from '@mui/system';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const LoadingSpinner = ({ open }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }}
      open={open}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: (theme) => theme.palette.primary.main,
            animation: `${spin} 1s linear infinite`
          }}
        />
      </Box>
    </Backdrop>
  );
};

export default LoadingSpinner;
