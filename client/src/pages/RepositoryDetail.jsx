import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { githubApi } from '../services/apiClient';

const RepositoryDetail = () => {
  const { owner, repo } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [pagesStatus, setPagesStatus] = useState(null);
  const [pagesUrl, setPagesUrl] = useState(null);
  const [enablingPages, setEnablingPages] = useState(false);
  const [pagesError, setPagesError] = useState(null);
  
  // Fetch repository data
  const { data: repository, isLoading, error } = useQuery(
    ['repository', owner, repo],
    () => githubApi.getRepository(owner, repo),
    {
      staleTime: 60000 // 1 minute
    }
  );
  
  // Fetch branches
  const { data: branches } = useQuery(
    ['branches', owner, repo],
    () => githubApi.getBranches(owner, repo),
    {
      staleTime: 60000, // 1 minute
      enabled: !!repository
    }
  );

  // Handler to enable GitHub Pages
  const handleEnablePages = async () => {
    setEnablingPages(true);
    setPagesError(null);
    try {
      // Use default branch for Pages source
      const branch = repository.default_branch || 'main';
      const result = await githubApi.enablePages(owner, repo, branch, '/');
      setPagesStatus('enabled');
      // GitHub Pages URL format: https://<owner>.github.io/<repo>/
      setPagesUrl(`https://${owner}.github.io/${repo}/`);
    } catch (err) {
      setPagesError(err?.response?.data?.error || 'Failed to enable GitHub Pages.');
      setPagesStatus('error');
    } finally {
      setEnablingPages(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <svg className="animate-spin h-10 w-10 mx-auto text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-3 text-gray-500 dark:text-gray-400">Loading repository...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <svg className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-3 text-red-500">Error loading repository</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error.message}</p>
        <Link to="/repositories" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
          Back to Repositories
        </Link>
      </div>
    );
  }
  
  if (!repository) {
    return null;
  }
  
  return (
    <div>
      {/* Repository header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{repository.name}</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                {repository.description || 'No description provided'}
              </p>
            </div>
            <div className="flex space-x-2">
              <a
                href={repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
              <Link
                to={`/code/${owner}/${repo}`}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                View Code
              </Link>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {repository.stargazers_count} stars
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582A1 1 0 004 6.32V16a1 1 0 001.555.832L10 14.202l4.445 2.63A1 1 0 0016 16V6.32a1 1 0 00-1.046-.876L11 4.323V3a1 1 0 00-1-1zm-2 14.2V7.872l-2-1V14.2l2 1.2zm4-1.2V7.872l2-1V14.2l-2 1.2z" clipRule="evenodd" />
              </svg>
              {repository.forks_count} forks
            </div>
            {repository.language && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {repository.language}
              </div>
            )}
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Updated {new Date(repository.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              className={`px-4 py-3 border-b-2 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-3 border-b-2 text-sm font-medium ${
                activeTab === 'branches'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('branches')}
            >
              Branches
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {activeTab === 'overview' && (
          <div className="p-4">
            <div className="prose dark:prose-invert max-w-none">
              <h3>About this repository</h3>
              <p>{repository.description || 'No description provided.'}</p>
              
              {/* GitHub Pages UI */}
              <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-900">
                <h4 className="font-semibold mb-2">GitHub Pages</h4>
                {pagesStatus === 'enabled' && pagesUrl ? (
                  <div className="text-green-600 dark:text-green-400 mb-2">
                    Pages enabled! Your site is published at:
                    <a href={pagesUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline">{pagesUrl}</a>
                  </div>
                ) : (
                  <>
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                      onClick={handleEnablePages}
                      disabled={enablingPages}
                    >
                      {enablingPages ? 'Enabling Pages...' : 'Enable GitHub Pages'}
                    </button>
                    {pagesError && <div className="text-red-500 mt-2">{pagesError}</div>}
                  </>
                )}
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <h4 className="font-medium">Repository Details</h4>
                  <ul className="mt-2 space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Full Name:</span>
                      <span>{repository.full_name}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Visibility:</span>
                      <span>{repository.private ? 'Private' : 'Public'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Default Branch:</span>
                      <span>{repository.default_branch}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <span>{new Date(repository.created_at).toLocaleDateString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Updated:</span>
                      <span>{new Date(repository.updated_at).toLocaleDateString()}</span>
                    </li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <h4 className="font-medium">Quick Links</h4>
                  <ul className="mt-2 space-y-2">
                    <li>
                      <a 
                        href={`${repository.html_url}/issues`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Issues
                      </a>
                    </li>
                    <li>
                      <a 
                        href={`${repository.html_url}/pulls`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Pull Requests
                      </a>
                    </li>
                    <li>
                      <a 
                        href={`${repository.html_url}/actions`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Actions
                      </a>
                    </li>
                    <li>
                      <a 
                        href={`${repository.html_url}/projects`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Projects
                      </a>
                    </li>
                    <li>
                      <a 
                        href={`${repository.html_url}/wiki`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Wiki
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'branches' && (
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Branches</h3>
            
            {branches?.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {branches.map(branch => (
                  <li key={branch.name} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{branch.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Last commit: {branch.commit.sha.substring(0, 7)}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/code/${owner}/${repo}?ref=${branch.name}`}
                        className="text-sm text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Browse files →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No branches found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryDetail;
