/**
 * Authentication Provider Component
 * Manages authentication state and provides context to children
 */
import { createContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getCurrentUser, refreshToken, logout } from '../../services/auth';

// Create auth context
export const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load user data
   */
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      setError('Failed to load user data');
      console.error('Auth provider error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh authentication token
   */
  const handleRefreshToken = useCallback(async () => {
    try {
      await refreshToken();
      await loadUser();
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      setUser(null);
      return false;
    }
  }, [loadUser]);

  /**
   * Logout user
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setUser(null);
      return true;
    } catch (err) {
      console.error('Logout failed:', err);
      return false;
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    loadUser();

    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      if (user) {
        handleRefreshToken();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [loadUser, handleRefreshToken, user]);

  // Create context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    refreshToken: handleRefreshToken,
    logout: handleLogout,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthProvider;

