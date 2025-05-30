import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true
});

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const response = await axiosInstance.get('/api/auth/user');
        console.log('Auth response:', response.data);
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function - redirect to GitHub OAuth
  const login = () => {
    console.log('Redirecting to GitHub OAuth...');
    
    // Get the API URL from environment variables or fallback
    const apiUrl = import.meta.env.VITE_API_URL || '';
    
    if (!apiUrl) {
      console.error('API URL is not configured. Please set VITE_API_URL in your environment variables.');
      alert('Authentication service is not properly configured. Please contact the administrator.');
      return;
    }
    
    // Using environment variable for the API URL
    const authUrl = `${apiUrl}/api/auth/github`;
    console.log('Auth URL:', authUrl);
    window.location.href = authUrl;
  };

  // Logout function
  const logout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Provide auth state and functions to all children
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;