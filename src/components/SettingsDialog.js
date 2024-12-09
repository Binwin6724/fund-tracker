import React, { useState, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' }
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
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(user?.settings?.language || 'en');
  const [currency, setCurrency] = useState(user?.settings?.currency || 'USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update state when user settings change or dialog opens
  useEffect(() => {
    if (open && user?.settings) {
      setLanguage(user.settings.language || 'en');
      setCurrency(user.settings.currency || 'USD');
      setError('');
      setSuccess('');
    }
  }, [open, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/settings`,
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
      
      // Change language immediately
      await i18n.changeLanguage(language);
      
      setSuccess(t('settings.saveSuccess'));

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Settings update error:', error);
      setError(t('settings.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (user?.settings) {
      setLanguage(user.settings.language || 'en');
      setCurrency(user.settings.currency || 'USD');
    }
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('settings.title')}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('settings.language')}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>{t('settings.language')}</InputLabel>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                label={t('settings.language')}
              >
                {LANGUAGES.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('settings.currency')}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>{t('settings.currency')}</InputLabel>
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                label={t('settings.currency')}
              >
                {CURRENCIES.map((curr) => (
                  <MenuItem key={curr.code} value={curr.code}>
                    {curr.symbol} - {curr.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SettingsDialog;
