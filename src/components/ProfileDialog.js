import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Avatar,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `${process.env.REACT_APP_API_URL}${imagePath}`;
};

const ProfileDialog = ({ open, onClose }) => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user?.profileImage ? getProfileImageUrl(user.profileImage) : null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Update local state when user data changes
        if (user) {
            setName(user.name);
            setPreviewUrl(user.profileImage ? getProfileImageUrl(user.profileImage) : null);
        }
    }, [user]);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                return;
            }
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            if (name !== user.name) {
                formData.append('name', name);
            }
            if (currentPassword && newPassword) {
                if (newPassword !== confirmPassword) {
                    setError('New passwords do not match');
                    setLoading(false);
                    return;
                }
                formData.append('currentPassword', currentPassword);
                formData.append('newPassword', newPassword);
            }
            if (selectedImage) {
                formData.append('profileImage', selectedImage);
            }

            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/auth/profile`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Update both context and localStorage
            localStorage.setItem('user', JSON.stringify(response.data)); // Store full user object
            setUser(response.data); // Update context with full user object
            
            setSuccess('Profile updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSelectedImage(null);

            // Hide success message after 3 seconds
            setTimeout(() => {
                setSuccess('');
                onClose(); // Close the dialog after showing success
            }, 3000);
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error.response.data.message === 'Token is not valid') {
                    // Handle token invalidation
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                    navigate('/login');
                } else {
                    // Handle other error responses
                    setError(JSON.stringify(error.response.data));
                }
            } else if (error.request) {
                // The request was made but no response was received
                setError('No response from server. Please check your connection.');
            } else {
                // Something happened in setting up the request that triggered an Error
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Update Profile</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                    
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                        <Avatar
                            src={previewUrl}
                            sx={{ width: 100, height: 100, mb: 2 }}
                        >
                            {user?.name?.charAt(0)}
                        </Avatar>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="icon-button-file"
                            type="file"
                            onChange={handleImageChange}
                        />
                        <label htmlFor="icon-button-file">
                            <IconButton
                                color="primary"
                                aria-label="upload picture"
                                component="span"
                            >
                                <PhotoCamera />
                            </IconButton>
                        </label>
                    </Box>

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        type="text"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        margin="dense"
                        label="Current Password"
                        type="password"
                        fullWidth
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        margin="dense"
                        label="New Password"
                        type="password"
                        fullWidth
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        margin="dense"
                        label="Confirm New Password"
                        type="password"
                        fullWidth
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
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

export default ProfileDialog;
