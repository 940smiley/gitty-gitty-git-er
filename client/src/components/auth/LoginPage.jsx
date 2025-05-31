/**
 * Login Page Component
 * Main authentication page with GitHub login
 */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GithubLogin from './GithubLogin';
import useAuth from '../../hooks/useAuth';

/**
 * Login Page Component
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (isAuthenticated && !loading) {
      navigate('/dashboard');
    }

    // Check for error in URL query params
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    
    if (errorParam) {
      // Map error codes to user-friendly messages
      const errorMessages = {
        'github_auth': 'GitHub authentication failed. Please try again.',
        'github_token': 'Failed to get GitHub token. Please try again.',
        'auth_failed': 'Authentication failed. Please try again.',
        'unknown_error': 'An unknown error occurred. Please try again.'
      };
      
      setError(errorMessages[errorParam] || 'An error occurred. Please try again.');
    }
  }, [isAuthenticated, loading, navigate, location.search]);

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Gitty-Gitty-Git-Er</h1>
        <p className="login-subtitle">A comprehensive GitHub manager with AI capabilities</p>
        
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}
        
        <div className="login-buttons">
          <GithubLogin 
            className="login-button-github" 
            buttonText="Sign in with GitHub" 
          />
        </div>
        
        <div className="login-info">
          <h2>Features:</h2>
          <ul>
            <li>Manage your GitHub repositories</li>
            <li>Edit files with AI assistance</li>
            <li>Works offline with PWA capabilities</li>
            <li>Available as desktop application</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

