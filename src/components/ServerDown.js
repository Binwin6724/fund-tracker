import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const ServerDown = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 3
        }}
      >
        <Box
          sx={{
            animation: `${pulse} 2s infinite ease-in-out`,
            mb: 4
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="100"
            fill="currentColor"
            viewBox="0 0 16 16"
            style={{ color: '#f44336' }}
          >
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        </Box>
        <Typography variant="h4" component="h1" gutterBottom color="error">
          Server is Down
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          We're having trouble connecting to our servers. This might be temporary, please try again in a few moments.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRetry}
          sx={{
            mt: 2,
            '&:hover': {
              transform: 'scale(1.05)',
              transition: 'transform 0.2s'
            }
          }}
        >
          Try Again
        </Button>
      </Box>
    </Container>
  );
};

export default ServerDown;
