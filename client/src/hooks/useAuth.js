/**
 * Authentication hook
 * Provides access to authentication context in components
 */
import { useContext } from 'react';
import { AuthContext } from '../components/auth/AuthProvider';

/**
 * Custom hook to access authentication context
 * @returns {Object} Authentication context value
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;

