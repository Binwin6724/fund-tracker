import React from 'react';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';

const ThemeSwitch = () => {
    const { darkMode, toggleTheme } = useTheme();

    return (
        <IconButton 
            onClick={toggleTheme} 
            color="inherit"
            sx={{
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                    transform: 'rotate(180deg)'
                }
            }}
        >
            {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
    );
};

export default ThemeSwitch;
