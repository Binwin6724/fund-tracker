import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
];

const SettingsDialog = ({ open, onClose }) => {
  const { user, setUser } = useAuth();
  const [language, setLanguage] = useState(user?.settings?.language || 'en');
  const [currency, setCurrency] = useState(user?.settings?.currency || 'USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/auth/settings',
        {
          settings: {
            language,
            currency
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess('Settings updated successfully');

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Settings</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Language
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                name="language"
                value={language}
                label="Language"
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
              >
                {LANGUAGES.map(lang => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Currency
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                name="currency"
                value={currency}
                label="Currency"
                onChange={(e) => setCurrency(e.target.value)}
                disabled={loading}
              >
                {CURRENCIES.map(currency => (
                  <MenuItem key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              minWidth: '100px',
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.08)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              minWidth: '100px',
              position: 'relative'
            }}
          >
            {loading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: 'inherit',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px'
                }}
              />
            ) : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SettingsDialog;
