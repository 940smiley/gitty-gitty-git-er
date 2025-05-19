/**
 * Gitty-Gitty-Git-Er
 * Main application entry point
 */

import { initAuth, isAuthenticated, loginWithGitHub, logoutFromGitHub, getCurrentUser } from './auth.js';
import { initAPI } from './api.js';
import { initUI, showPage, showNotification } from './ui.js';
import { initCache, syncData } from './cache.js';

// Store application state
const appState = {
  currentPage: 'login',
  user: null,
  darkMode: false,
  offline: !navigator.onLine,
  repositories: [],
  pullRequests: [],
  selectedRepository: null,
  selectedBranch: null
};

// Initialize the application
async function initApp() {
  console.log('Initializing Gitty-Gitty-Git-Er application...');
  
  // Initialize app components
  initUI(appState, {
    onPageChange: handlePageChange,
    onRepositorySelect: handleRepositorySelect,
    onBranchSelect: handleBranchSelect,
    onCreateRepository: handleCreateRepository,
    onCreatePullRequest: handleCreatePullRequest
  });
  
  initAuth({
    onLogin: handleUserLogin,
    onLogout: handleUserLogout
  });
  
  initAPI();
  
  initCache({
    onSyncComplete: handleSyncComplete
  });
  
  // Set up event listeners
  setupEventListeners();
  
  // Check if user is already authenticated
  const authenticated = await isAuthenticated();
  
  if (authenticated) {
    // If authenticated, load user data and show dashboard
    await handleUserLogin();
  } else {
    // If not authenticated, show login page
    showPage('login');
  }
  
  // Check for online/offline status
  updateOnlineStatus();
  
  console.log('Application initialization complete');
}

// Set up application event listeners
function setupEventListeners() {
  // Online/offline status
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Listen for page navigation events
  document.querySelectorAll('[data-page]').forEach(element => {
    element.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.getAttribute('data-page');
      navigateToPage(page);
    });
  });
  
  // Login button event
  document.getElementById('login-btn').addEventListener('click', () => {
    loginWithGitHub();
  });
  
  document.getElementById('login-page-btn').addEventListener('click', () => {
    loginWithGitHub();
  });
  
  // Logout button event
  document.getElementById('logout-btn').addEventListener('click', () => {
    logoutFromGitHub();
  });
  
  // New repository buttons
  document.getElementById('new-repo-btn').addEventListener('click', () => {
    document.getElementById('new-repo-modal').classList.remove('hidden');
  });
  
  document.getElementById('create-repository-btn').addEventListener('click', () => {
    document.getElementById('new-repo-modal').classList.remove('hidden');
  });
  
  // Modal close buttons
  document.querySelectorAll('.close-modal, .cancel-modal').forEach(element => {
    element.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
      });
    });
  });
  
  // New repository form submission
  document.getElementById('create-repo-submit').addEventListener('click', () => {
    const name = document.getElementById('repo-name').value;
    const description = document.getElementById('repo-description').value;
    const isPrivate = document.querySelector('input[name="repo-visibility"]:checked').value === 'private';
    const initReadme = document.getElementById('initialize-readme').checked;
    const gitignoreTemplate = document.getElementById('gitignore-template').value;
    const licenseTemplate = document.getElementById('license-template').value;
    
    if (name) {
      handleCreateRepository({
        name,
        description,
        private: isPrivate,
        autoInit: initReadme,
        gitignoreTemplate: gitignoreTemplate || null,
        licenseTemplate: licenseTemplate || null
      });
      
      // Close the modal
      document.getElementById('new-repo-modal').classList.add('hidden');
      
      // Reset the form
      document.getElementById('new-repo-form').reset();
    }
  });
  
  // Theme selection
  document.getElementById('theme-select').addEventListener('change', (e) => {
    setTheme(e.target.value);
  });
  
  // Repository and branch selection in Code Explorer
  document.getElementById('code-repo-select').addEventListener('change', (e) => {
    const repoName = e.target.value;
    if (repoName) {
      handleRepositorySelect(repoName);
    }
  });
  
  document.getElementById('code-branch-select').addEventListener('change', (e) => {
    const branchName = e.target.value;
    if (branchName) {
      handleBranchSelect(branchName);
    }
  });
}

