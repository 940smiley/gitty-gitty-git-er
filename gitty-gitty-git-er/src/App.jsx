/**
 * Gitty-Gitty-Git-Er
 * Main application entry point
 */

// Import all API functions for use in the app
import React, { useState, useEffect, useCallback } from 'react';
import * as GittyGitAPI from './api.js';
import { initAuth, isAuthenticated, loginWithGitHub, logoutFromGitHub, getCurrentUser } from './auth.js';
import { showNotification } from './ui.js';
import { initCache, syncData, clearExpiredData } from './cache.js';
import './styles.css';


// Attach API to window for legacy/global access (optional)
if (typeof window !== 'undefined') {
  window.GittyGitAPI = GittyGitAPI;
}

export default function App() {
  // React state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [offline, setOffline] = useState(!navigator.onLine);

  // Initialize auth and cache on mount
  useEffect(() => {
    initAuth({
      onLogin: handleUserLogin,
      onLogout: handleUserLogout
    });
    initCache({
      onSyncComplete: handleSyncComplete
    });

    // Check authentication on mount
    (async () => {
      if (await isAuthenticated()) {
        await handleUserLogin();
      }
    })();

    // Online/offline listeners
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service worker update notification
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        showNotification('App updated. Refresh for the latest version.', 'info');
      });
    }

    // Periodic cache cleanup
    const interval = setInterval(clearExpiredData, 60 * 60 * 1000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
    // eslint-disable-next-line
  }, []);

  // Theme effect
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handlers
  async function handleUserLogin() {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setCurrentPage('dashboard');
      showNotification(`Welcome, ${userData.login}!`, 'success');
      await loadDashboardData();
    } catch (error) {
      showNotification('Login failed. Please try again.', 'error');
    }
  }

  function handleUserLogout() {
    setUser(null);
    setRepositories([]);
    setPullRequests([]);
    setCurrentPage('login');
    showNotification('You have been logged out', 'info');
  }

  function handleSyncComplete(syncedItems) {
    if (syncedItems.length > 0) {
      showNotification(`${syncedItems.length} items synchronized`, 'success');
    }
  }

  // Navigation
  const navigateToPage = useCallback(async (pageName) => {
    if (pageName !== 'login' && !(await isAuthenticated())) {
      showNotification('Please log in to access this page', 'error');
      return;
    }
    setCurrentPage(pageName);
    if (pageName === 'dashboard') await loadDashboardData();
    if (pageName === 'repositories') await loadRepositoriesData();
    if (pageName === 'prs') await loadPullRequestsData();
    if (pageName === 'code') await updateCodeExplorer();
  }, []);

  // Data loading
  async function loadDashboardData() {
    try {
      const repos = await GittyGitAPI.listRepositories({ per_page: 5 });
      setRepositories(repos);
      const prs = await GittyGitAPI.listPullRequests();
      setPullRequests(prs);
    } catch (error) {
      showNotification(`Failed to load dashboard data: ${error.message}`, 'error');
    }
  }

  async function loadRepositoriesData() {
    try {
      const repos = await GittyGitAPI.listRepositories();
      setRepositories(repos);
    } catch (error) {
      showNotification(`Failed to load repositories: ${error.message}`, 'error');
    }
  }

  async function loadPullRequestsData() {
    try {
      const prs = await GittyGitAPI.listPullRequests();
      setPullRequests(prs);
    } catch (error) {
      showNotification(`Failed to load pull requests: ${error.message}`, 'error');
    }
  }

  // Repo/branch selection
  async function handleRepoChange(e) {
    const repoName = e.target.value;
    setSelectedRepo(repoName);
    setSelectedBranch('');
    if (repoName) {
      try {
        const [owner, repo] = repoName.split('/');
        const branchList = await GittyGitAPI.listBranches(owner, repo);
        setBranches(branchList);
      } catch (error) {
        showNotification(`Failed to load branches: ${error.message}`, 'error');
      }
    } else {
      setBranches([]);
    }
  }

  function handleBranchChange(e) {
    setSelectedBranch(e.target.value);
  }

  function handleThemeChange(e) {
    setTheme(e.target.value);
  }

  // Render
  return (
    <div>
      {/* Theme selection */}
      <select id="theme-select" value={theme} onChange={handleThemeChange}>
        <option value="system">System</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>

      {/* Repository selection */}
      <select id="code-repo-select" value={selectedRepo} onChange={handleRepoChange}>
        <option value="">Select a repository</option>
        {repositories.map(repo => (
          <option key={repo.full_name} value={repo.full_name}>{repo.full_name}</option>
        ))}
      </select>

      {/* Branch selection */}
      <select id="code-branch-select" value={selectedBranch} onChange={handleBranchChange}>
        <option value="">Select a branch</option>
        {branches.map(branch => (
          <option key={branch.name} value={branch.name}>{branch.name}</option>
        ))}
      </select>

      {/* Login/Logout */}
      {!user ? (
        <button onClick={loginWithGitHub}>Login with GitHub</button>
      ) : (
        <div>
          <span>Welcome, {user.login}</span>
          <button onClick={logoutFromGitHub}>Logout</button>
        </div>
      )}

      {/* Navigation Example */}
      <nav>
        <button onClick={() => navigateToPage('dashboard')}>Dashboard</button>
        <button onClick={() => navigateToPage('repositories')}>Repositories</button>
        <button onClick={() => navigateToPage('prs')}>Pull Requests</button>
        <button onClick={() => navigateToPage('code')}>Code</button>
      </nav>

      {/* Page Content Example */}
      <div>
        {currentPage === 'dashboard' && <div>Dashboard content here</div>}
        {currentPage === 'repositories' && <div>Repositories content here</div>}
        {currentPage === 'prs' && <div>Pull Requests content here</div>}
        {currentPage === 'code' && <div>Code Explorer content here</div>}
        {currentPage === 'login' && <div>Please log in to continue.</div>}
      </div>
    </div>
  );
}
<<<<<<< HEAD
=======

// Export public functions
export function updateOnlineStatus(status) {
  // This function can be implemented to update online status from outside the component
  console.log('Online status updated:', status);
}
>>>>>>> 3a6e7d034a086c4d35c13c9b7d2a25bce5233a87
