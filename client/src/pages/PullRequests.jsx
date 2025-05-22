import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { githubApi } from '../services/apiClient';

const PullRequests = () => {
  const [state, setState] = useState('open');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch pull requests
  const { data: pullRequests, isLoading, error } = useQuery(
    ['pullRequests', state],
    () => githubApi.getPullRequests('all', { state }),
    {
      staleTime: 60000 // 1 minute
    }
  );
  
  // Filter pull requests by search term
  const filteredPullRequests = pullRequests?.filter(pr => 
    pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pr.repository?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Pull Requests</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            View and manage pull requests across your repositories
          </p>
        </div>
      </div>
      
      {/* Search and filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Search pull requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <select
            className="block pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
      
      {/* Pull Requests List */}
      {isLoading ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-10 w-10 mx-auto text-green-500" xmlns="htt# Let's check what directories we have
mkdir -p client/src/components/layouts/
mkdir -p client/src/pages/
mkdir -p client/src/context/
mkdir -p client/src/services/
mkdir -p client/src/hooks/
mkdir -p client/src/utils/
mkdir -p client/public/icons/
mkdir -p server/src/{api,auth,middleware,utils}
mkdir -p electron/src

ls -la client/src/
# Let's first create all necessary directories and verify they exist
mkdir -p client/src/components/layouts
mkdir -p client/src/pages
mkdir -p client/src/context
mkdir -p client/src/services
mkdir -p client/src/hooks
mkdir -p client/src/utils
mkdir -p client/public/icons
mkdir -p server/src/{api,auth,middleware,utils}
mkdir -p electron/src

# Verify that directories exist
ls -la client/src/
ls -la client/src/components/
ls -la client/src/pages/
ls -la client/src/context/
ls -la client/src/services/
# Let's create files directly without worrying about directory structure
# First, let's create main.jsx
cat << 'EOF' > client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