// Update online/offline status
function updateOnlineStatus() {
  appState.offline = !navigator.onLine;
  
  // Update UI indicators
  const indicator = document.getElementById('connection-indicator');
  const statusElement = document.getElementById('connection-status');
  
  if (appState.offline) {
    indicator.classList.add('offline');
    statusElement.textContent = 'Offline';
    showNotification('You are offline. Some features may be limited.', 'warning');
  } else {
    indicator.classList.remove('offline');
    statusElement.textContent = 'Online';
    
    // If we're coming back online, sync data
    syncData();
  }
}

// Page navigation
function navigateToPage(pageName) {
  if (pageName === appState.currentPage) return;
  
  // Check if we need authentication for this page
  if (pageName !== 'login' && !isAuthenticated()) {
    showNotification('Please log in to access this page', 'error');
    return;
  }
  
  appState.currentPage = pageName;
  showPage(pageName);
  
  // Update any page-specific data
  loadPageData(pageName);
}

// Load data for specific pages
async function loadPageData(pageName) {
  try {
    switch (pageName) {
      case 'dashboard':
        await loadDashboardData();
        break;
      case 'repositories':
        await loadRepositoriesData();
        break;
      case 'prs':
        await loadPullRequestsData();
        break;
      case 'code':
        // Code page needs a repository to be selected first
        updateCodeExplorer();
        break;
      case 'settings':
        await loadSettingsData();
        break;
    }
  } catch (error) {
    console.error(`Error loading data for ${pageName} page:`, error);
    showNotification(`Failed to load data: ${error.message}`, 'error');
  }
}

// Handle user login
async function handleUserLogin() {
  try {
    // Get current user data
    appState.user = await getCurrentUser();
    
    // Update UI with user info
    document.getElementById('user-name').textContent = appState.user.login;
    document.getElementById('user-avatar').src = appState.user.avatar_url;
    
    // Show user info and hide login button
    document.getElementById('user-display').classList.remove('hidden');
    document.getElementById('login-display').classList.add('hidden');
    
    // Navigate to dashboard
    navigateToPage('dashboard');
    
    showNotification(`Welcome, ${appState.user.login}!`, 'success');
  } catch (error) {
    console.error('Error during login:', error);
    showNotification('Login failed. Please try again.', 'error');
  }
}

// Handle user logout
function handleUserLogout() {
  // Clear app state
  appState.user = null;
  appState.repositories = [];
  appState.pullRequests = [];
  
  // Update UI
  document.getElementById('user-display').classList.add('hidden');
  document.getElementById('login-display').classList.remove('hidden');
  
  // Navigate to login page
  navigateToPage('login');
  
  showNotification('You have been logged out', 'info');
}

// Handle page change
function handlePageChange(pageName) {
  navigateToPage(pageName);
}

// Handle repository selection
async function handleRepositorySelect(repoFullName) {
  appState.selectedRepository = repoFullName;
  appState.selectedBranch = null;
  
  // Load branches for the selected repository
  try {
    const [owner, repo] = repoFullName.split('/');
    const branches = await window.GittyGitAPI.listBranches(owner, repo);
    
    // Update branch select dropdown
    const branchSelect = document.getElementById('code-branch-select');
    branchSelect.innerHTML = '<option value="">Select a branch</option>';
    
    branches.forEach(branch => {
      const option = document.createElement('option');
      option.value = branch.name;
      option.textContent = branch.name;
      branchSelect.appendChild(option);
    });
    
    branchSelect.disabled = false;
    
    // Clear file tree and code display
    document.getElementById('file-tree').innerHTML = '<p class="placeholder">Select a branch to view files</p>';
    document.getElementById('code-display').innerHTML = '<p class="placeholder">Select a file to view its contents</p>';
    document.getElementById('current-file-path').textContent = 'No file selected';
  } catch (error) {
    console.error('Error loading branches:', error);
    showNotification(`Failed to load branches: ${error.message}`, 'error');
  }
}

