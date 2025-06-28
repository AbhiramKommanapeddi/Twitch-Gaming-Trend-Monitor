import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Check for existing token on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        // Verify token with backend
        const response = await axios.get('/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.valid) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.user,
              token: token,
            },
          });
        } else {
          localStorage.removeItem('token');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // This would typically be called after Twitch OAuth redirect
      const response = await axios.post('/api/auth/login', credentials);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });

      toast.success('Successfully logged in!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      toast.success('Successfully logged out');
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await axios.put('/api/auth/profile', userData);
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      const message = error.response?.data?.error || 'Failed to update profile';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update user preferences
  const updatePreferences = async (preferences) => {
    try {
      const response = await axios.put('/api/auth/preferences', preferences);
      dispatch({ 
        type: 'UPDATE_USER', 
        payload: { preferences: response.data.preferences } 
      });
      toast.success('Preferences updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Update preferences error:', error);
      const message = error.response?.data?.error || 'Failed to update preferences';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Initiate Twitch OAuth login
  const loginWithTwitch = () => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-backend-domain.com' 
      : 'http://localhost:5000';
    
    window.location.href = `${baseUrl}/api/auth/twitch`;
  };

  // Handle OAuth callback (extract token from URL)
  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      toast.error('Authentication failed');
      return false;
    }

    if (token) {
      // Verify and set token
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: token,
          user: null, // Will be fetched from profile endpoint
        },
      });

      // Fetch user profile
      fetchUserProfile();
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return true;
    }

    return false;
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/auth/profile');
      dispatch({ type: 'UPDATE_USER', payload: response.data });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    login,
    logout,
    updateUser,
    updatePreferences,
    loginWithTwitch,
    handleOAuthCallback,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
