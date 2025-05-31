import axios from 'axios';

// Create an axios instance with defaults
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for cookies/JWT auth
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage if it exists
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        await axiosInstance.post('/api/auth/refresh');
        
        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// GitHub API service
export const githubApi = {
  // Repositories
  getRepositories: async (params = {}) => {
    const response = await axiosInstance.get('/api/github/user/repos', { params });
    return response.data;
  },
  
  getRepository: async (owner, repo) => {
    const response = await axiosInstance.get(`/api/github/repos/${owner}/${repo}`);
    return response.data;
  },
  
  createRepository: async (data) => {
    const response = await axiosInstance.post('/api/github/user/repos', data);
    return response.data;
  },
  
  // Branches
  getBranches: async (owner, repo) => {
    const response = await axiosInstance.get(`/api/github/repos/${owner}/${repo}/branches`);
    return response.data;
  },
  
  createBranch: async (owner, repo, branchName, sha) => {
    const response = await axiosInstance.post(`/api/github/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branchName}`,
      sha
    });
    return response.data;
  },
  
  // Content
  getContent: async (owner, repo, path = '', ref) => {
    const params = ref ? { ref } : {};
    const response = await axiosInstance.get(`/api/github/repos/${owner}/${repo}/contents/${path}`, { params });
    return response.data;
  },
  
  // Pull Requests
  getPullRequests: async (owner, repo, params = {}) => {
    if (owner === 'all') {
      // Get PRs across all repos
      const searchQuery = `is:pr ${params.state || 'is:open'} author:@me`;
      const response = await axiosInstance.get(`/api/github/search/issues?q=${encodeURIComponent(searchQuery)}`);
      return response.data.items;
    }
    
    const response = await axiosInstance.get(`/api/github/repos/${owner}/${repo}/pulls`, { params });
    return response.data;
  },
  
  createPullRequest: async (owner, repo, data) => {
    const response = await axiosInstance.post(`/api/github/repos/${owner}/${repo}/pulls`, data);
    return response.data;
  },
  
  // File operations
  createOrUpdateFile: async (owner, repo, path, content, message, sha, branch) => {
    const data = {
      message,
      content: btoa(content), // Base64 encode content
      branch
    };
    
    if (sha) {
      data.sha = sha;
    }
    
    const response = await axiosInstance.put(`/api/github/repos/${owner}/${repo}/contents/${path}`, data);
    return response.data;
  },
  
  deleteFile: async (owner, repo, path, message, sha, branch) => {
    const data = {
      message,
      sha,
      branch
    };
    
    const response = await axiosInstance.delete(`/api/github/repos/${owner}/${repo}/contents/${path}`, { data });
    return response.data;
  },
  
  // GitHub Pages
  enablePages: async (owner, repo, branch = 'gh-pages', path = '/') => {
    const response = await axiosInstance.post(`/api/github/repos/${owner}/${repo}/pages/enable`, { branch, path });
    return response.data;
  }
};

export default githubApi;
