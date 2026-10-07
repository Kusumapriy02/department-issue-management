import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

/**
 * Auth Context for managing authentication state across the application
 */
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on app load
useEffect(() => {
  const loadUser = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      console.log('[AUTH] Page load check - Token exists:', !!storedToken);

      if (storedToken) {
        // Set token in state FIRST before making API call
        // This ensures interceptor has the token available
        setToken(storedToken);

        try {
          console.log('[AUTH] Fetching user profile...');
          const res = await authAPI.getMe();
          const userData = res.data.data;

          console.log('[AUTH] User profile loaded successfully:', {
            email: userData.email,
            role_from_db: userData.role,
            role_after_transform: userData.role.toLowerCase(),
          });
          setUser({
            ...userData,
            role: userData.role.toLowerCase(),
          });
          setError(null);
        } catch (err) {
          console.error('[AUTH] Failed to load user profile:', {
            status: err.response?.status,
            message: err.response?.data?.message,
            error: err.message,
          });

          // Only logout if token is actually invalid (not transient error)
          if (err.response?.status === 401) {
            console.warn('[AUTH] Token invalid on page load, clearing auth');
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          } else {
            // For other errors, keep token but log the error
            setError('Failed to load user profile. Please refresh if issue persists.');
          }
        }
      } else {
        console.log('[AUTH] No token found, user not authenticated');
      }
    } catch (err) {
      console.error('[AUTH] Unexpected error during auth check:', err);
      setError('Authentication check failed');
    } finally {
      setLoading(false);
    }
  };

  loadUser();
}, []);

  /**
   * Login user with email and password
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[AUTH] Login attempt for:', email);
      
      const response = await authAPI.login(email, password);
      const { token, user: loginUser } = response.data;

      console.log('[AUTH] Login successful, storing token');
      
      // Store token in localStorage FIRST
      localStorage.setItem('token', token);
      setToken(token);

      // Then fetch real user data
      console.log('[AUTH] Fetching user profile after login');
      const res = await authAPI.getMe();
      const userData = res.data.data;

      const transformedUser = {
        ...userData,
        role: userData.role.toLowerCase(),
      };
      
      console.log('[AUTH] User authenticated:', {
        email: userData.email,
        role_from_db: userData.role,
        role_stored: transformedUser.role,
        isFirstLogin: userData.isFirstLogin,
      });
      setUser(transformedUser);
      setError(null);

      return { success: true, user: transformedUser, isFirstLogin: userData.isFirstLogin };
    } catch (err) {
      console.error('[AUTH] Login failed:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.message,
      });
      
      // Clear any partial state on login failure
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    console.log('[AUTH] Logging out user');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  /**
   * Update user role or info
   */
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use Auth Context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
