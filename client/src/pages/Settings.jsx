import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import AIProviderConfig from '../components/ai/AIProviderConfig';

const Settings = () => {
  const { user } = useAuthContext();
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [offlineMode, setOfflineMode] = useState(localStorage.getItem('offlineMode') === 'true');
  const [notifications, setNotifications] = useState(localStorage.getItem('notifications') !== 'false');
  
  // Handle theme change
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };
  
  // Handle offline mode change
  const handleOfflineModeChange = (e) => {
    const enabled = e.target.checked;
    setOfflineMode(enabled);
    localStorage.setItem('offlineMode', enabled);
  };
  
  // Handle notifications change
  const handleNotificationsChange = (e) => {
    const enabled = e.target.checked;
    setNotifications(enabled);
    localStorage.setItem('notifications', enabled);
    
    if (enabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  };
  
  // Clear cache
  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cached data? This will remove all offline data.')) {
      if ('caches' in window) {
        caches.keys().then((keyList) => {
          return Promise.all(keyList.map((key) => {
            return caches.delete(key);
          }));
        }).then(() => {
          alert('Cache cleared successfully.');
        });
      }
      
      // Clear IndexedDB
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('gittyGitErDB');
        alert('IndexedDB data cleared.');
      }
      
      // Clear localStorage (except theme)
      const theme = localStorage.getItem('theme');
      localStorage.clear();
      if (theme) localStorage.setItem('theme', theme);
    }
  };
  
  return (
    <div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Configure application preferences
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme
              </label>
              <select
                id="theme"
                value={theme}
                onChange={handleThemeChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Offline Mode */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Offline Access</h3>
          </div>
          <div className="p-4">
            <div className="flex items-start mb-4">
              <div className="flex items-center h-5">
                <input
                  id="offlineMode"
                  name="offlineMode"
                  type="checkbox"
                  checked={offlineMode}
                  onChange={handleOfflineModeChange}
                  className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="offlineMode" className="font-medium text-gray-700 dark:text-gray-300">
                  Enable Offline Mode
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Cache repositories and files for offline access
                </p>
              </div>
            </div>
            
            <button
              onClick={handleClearCache}
              className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Clear Cached Data
            </button>
          </div>
        </div>
        
        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
          </div>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifications"
                  name="notifications"
                  type="checkbox"
                  checked={notifications}
                  onChange={handleNotificationsChange}
                  className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="notifications" className="font-medium text-gray-700 dark:text-gray-300">
                  Enable Notifications
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Receive notifications for important events
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* About */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">About</h3>
          </div>
          <div className="p-4">
            <div className="text-center mb-4">
              <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16">
                <circle cx="60" cy="60" r="54" fill="#2DA44E" />
                <path d="M60 18C36.8 18 18 36.8 18 60C18 78.84 30.54 94.8 48 99.54V84C48 80.69 50.69 78 54 78H66C69.31 78 72 80.69 72 84V99.54C89.46 94.8 102 78.84 102 60C102 36.8 83.2 18 60 18Z" fill="#0D1117"/>
                <path d="M39 45C39 41.69 41.69 39 45 39H75C78.31 39 81 41.69 81 45V60C81 63.31 78.31 66 75 66H45C41.69 66 39 63.31 39 60V45Z" fill="white"/>
                <rect x="45" y="48" width="6" height="9" fill="#0D1117"/>
                <rect x="57" y="48" width="6" height="9" fill="#0D1117"/>
                <rect x="69" y="48" width="6" height="9" fill="#0D1117"/>
              </svg>
              <h4 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">Gitty-Gitty-Git-Er</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              A comprehensive GitHub manager with standalone application capabilities.
            </p>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} All rights reserved
            </p>
            
            <div className="mt-4">
              <a
                href="https://github.com/940smiley/gitty-gitty-git-er"
                className="text-green-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Configuration */}
      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Configuration</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Configure AI providers and settings
          </p>
        </div>
        <div className="p-4">
          <AIProviderConfig />
        </div>
      </div>
    </div>
  );
};

export default Settings;
