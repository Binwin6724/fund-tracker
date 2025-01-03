import { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Apply user settings (language, etc.)
    const applyUserSettings = (userData) => {
        if (userData?.settings?.language) {
            i18n.changeLanguage(userData.settings.language);
        }
    };

    useEffect(() => {
        const initAuth = () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            if (token && userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    applyUserSettings(parsedUser);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to login.');
            }
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            applyUserSettings(data.user);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            applyUserSettings(data.user);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const updateUser = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        applyUserSettings(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        // Reset to default language on logout
        i18n.changeLanguage('en');
    };

    return (
        <AuthContext.Provider 
            value={{ 
                user, 
                setUser: updateUser,
                login, 
                register, 
                logout, 
                loading 
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