// Handle branch selection
async function handleBranchSelect(branchName) {
  appState.selectedBranch = branchName;
  
  // Load file tree for the selected repository and branch
  try {
    const [owner, repo] = appState.selectedRepository.split('/');
    const fileTree = await window.GittyGitAPI.getRepositoryContents(owner, repo, '', branchName);
    
    // Update file tree
    displayFileTree(fileTree);
  } catch (error) {
    console.error('Error loading file tree:', error);
    showNotification(`Failed to load files: ${error.message}`, 'error');
  }
}

// Display file tree
function displayFileTree(contents) {
  const fileTreeElement = document.getElementById('file-tree');
  fileTreeElement.innerHTML = '';
  
  // Convert contents to a tree structure
  const ul = document.createElement('ul');
  ul.className = 'file-tree-list';
  
  contents.forEach(item => {
    const li = document.createElement('li');
    li.className = `file-tree-item ${item.type}`;
    
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = item.name;
    link.setAttribute('data-path', item.path);
    link.setAttribute('data-type', item.type);
    
    // Add icon based on type
    const icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.textContent = item.type === 'dir' ? 'folder' : 'description';
    link.prepend(icon);
    
    // Add click handler
    link.addEventListener('click', (e) => {
      e.preventDefault();
      handleFileClick(item);
    });
    
    li.appendChild(link);
    ul.appendChild(li);
  });
  
  fileTreeElement.appendChild(ul);
}

