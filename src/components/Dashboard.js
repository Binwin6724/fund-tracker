import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useMuiTheme();
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
  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    toRepay: 0
  });

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
      ...transactions.map(t => [
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
    link.setAttribute('download', `transactions_${new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'short' })}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchQuery.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(searchLower) ||
      transaction.category.toLowerCase().includes(searchLower) ||
      transaction.amount.toString().includes(searchQuery) ||
      transaction.type.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Fund Tracker
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
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleSettings}>Settings</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Income
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
                  Total Expenses
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
                  Balance
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
                <Typography color="textSecondary" gutterBottom style={{fontWeight: 'bold'}}>
                  Amount to Repay
                </Typography>
                <Typography variant="h5" component="div" style={{color: 'red'}}>
                  ₹{totals.toRepay.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controls */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center', 
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              '& .MuiFormControl-root': {
                minWidth: { xs: '100%', sm: '160px' }
              },
              '& .search-field': {
                flex: 1,
                minWidth: { xs: '100%', sm: 'auto' }
              },
              '& .action-buttons': {
                display: 'flex',
                gap: 2,
                marginLeft: { xs: 0, sm: 'auto' },
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'space-between', sm: 'flex-end' }
              }
            }}
          >
            <FormControl>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(e.target.value)}
                sx={{ minWidth: '160px' }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
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
              placeholder="Search transactions..."
              value={searchQuery}
              style={{top: '8px'}}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Box className="action-buttons">
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadCSV}
                disabled={transactions.length === 0}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setTransactionOpen(true)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Add Transaction
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Transactions List */}
        <Grid item xs={12}>
          {filteredTransactions.length === 0 ? (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                {searchQuery ? 'No transactions found matching your search.' : 'No transactions for this month.'}
              </Typography>
            </Paper>
          ) : (
            filteredTransactions.map((transaction) => (
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
        <DialogTitle>Delete Transaction</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this transaction?
            {selectedTransaction && (
              <Box sx={{ mt: 2 }}>
                <Typography><strong>Description:</strong> {selectedTransaction.description}</Typography>
                <Typography><strong>Amount:</strong> ₹{selectedTransaction.amount.toFixed(2)}</Typography>
                <Typography><strong>Category:</strong> {selectedTransaction.category}</Typography>
                <Typography><strong>Date:</strong> {new Date(selectedTransaction.date).toLocaleDateString()}</Typography>
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
