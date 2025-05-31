import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { axiosInstance } from '../context/AuthContext';

const Debug = () => {
  const { user, isAuthenticated } = useAuthContext();
  const [repositories, setRepositories] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching repositories...');
      const response = await axiosInstance.get('/api/github/user/repos');
      console.log('Repository response:', response.data);
      setRepositories(response.data);
      setApiResponse(JSON.stringify(response.data, null, 2));
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError(err.message || 'Error fetching repositories');
    } finally {
      setLoading(false);
    }
  };

  const testUserApi = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing user API...');
      const response = await axiosInstance.get('/api/github/user');
      console.log('User API response:', response.data);
      setApiResponse(JSON.stringify(response.data, null, 2));
    } catch (err) {
      console.error('Error testing user API:', err);
      setError(err.message || 'Error testing user API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">API Debugging Page</h1>
      
      <div className="mb-6 p-4 border rounded bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
        <div className="mb-2">
          <span className="font-bold">Status:</span> 
          {isAuthenticated ? (
            <span className="text-green-600 ml-2">Authenticated</span>
          ) : (
            <span className="text-red-600 ml-2">Not Authenticated</span>
          )}
        </div>
        
        {user && (
          <div>
            <div className="mb-2">
              <span className="font-bold">Username:</span> 
              <span className="ml-2">{user.login}</span>
            </div>
            <div className="mb-2">
              <span className="font-bold">User ID:</span> 
              <span className="ml-2">{user.id}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold mr-2">Avatar:</span>
              <img 
                src={user.avatar_url} 
                alt={`${user.login}'s avatar`} 
                className="w-10 h-10 rounded-full"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button 
            onClick={testUserApi} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            Test User API
          </button>
          
          <button 
            onClick={fetchRepositories} 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={loading}
          >
            Fetch Repositories
          </button>
        </div>
        
        {loading && (
          <div className="text-gray-600">Loading...</div>
        )}
        
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
            <h3 className="font-bold mb-2">Error:</h3>
            <p>{error}</p>
          </div>
        )}
      </div>
      
      {repositories && repositories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Repositories ({repositories.length})</h2>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {repositories.map(repo => (
              <li key={repo.id} className="py-2">
                <div className="font-medium">{repo.name}</div>
                <div className="text-sm text-gray-500">
                  {repo.private ? 'Private' : 'Public'} • 
                  Updated: {new Date(repo.updated_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {apiResponse && (
        <div>
          <h2 className="text-xl font-semibold mb-2">API Response</h2>
          <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-xs">
            {apiResponse}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Debug;