// Handle file click in the file tree
async function handleFileClick(item) {
  const [owner, repo] = appState.selectedRepository.split('/');
  
  try {
    if (item.type === 'dir') {
      // If it's a directory, load its contents
      const contents = await window.GittyGitAPI.getRepositoryContents(owner, repo, item.path, appState.selectedBranch);
      displayFileTree(contents);
    } else {
      // If it's a file, display its contents
      const fileContent = await window.GittyGitAPI.getFileContent(owner, repo, item.path, appState.selectedBranch);
      
      // Update file path display
      document.getElementById('current-file-path').textContent = item.path;
      
      // Enable file action buttons
      document.getElementById('edit-file-btn').disabled = false;
      document.getElementById('download-file-btn').disabled = false;
      
      // Display file content
      const codeDisplay = document.getElementById('code-display');
      
      // Check if it's a binary file
      if (fileContent.isBinary) {
        if (fileContent.isImage) {
          // Display image preview
          codeDisplay.innerHTML = `<div class="image-preview">
            <img src="data:${fileContent.contentType};base64,${fileContent.content}" alt="${item.name}">
          </div>`;
        } else {
          // Display download message for binary files
          codeDisplay.innerHTML = `<div class="binary-file-message">
            <p>This is a binary file (${fileContent.size} bytes).</p>
            <button id="download-binary-btn" class="btn">Download</button>
          </div>`;
          
          document.getElementById('download-binary-btn').addEventListener('click', () => {
            downloadFile(item.name, fileContent.content, fileContent.contentType);
          });
        }
      } else {
        // Display text content
        // In a real implementation, we would use a code editor or syntax highlighting
        codeDisplay.innerHTML = `<pre>${escapeHtml(fileContent.content)}</pre>`;
      }
    }
  } catch (error) {
    console.error('Error loading file content:', error);
    showNotification(`Failed to load file: ${error.message}`, 'error');
  }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    // Load recent repositories
    const repos = await window.GittyGitAPI.listRepositories({ per_page: 5 });
    appState.repositories = repos;
    
    // Update repositories card
    const reposContainer = document.getElementById('dashboard-repos');
    if (repos.length > 0) {
      reposContainer.innerHTML = '';
      repos.forEach(repo => {
        const repoElement = document.createElement('div');
        repoElement.className = 'dashboard-repo-item';
        repoElement.innerHTML = `
          <a href="#" class="repo-name" data-repo="${repo.full_name}">${repo.name}</a>
          <span class="repo-meta">
            <span class="stars"><i class="material-icons">star</i>${repo.stargazers_count}</span>
            <span class="forks"><i class="material-icons">call_split</i>${repo.forks_count}</span>
          </span>
        `;
        reposContainer.appendChild(repoElement);
        
        // Add click handler
        repoElement.querySelector('.repo-name').addEventListener('click', (e) => {
          e.preventDefault();
          navigateToPage('repositories');
        });
      });
    } else {
      reposContainer.innerHTML = '<p>No repositories found</p>';
    }
    
    // Load pull requests
    const prs = await window.GittyGitAPI.listPullRequests();
    appState.pullRequests = prs;
    
    // Update pull requests card
    const prsContainer = document.getElementById('dashboard-prs');
    if (prs.length > 0) {
      prsContainer.innerHTML = '';
      prs.forEach(pr => {
        const prElement = document.createElement('div');
        prElement.className = 'dashboard-pr-item';
        prElement.innerHTML = `
          <a href="#" class="pr-title" data-pr="${pr.id}">${pr.title}</a>
          <div class="pr-meta">
            <span class="pr-repo">${pr.repository.full_name}</span>
            <span class="pr-number">#${pr.number}</span>
          </div>
        `;
        prsContainer.appendChild(prElement);
        
        // Add click handler
        prElement.querySelector('.pr-title').addEventListener('click', (e) => {
          e.preventDefault();
          navigateToPage('prs');
        });
      });
    } else {
      prsContainer.innerHTML = '<p>No pull requests found</p>';
    }
    
    // Update GitHub status
    document.getElementById('github-status').textContent = 'Connected';
    
    // Update token expiry (if available)
    const tokenExpiry = getTokenExpiry();
    document.getElementById('token-expiry').textContent = tokenExpiry || 'N/A';
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showNotification(`Failed to load dashboard data: ${error.message}`, 'error');
  }
}

// Load repositories data
async function loadRepositoriesData() {
  try {
    const repos = await window.GittyGitAPI.listRepositories();
    appState.repositories = repos;
    
    // Update repositories list
    const reposList = document.getElementById('repositories-list');
    
    if (repos.length > 0) {
      reposList.innerHTML = '';
      
      repos.forEach(repo => {
        const repoCard = document.createElement('div');
        repoCard.className = 'repo-card';
        
        const updatedAt = new Date(repo.updated_at).toLocaleDateString();
        
        repoCard.innerHTML = `
          <h3 class="repo-name">${repo.name}</h3>
          <p class="repo-description">${repo.description || 'No description'}</p>
          <div class="repo-meta">
            <div>
              <i class="material-icons">star</i>
              ${repo.stargazers_count}
            </div>
            <div>
              <i class="material-icons">call_split</i>
              ${repo.forks_count}
            </div>
            <div>
              <i class="material-icons">access_time</i>
              Updated: ${updatedAt}
            </div>
          </div>
          <div class="repo-actions">
            <button class="btn view-code-btn" data-repo="${repo.full_name}">View Code</button>
            <button class="btn view-prs-btn" data-repo="${repo.full_name}">Pull Requests</button>
          </div>
        `;
        
        reposList.appendChild(repoCard);
        
        // Add event listeners
        repoCard.querySelector('.view-code-btn').addEventListener('click', () => {
          appState.selectedRepository = repo.full_name;
          navigateToPage('code');
          updateCodeExplorer();
        });
        
        repoCard.querySelector('.view-prs-btn').addEventListener('click', () => {
          navigateToPage('prs');
          // TODO: Filter PRs by repository
        });
      });
    } else {
      reposList.innerHTML = '<p>No repositories found</p>';
    }
    
    // Update repository filters
    updateRepositoryFilters();
  } catch (error) {
    console.error('Error loading repositories data:', error);
    showNotification(`Failed to load repositories: ${error.message}`, 'error');
  }
}

