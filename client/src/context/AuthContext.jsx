import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Debug environment variables
console.log('Environment variables:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_ENABLE_MOCK_AUTH: import.meta.env.VITE_ENABLE_MOCK_AUTH,
  VITE_DEBUG: import.meta.env.VITE_DEBUG
});

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true
});

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  response => {
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log('API Response:', response);
    }
    return response;
  },
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Mock user data for development
  const mockUser = {
    id: 'mock-user-id',
    login: 'mock-user',
    name: 'Mock User',
    avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
    email: 'mock@example.com',
  };

  // Check if user is already authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if mock auth is enabled
        const enableMockAuth = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
        console.log('Checking authentication...', { enableMockAuth });
        
        if (enableMockAuth) {
          console.log('Using mock authentication');
          // Use mock user data
          setUser(mockUser);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
        
        // Log API URL being used
        console.log('API URL:', `${axiosInstance.defaults.baseURL}/auth/user`);
        
        // Real authentication check
        const response = await axiosInstance.get('/auth/user');
        console.log('Auth response:', response.data);
        
        if (response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          console.warn('Auth response contained no user data');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data
          } : 'No response',
          request: error.request ? 'Request was made but no response received' : 'No request was made'
        });
        
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function - redirect to GitHub OAuth or use mock auth
  const login = () => {
    console.log('Login initiated');
    
    // Check if mock auth is enabled
    const enableMockAuth = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
    console.log('Mock auth enabled:', enableMockAuth);
    
    if (enableMockAuth) {
      console.log('Using mock authentication for login');
      setUser(mockUser);
      setIsAuthenticated(true);
      navigate('/');
      return;
    }
    
    console.log('Redirecting to GitHub OAuth...');
    
    // Get the API URL from environment variables or fallback
    const apiUrl = import.meta.env.VITE_API_URL || '';
    
    if (!apiUrl) {
      console.error('API URL is not configured. Please set VITE_API_URL in your environment variables.');
      alert('Authentication service is not properly configured. Please contact the administrator.');
      return;
    }
    
    // Using environment variable for the API URL
    const authUrl = `${apiUrl}/auth/github`;
    console.log('Auth URL:', authUrl);
    
    // Try to open in current window
    try {
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to redirect to auth URL:', error);
      alert('Failed to redirect to authentication service. Please try again or contact support.');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('Logging out...');
      
      // Check if mock auth is enabled
      const enableMockAuth = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
      
      if (enableMockAuth) {
        console.log('Using mock authentication for logout');
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }
      
      // Real logout process
      await axiosInstance.post('/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if logout fails on the server, clear user state
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
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