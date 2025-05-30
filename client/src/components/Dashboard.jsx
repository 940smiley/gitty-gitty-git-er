/**
 * Dashboard Component
 * Main application dashboard after authentication
 */
import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

/**
 * Dashboard Component
 */
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <h1>Gitty-Gitty-Git-Er</h1>
        </div>
        
        <div className="dashboard-user">
          {!isOnline && (
            <div className="offline-indicator">
              Offline Mode
            </div>
          )}
          
          <div className="user-info">
            <img 
              src={user.avatar_url} 
              alt={`${user.login}'s avatar`} 
              className="user-avatar" 
            />
            <span className="user-name">{user.name || user.login}</span>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="welcome-message">
          <h2>Welcome, {user.name || user.login}!</h2>
          <p>You can now manage your GitHub repositories with AI assistance.</p>
        </div>
        
        <div className="dashboard-placeholder">
          <h3>Repository List</h3>
          <p>Your repositories will appear here.</p>
          <p>This component will be implemented in the next phase.</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

