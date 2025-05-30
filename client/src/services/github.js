/**
 * GitHub API Service
 * Handles interactions with the GitHub API via our server proxy
 */
import axios from 'axios';

// Create axios instance with credentials support
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get user's repositories with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (starting from 1)
 * @param {number} params.per_page - Items per page
 * @param {string} params.sort - Sort field (created, updated, pushed, full_name)
 * @param {string} params.direction - Sort direction (asc, desc)
 * @param {string} params.type - Repository type (all, owner, public, private, member)
 * @param {string} params.q - Search query
 * @returns {Promise<Object>} Repositories data with pagination info
 */
export const getUserRepositories = async (params = {}) => {
  try {
    const defaultParams = {
      page: 1,
      per_page: 10,
      sort: 'updated',
      direction: 'desc',
      type: 'all'
    };

    const queryParams = { ...defaultParams, ...params };
    
    // Store request data for offline cache
    const cacheKey = `repositories-${JSON.stringify(queryParams)}`;
    
    const response = await api.get('/github/repos', { params: queryParams });
    
    // Cache the response for offline use
    if ('caches' in window) {
      const cache = await caches.open('github-data-cache');
      const request = new Request(`${api.defaults.baseURL}/github/repos?${new URLSearchParams(queryParams)}`);
      cache.put(request, new Response(JSON.stringify(response.data)));
      
      // Also store in localStorage as a fallback
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to cache repositories in localStorage:', e);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch repositories:', error);
    
    // Try to serve from cache if offline
    if (!navigator.onLine) {
      try {
        // Try localStorage first
        const cachedData = localStorage.getItem(`repositories-${JSON.stringify(params)}`);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log('Serving repositories from localStorage cache');
          return parsed.data;
        }
        
        // Then try Cache API
        if ('caches' in window) {
          const cache = await caches.open('github-data-cache');
          const cachedResponse = await cache.match(
            `${api.defaults.baseURL}/github/repos?${new URLSearchParams(params)}`
          );
          
          if (cachedResponse) {
            console.log('Serving repositories from Cache API');
            return await cachedResponse.json();
          }
        }
      } catch (cacheError) {
        console.error('Failed to retrieve cached repositories:', cacheError);
      }
    }
    
    throw error;
  }
};

/**
 * Get a specific repository by owner and name
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Repository data
 */
export const getRepository = async (owner, repo) => {
  try {
    const response = await api.get(`/github/repos/${owner}/${repo}`);
    
    // Cache for offline use
    if ('caches' in window) {
      const cache = await caches.open('github-data-cache');
      const request = new Request(`${api.defaults.baseURL}/github/repos/${owner}/${repo}`);
      cache.put(request, new Response(JSON.stringify(response.data)));
      
      // Also store in localStorage
      try {
        localStorage.setItem(`repository-${owner}-${repo}`, JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to cache repository in localStorage:', e);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch repository ${owner}/${repo}:`, error);
    
    // Try to serve from cache if offline
    if (!navigator.onLine) {
      try {
        // Try localStorage first
        const cachedData = localStorage.getItem(`repository-${owner}-${repo}`);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log('Serving repository from localStorage cache');
          return parsed.data;
        }
        
        // Then try Cache API
        if ('caches' in window) {
          const cache = await caches.open('github-data-cache');
          const cachedResponse = await cache.match(
            `${api.defaults.baseURL}/github/repos/${owner}/${repo}`
          );
          
          if (cachedResponse) {
            console.log('Serving repository from Cache API');
            return await cachedResponse.json();
          }
        }
      } catch (cacheError) {
        console.error('Failed to retrieve cached repository:', cacheError);
      }
    }
    
    throw error;
  }
};

/**
 * Get repository contents (files and directories)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - Path to the content (empty for root)
 * @param {string} ref - Branch/tag name or commit SHA
 * @returns {Promise<Array>} Repository contents
 */
export const getRepositoryContents = async (owner, repo, path = '', ref = '') => {
  try {
    const params = ref ? { ref } : {};
    const response = await api.get(`/github/repos/${owner}/${repo}/contents/${path}`, { params });
    
    // Cache for offline use
    if ('caches' in window) {
      const cache = await caches.open('github-data-cache');
      const request = new Request(
        `${api.defaults.baseURL}/github/repos/${owner}/${repo}/contents/${path}?${new URLSearchParams(params)}`
      );
      cache.put(request, new Response(JSON.stringify(response.data)));
    }
    
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch repository contents for ${owner}/${repo}/${path}:`, error);
    
    // Try to serve from cache if offline
    if (!navigator.onLine && 'caches' in window) {
      try {
        const cache = await caches.open('github-data-cache');
        const cachedResponse = await cache.match(
          `${api.defaults.baseURL}/github/repos/${owner}/${repo}/contents/${path}?${new URLSearchParams(ref ? { ref } : {})}`
        );
        
        if (cachedResponse) {
          console.log('Serving repository contents from cache');
          return await cachedResponse.json();
        }
      } catch (cacheError) {
        console.error('Failed to retrieve cached repository contents:', cacheError);
      }
    }
    
    throw error;
  }
};

/**
 * Create a new repository
 * @param {Object} repoData - Repository data
 * @returns {Promise<Object>} Created repository
 */
export const createRepository = async (repoData) => {
  try {
    const response = await api.post('/github/repos', repoData);
    return response.data;
  } catch (error) {
    console.error('Failed to create repository:', error);
    throw error;
  }
};

/**
 * Update repository details
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} repoData - Repository data to update
 * @returns {Promise<Object>} Updated repository
 */
export const updateRepository = async (owner, repo, repoData) => {
  try {
    const response = await api.patch(`/github/repos/${owner}/${repo}`, repoData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update repository ${owner}/${repo}:`, error);
    throw error;
  }
};

/**
 * Delete a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<void>}
 */
export const deleteRepository = async (owner, repo) => {
  try {
    await api.delete(`/github/repos/${owner}/${repo}`);
  } catch (error) {
    console.error(`Failed to delete repository ${owner}/${repo}:`, error);
    throw error;
  }
};

/**
 * Star a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<void>}
 */
export const starRepository = async (owner, repo) => {
  try {
    await api.put(`/github/user/starred/${owner}/${repo}`);
  } catch (error) {
    console.error(`Failed to star repository ${owner}/${repo}:`, error);
    throw error;
  }
};

/**
 * Unstar a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<void>}
 */
export const unstarRepository = async (owner, repo) => {
  try {
    await api.delete(`/github/user/starred/${owner}/${repo}`);
  } catch (error) {
    console.error(`Failed to unstar repository ${owner}/${repo}:`, error);
    throw error;
  }
};

/**
 * Check if a repository is starred by the authenticated user
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<boolean>} Whether the repository is starred
 */
export const isRepositoryStarred = async (owner, repo) => {
  try {
    await api.get(`/github/user/starred/${owner}/${repo}`);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    console.error(`Failed to check if repository ${owner}/${repo} is starred:`, error);
    throw error;
  }
};

export default {
  getUserRepositories,
  getRepository,
  getRepositoryContents,
  createRepository,
  updateRepository,
  deleteRepository,
  starRepository,
  unstarRepository,
  isRepositoryStarred
};