// Load pull requests data
async function loadPullRequestsData() {
  try {
    const prs = await window.GittyGitAPI.listPullRequests();
    appState.pullRequests = prs;
    
    // Update PR list
    const prList = document.getElementById('pr-list');
    
    if (prs.length > 0) {
      prList.innerHTML = '';
      
      prs.forEach(pr => {
        const prItem = document.createElement('div');
        prItem.className = 'pr-item';
        
        const updatedAt = new Date(pr.updated_at).toLocaleDateString();
        
        prItem.innerHTML = `
          <div class="pr-header">
            <h3 class="pr-title">${pr.title}</h3>
            <span class="pr-status ${pr.state}">${pr.state}</span>
          </div>
          <div class="pr-meta">
            <div>${pr.repository.full_name}</div>
            <div>#${pr.number}</div>
            <div>Updated: ${updatedAt}</div>
            <div>By: ${pr.user.login}</div>
          </div>
          <p class="pr-description">${pr.body || 'No description provided'}</p>
          <div class="pr-actions">
            <a href="${pr.html_url}" target="_blank" class="btn">View on GitHub</a>
          </div>
        `;
        
        prList.appendChild(prItem);
      });
    } else {
      prList.innerHTML = '<p>No pull requests found</p>';
    }
    
    // Update PR repository filter
    updatePullRequestFilters();
  } catch (error) {
    console.error('Error loading pull requests data:', error);
    showNotification(`Failed to load pull requests: ${error.message}`, 'error');
  }
}

// Load settings data
async function loadSettingsData() {
  try {
    // Load authorized scopes
    const scopes = await window.GittyGitAPI.getAuthorizedScopes();
    
    // Update scopes list
    const scopesList = document.getElementById('oauth-scopes');
    
    if (scopes.length > 0) {
      scopesList.innerHTML = '';
      
      scopes.forEach(scope => {
        const scopeItem = document.createElement('div');
        scopeItem.className = 'scope-item';
        scopeItem.innerHTML = `
          <i class="material-icons">check_circle</i>
          <span>${scope}</span>
        `;
        
        scopesList.appendChild(scopeItem);
      });
    } else {
      scopesList.innerHTML = '<p>No specific scopes granted</p>';
    }
    
    // Load user repositories for default repo setting
    const repos = appState.repositories.length > 0 ? 
      appState.repositories : 
      await window.GittyGitAPI.listRepositories();
    
    // Update default repo select
    const defaultRepoSelect = document.getElementById('default-repo');
    defaultRepoSelect.innerHTML = '<option value="">None</option>';
    
    repos.forEach(repo => {
      const option = document.createElement('option');
      option.value = repo.full_name;
      option.textContent = repo.full_name;
      defaultRepoSelect.appendChild(option);
    });
    
    // Set current theme
    const currentTheme = localStorage.getItem('theme') || 'system';
    document.getElementById('theme-select').value = currentTheme;
    
    // Set offline mode checkbox
    const offlineMode = localStorage.getItem('offlineMode') === 'true';
    document.getElementById('offline-mode').checked = offlineMode;
    
    // Set notifications checkbox
    const notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
    document.getElementById('notifications-enabled').checked = notificationsEnabled;
  } catch (error) {
    console.error('Error loading settings data:', error);
    showNotification(`Failed to load settings data: ${error.message}`, 'error');
  }
}

