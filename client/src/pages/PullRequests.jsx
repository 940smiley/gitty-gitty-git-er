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
          <svg className="animate-spin h-10 w-10 mx-auto text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading pull requests...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">Error loading pull requests.</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <ul>
            {filteredPullRequests?.length === 0 ? (
              <li className="p-4 text-gray-500 dark:text-gray-400">No pull requests found.</li>
            ) : (
              filteredPullRequests.map(pr => (
                <li key={pr.id} className="border-b border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <Link to={`/repo/${pr.repository?.full_name}/pull/${pr.number}`} className="text-green-600 dark:text-green-400 font-semibold hover:underline">
                    {pr.title}
                  </Link>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {pr.repository?.full_name} &middot; #{pr.number} &middot; {pr.state}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PullRequests;
