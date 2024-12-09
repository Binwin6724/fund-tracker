import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Container,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  useTheme as useMuiTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, FileDownload as FileDownloadIcon, Search as SearchIcon } from '@mui/icons-material';
import ThemeSwitch from './ThemeSwitch';
import ProfileDialog from './ProfileDialog';
import SettingsDialog from './SettingsDialog';
import TransactionDialog from './TransactionDialog';
import LoadingSpinner from './LoadingSpinner';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useMuiTheme();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState({
    type: '',
    category: ''
  });
  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    toRepay: 0
  });
  const [isCheckingServer, setIsCheckingServer] = useState(true);

  // Add server status check
  useEffect(() => {
    const checkServerStatus = async () => {
      setIsCheckingServer(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/healthcheck`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Server is not responding');
        }
      } catch (error) {
        console.error('Server connection error:', error);
        navigate('/server-down');
      } finally {
        setIsCheckingServer(false);
      }
    };
    checkServerStatus();
  }, [navigate]);

  // Transaction type and category options
  const TRANSACTION_TYPES = ['income', 'expense'];
  const TRANSACTION_CATEGORIES = [
    'Salary', 'Freelance', 'Investments',
    'Food', 'Transportation', 'Utilities',
    'Rent', 'Entertainment', 'Shopping',
    'Health', 'Education', 'To Repay'
  ];

  useEffect(() => {
    fetchTransactions(); // eslint-disable-next-line 
  }, [selectedMonth, selectedYear]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/transactions?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        if (data.message === 'Token is not valid') {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
      setTotals({
        totalIncome: data.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0),
        totalExpenses: data.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0),
        balance: data.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0),
        toRepay: data.reduce((acc, t) => t.type === 'expense' && t.category === 'To Repay' ? acc + t.amount : acc, 0)
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    setProfileOpen(true);
  };

  const handleSettings = () => {
    handleClose();
    setSettingsOpen(true);
  };

  const handleTransactionAdded = () => {
    fetchTransactions();
  };

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `${process.env.REACT_APP_API_URL}${imagePath}`;
  };

  const handleDeleteClick = (transaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/transactions/${selectedTransaction._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      await fetchTransactions();
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleDownloadCSV = () => {
    // Format currency function
    const formatCurrency = (amount) => {
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount).replace('₹', '').trim();
      return `"₹ ${formatted}"`; // Wrap in quotes to prevent CSV splitting
    };

    // Create summary section
    const summaryContent = [
      'Monthly Summary',
      `Month,${new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`,
      '',
      'Summary Cards',
      `Total Income,${formatCurrency(totals.totalIncome)}`,
      `Total Expenses,${formatCurrency(totals.totalExpenses)}`,
      `Balance,${formatCurrency(totals.balance)}`,
      `Amount to Repay,${formatCurrency(totals.toRepay)}`,
      '',
      'Transaction Details',
    ];

    // Create transactions section
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const transactionsContent = [
      headers.join(','),
      ...processTransactions().map(t => [
        new Date(t.date).toLocaleDateString('en-IN'),
        t.type,
        t.category,
        `"${t.description.replace(/"/g, '""')}"`, // Handle descriptions with commas
        formatCurrency(t.amount)
      ].join(','))
    ];

    // Combine all content with BOM for Excel
    const BOM = '\uFEFF';
    const csvContent = BOM + [...summaryContent, ...transactionsContent].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `fund_tracker_${selectedMonth}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sorting and Filtering Function
  const processTransactions = () => {
    let result = [...transactions];

    // Filter by type
    if (filterConfig.type) {
      result = result.filter(t => t.type === filterConfig.type);
    }

    // Filter by category
    if (filterConfig.category) {
      result = result.filter(t => t.category === filterConfig.category);
    }

    // Search query filter
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.description.toLowerCase().includes(lowercaseQuery) ||
        t.category.toLowerCase().includes(lowercaseQuery)
      );
    }

    // Sorting
    result.sort((a, b) => {
      const modifier = sortConfig.direction === 'asc' ? 1 : -1;

      switch (sortConfig.key) {
        case 'amount':
          return modifier * (a.amount - b.amount);
        case 'description':
          return modifier * a.description.localeCompare(b.description);
        case 'date':
        default:
          return modifier * (new Date(a.date) - new Date(b.date));
      }
    });

    return result;
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleFilterReset = () => {
    setFilterConfig({ type: '', category: '' });
    setSearchQuery('');
  };

  if (isCheckingServer) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} style={{ display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" style={{ marginRight: '8px' }} className="bi bi-wallet2" viewBox="0 0 16 16">
              <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5z" />
            </svg>
            {t('dashboard.title')}
          </Typography>
          <ThemeSwitch />
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
            sx={{ ml: 1 }}
          >
            <Avatar
              alt={user?.name || 'User'}
              src={getProfileImageUrl(user?.profileImage)}
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 32,
                height: 32
              }}
            >
              {user?.name ? user.name.charAt(0) : 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleProfile}>{t('common.profile')}</MenuItem>
            <MenuItem onClick={handleSettings}>{t('common.settings')}</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>{t('common.logout')}</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('dashboard.totalIncome')}
                </Typography>
                <Typography variant="h5" component="div" color="success.main">
                  ₹{totals.totalIncome.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('dashboard.totalExpenses')}
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  ₹{totals.totalExpenses.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('dashboard.balance')}
                </Typography>
                <Typography
                  variant="h5"
                  component="div"
                  color={totals.balance >= 0 ? 'success.main' : 'error.main'}
                >
                  ₹{totals.balance.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom style={{ fontWeight: 'bold' }}>
                  {t('transactions.toRepay')}
                </Typography>
                <Typography variant="h5" component="div" style={{ color: 'red' }}>
                  ₹{totals.toRepay.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controls */}
        <Grid item xs={12} mb={2}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 2 },
              alignItems: { xs: 'stretch', sm: 'center' },
              flexWrap: 'wrap'
            }}>
              <FormControl sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: '100%', sm: '140px' }
              }}>
                <InputLabel>{t('transactions.month')}</InputLabel>
                <Select
                  value={selectedMonth}
                  label={t('transactions.month')}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  sx={{ minWidth: '160px' }}
                >
                  {[...Array(12)].map((_, index) => (
                    <MenuItem key={index + 1} value={index + 1}>
                      {new Date(2000, index).toLocaleString('default', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: '100%', sm: '140px' }
              }}>
                <InputLabel>{t('transactions.year')}</InputLabel>
                <Select
                  value={selectedYear}
                  label={t('transactions.year')}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{ minWidth: '160px' }}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <TextField
                className="search-field"
                placeholder={t('common.search')}
                variant="outlined"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ top: '8px' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1, minWidth: '200px' }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={() => setTransactionOpen(true)}
                  startIcon={<AddIcon />}
                >
                  {t('dashboard.addTransaction')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadCSV}
                  disabled={transactions.length === 0}
                >
                  {t('common.download')}
                </Button>
              </Box>
            </Box>

            {/* Filter Headers */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 2 },
              alignItems: { xs: 'stretch', sm: 'center' },
              flexWrap: 'wrap'
            }}>
              <Typography variant="subtitle2">{t('transactions.filterBy')}</Typography>
              <FormControl sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: '100%', sm: '140px' }
              }}>
                <InputLabel>{t('transactions.type')}</InputLabel>
                <Select
                  value={filterConfig.type}
                  label={t('transactions.type')}
                  onChange={(e) => setFilterConfig(prev => ({ ...prev, type: e.target.value }))}
                  sx={{ minWidth: '140px' }}
                >
                  <MenuItem value="">{t('common.all')}</MenuItem>
                  {TRANSACTION_TYPES.map(type => (
                    <MenuItem key={type} value={type}>
                      {t(`transactions.${type}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: '100%', sm: '140px' }
              }}>
                <InputLabel>{t('transactions.category')}</InputLabel>
                <Select
                  value={filterConfig.category}
                  label={t('transactions.category')}
                  onChange={(e) => setFilterConfig(prev => ({ ...prev, category: e.target.value }))}
                  sx={{ minWidth: '140px' }}
                >
                  <MenuItem value="">{t('common.all')}</MenuItem>
                  {TRANSACTION_CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>
                      {t(`categories.${category.toLowerCase().replace(' ', '_')}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                size="small"
                variant={'contained'}
                onClick={handleFilterReset}
              >
                {t('common.resetFilters')}
              </Button>
            </Box>

            {/* Sorting Headers */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">{t('transactions.sortBy')}</Typography>
              {[/* eslint-disable indent */
                { key: 'date', label: t('transactions.date') },
                { key: 'amount', label: t('transactions.amount') },
                { key: 'description', label: t('transactions.description') }
              /* eslint-enable indent */
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  size="small"
                  variant={sortConfig.key === key ? 'contained' : 'outlined'}
                  color={sortConfig.key === key ? 'primary' : 'secondary'}
                  onClick={() => handleSort(key)}
                  endIcon={
                    sortConfig.key === key && (
                      sortConfig.direction === 'asc' ? '▲' : '▼'
                    )
                  }
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Transactions List */}
        <Grid item xs={12}>
          {processTransactions().length === 0 ? (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                {searchQuery ? t('transactions.noResults') : t('transactions.noTransactions')}
              </Typography>
            </Paper>
          ) : (
            processTransactions().map((transaction) => (
              <Paper
                key={transaction._id}
                sx={{
                  p: 2,
                  mb: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: 'background.default'
                }}
              >
                <Box>
                  <Typography variant="subtitle1">
                    {transaction.description}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    variant="subtitle1"
                    color={transaction.type === 'income' ? 'primary' : 'error'}
                  >
                    {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(transaction)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'error.contrastText'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            ))
          )}
        </Grid>
      </Container>

      <ProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <TransactionDialog
        open={transactionOpen}
        onClose={() => setTransactionOpen(false)}
        onTransactionAdded={handleTransactionAdded}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('transactions.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('transactions.deleteConfirmMessage')}
            {selectedTransaction && (
              <Box sx={{ mt: 2 }}>
                <Typography><strong>{t('transactions.description')}</strong> {selectedTransaction.description}</Typography>
                <Typography><strong>{t('transactions.amount')}</strong> ₹{selectedTransaction.amount.toFixed(2)}</Typography>
                <Typography><strong>{t('transactions.category')}</strong> {selectedTransaction.category}</Typography>
                <Typography><strong>{t('transactions.date')}</strong> {new Date(selectedTransaction.date).toLocaleDateString()}</Typography>
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