// Update code explorer with selected repository
function updateCodeExplorer() {
  // Update repository select
  const repoSelect = document.getElementById('code-repo-select');
  repoSelect.innerHTML = '<option value="">Select a repository</option>';
  
  appState.repositories.forEach(repo => {
    const option = document.createElement('option');
    option.value = repo.full_name;
    option.textContent = repo.full_name;
    repoSelect.appendChild(option);
  });
  
  // If a repository is already selected, select it in the dropdown
  if (appState.selectedRepository) {
    repoSelect.value = appState.selectedRepository;
    handleRepositorySelect(appState.selectedRepository);
  }
}

// Update repository filters
function updateRepositoryFilters() {
  // This would populate any filter dropdowns for repositories
}

// Update pull request filters
function updatePullRequestFilters() {
  // Get unique repository names from PRs
  const repositoryNames = [...new Set(appState.pullRequests.map(pr => pr.repository.full_name))];
  
  // Update repo filter dropdown
  const repoFilter = document.getElementById('pr-repo-filter');
  repoFilter.innerHTML = '<option value="all">All Repositories</option>';
  
  repositoryNames.forEach(repo => {
    const option = document.createElement('option');
    option.value = repo;
    option.textContent = repo;
    repoFilter.appendChild(option);
  });
}

// Create a new repository
async function handleCreateRepository(options) {
  try {
    showNotification('Creating repository...', 'info');
    
    const newRepo = await window.GittyGitAPI.createRepository(options);
    
    showNotification(`Repository ${newRepo.full_name} created successfully!`, 'success');
    
    // Refresh repositories data
    await loadRepositoriesData();
    
    // Navigate to the repositories page
    navigateToPage('repositories');
  } catch (error) {
    console.error('Error creating repository:', error);
    showNotification(`Failed to create repository: ${error.message}`, 'error');
  }
}

// Create a new pull request
async function handleCreatePullRequest(options) {
  try {
    showNotification('Creating pull request...', 'info');
    
    const newPR = await window.GittyGitAPI.createPullRequest(
      options.owner,
      options.repo,
      options.title,
      options.body,
      options.head,
      options.base
    );
    
    showNotification(`Pull request #${newPR.number} created successfully!`, 'success');
    
    // Refresh pull requests data
    await loadPullRequestsData();
    
    // Navigate to the pull requests page
    navigateToPage('prs');
  } catch (error) {
    console.error('Error creating pull request:', error);
    showNotification(`Failed to create pull request: ${error.message}`, 'error');
  }
}

// Handle sync complete
function handleSyncComplete(syncedItems) {
  if (syncedItems.length > 0) {
    showNotification(`${syncedItems.length} items synchronized`, 'success');
    
    // Refresh current page data
    loadPageData(appState.currentPage);
  }
}

// Set application theme
function setTheme(theme) {
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (theme === 'system') {
    if (systemPrefersDark) {
      document.body.classList.add('dark-theme');
      appState.darkMode = true;
    } else {
      document.body.classList.remove('dark-theme');
      appState.darkMode = false;
    }
  } else if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    appState.darkMode = true;
  } else {
    document.body.classList.remove('dark-theme');
    appState.darkMode = false;
  }
  
  localStorage.setItem('theme', theme);
}

// Get token expiry date
function getTokenExpiry() {
  const tokenData = localStorage.getItem('github_token_data');
  if (!tokenData) return null;
  
  try {
    const data = JSON.parse(tokenData);
    if (data.expiresAt) {
      return new Date(data.expiresAt).toLocaleString();
    }
  } catch (e) {
    return null;
  }
  
  return null;
}

// Download a file
function downloadFile(fileName, content, contentType) {
  const blob = base64ToBlob(content, contentType);
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

// Convert base64 to Blob
function base64ToBlob(base64, contentType) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: contentType || 'application/octet-stream' });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Listen for service worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showNotification('App updated. Refresh for the latest version.', 'info', true);
  });
}

// Export public functions
export { 
  navigateToPage,
  updateOnlineStatus,
  setTheme
};
