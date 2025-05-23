import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { githubApi } from '../services/apiClient';

const Repositories = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await githubApi.getRepositories();
        setRepos(data);
      } catch (err) {
        setError('Failed to load repositories.');
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading repositories...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Repositories</h1>
        <Link
          to="/repositories/new"
          className="mb-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Repository
        </Link>
      </div>
      {repos.length === 0 ? (
        <div>No repositories found.</div>
      ) : (
        <ul className="space-y-4">
          {repos.map(repo => (
            <li key={repo.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline font-semibold"
              >
                {repo.full_name}
              </a>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {repo.description || 'No description'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Repositories;
