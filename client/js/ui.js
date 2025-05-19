/**
 * Gitty-Gitty-Git-Er
 * UI module for handling user interface interactions
 */

// UI configuration
const UI_CONFIG = {
  notificationDuration: 5000, // 5 seconds
  pagesWithNavbar: ['dashboard', 'repositories', 'code', 'prs', 'settings'],
  animationDuration: 300 // ms
};

// UI state
let uiState = {
  currentPage: null,
  notifications: [],
  callbacks: {},
  loaders: {},
  modals: {}
};

/**
 * Initialize the UI module
 * @param {Object} appState - Application state reference
 * @param {Object} callbacks - Callback functions
 */
function initUI(appState, callbacks = {}) {
  console.log('Initializing UI module...');
  
  // Store callbacks
  uiState.callbacks = callbacks;
  
  // Initialize components
  initModals();
  initToasts();
  
  // Set theme from localStorage
  initTheme();
  
  // Register event listeners
  document.addEventListener('click', handleDocumentClick);
}

/**
 * Initialize modals
 */
function initModals() {
  // Get all modals
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
    const id = modal.id;
    
    // Store reference to modal
    uiState.modals[id] = {
      element: modal,
      isOpen: false
    };
    
    // Close modal when clicking outside content
    modal.addEventListener('click', event => {
      if (event.target === modal) {
        closeModal(id);
      }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && uiState.modals[id].isOpen) {
        closeModal(id);
      }
    });
  });
}

/**
 * Initialize toast notifications
 */
function initToasts() {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

/**
 * Initialize theme based on localStorage or system preference
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
  } else {
    // Use system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-theme');
    }
  }
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (localStorage.getItem('theme') === 'system') {
      if (event.matches) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  });
}

/**
 * Show a page by ID
 * @param {string} pageId - Page ID to show
 */
function showPage(pageId) {
  // Update current page in state
  uiState.currentPage = pageId;
  
  // Hide all pages
  document.querySelectorAll('.app-page').forEach(page => {
    page.classList.add('hidden');
  });
  
  // Show requested page
  const page = document.getElementById(`${pageId}-page`);
  if (page) {
    page.classList.remove('hidden');
  } else {
    console.error(`Page with ID ${pageId}-page not found`);
    return;
  }
  
  // Update navigation
  updateNavigation(pageId);
  
  // Call page-specific initialization if it exists
  if (typeof uiState.callbacks.onPageChange === 'function') {
    uiState.callbacks.onPageChange(pageId);
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
}

/**
 * Update navigation based on current page
 * @param {string} currentPageId - Current page ID
 */
function updateNavigation(currentPageId) {
  // Remove active class from all nav links
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class to current page link
  const currentNavLink = document.querySelector(`.nav-links a[data-page="${currentPageId}"]`);
  if (currentNavLink) {
    currentNavLink.classList.add('active');
  }
  
  // Show/hide navbar based on page
  const header = document.querySelector('.app-header');
  if (UI_CONFIG.pagesWithNavbar.includes(currentPageId)) {
    header.classList.remove('hidden');
  } else {
    header.classList.add('hidden');
  }
}

/**
 * Show a notification toast
 * @param {string} message - Message to display
 * @param {string} type - Notification type (info, success, warning, error)
 * @param {boolean} persistent - Whether the notification should persist
 * @returns {string} Notification ID
 */
function showNotification(message, type = 'info', persistent = false) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Generate unique ID for the toast
  const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  toast.id = id;
  
  // Add icon based on type
  let icon;
  switch (type) {
    case 'success':
      icon = 'check_circle';
      break;
    case 'warning':
      icon = 'warning';
      break;
    case 'error':
      icon = 'error';
      break;
    case 'info':
    default:
      icon = 'info';
      break;
  }
  
  // Create toast content
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="material-icons">${icon}</i>
    </div>
    <div class="toast-content">
      ${message}
    </div>
    <button class="toast-close">
      <i class="material-icons">close</i>
    </button>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Add to state
  uiState.notifications.push({
    id,
    element: toast,
    type,
    message,
    timestamp: Date.now()
  });
  
  // Add click listener to close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    removeNotification(id);
  });
  
  // Auto-remove toast after duration if not persistent
  if (!persistent) {
    setTimeout(() => {
      removeNotification(id);
    }, UI_CONFIG.notificationDuration);
  }
  
  return id;
}

/**
 * Remove a notification toast
 * @param {string} id - Notification ID to remove
 */
function removeNotification(id) {
  const toast = document.getElementById(id);
  
  if (toast) {
    // Add fadeout class
    toast.classList.add('toast-fadeout');
    
    // Remove after animation
    setTimeout(() => {
      toast.remove();
      
      // Remove from state
      uiState.notifications = uiState.notifications.filter(n => n.id !== id);
    }, UI_CONFIG.animationDuration);
  }
}

/**
 * Show a loading indicator
 * @param {string} id - ID of the loader
 * @param {string} message - Loading message
 * @param {Element} container - Container to show loader in
 * @returns {Element} The loader element
 */
function showLoader(id, message = 'Loading...', container = null) {
  // If we already have a loader with this ID, remove it first
  if (uiState.loaders[id]) {
    removeLoader(id);
  }
  
  // Create loader
  const loader = document.createElement('div');
  loader.className = 'loader';
  loader.id = `loader-${id}`;
  loader.innerHTML = `
    <div class="loader-spinner"></div>
    <div class="loader-message">${message}</div>
  `;
  
  // Add to container or body
  if (container) {
    container.appendChild(loader);
  } else {
    document.body.appendChild(loader);
    loader.classList.add('loader-overlay');
  }
  
  // Store in state
  uiState.loaders[id] = {
    element: loader,
    container
  };
  
  return loader;
}

/**
 * Remove a loading indicator
 * @param {string} id - ID of the loader to remove
 */
function removeLoader(id) {
  const loader = uiState.loaders[id];
  
  if (loader) {
    loader.element.remove();
    delete uiState.loaders[id];
  }
}

/**
 * Open a modal
 * @param {string} id - ID of the modal to open
 */
function openModal(id) {
  const modal = uiState.modals[id];
  
  if (modal) {
    modal.element.classList.remove('hidden');
    modal.isOpen = true;
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close a modal
 * @param {string} id - ID of the modal to close
 */
function closeModal(id) {
  const modal = uiState.modals[id];
  
  if (modal) {
    modal.element.classList.add('hidden');
    modal.isOpen = false;
    
    // Restore body scrolling
    document.body.style.overflow = '';
  }
}

/**
 * Handle document click events for delegation
 * @param {Event} event - Click event
 */
function handleDocumentClick(event) {
  // Handle modal open/close buttons
  if (event.target.closest('.open-modal')) {
    const modalId = event.target.closest('.open-modal').getAttribute('data-modal');
    if (modalId) {
      openModal(modalId);
    }
  }
  
  if (event.target.closest('.close-modal')) {
    const modal = event.target.closest('.modal');
    if (modal) {
      closeModal(modal.id);
    }
  }
}

/**
 * Update UI for online/offline status
 * @param {boolean} isOnline - Whether the app is online
 */
function updateOnlineStatus(isOnline) {
  const indicator = document.getElementById('connection-indicator');
  const statusElement = document.getElementById('connection-status');
  
  if (!isOnline) {
    indicator.classList.add('offline');
    statusElement.textContent = 'Offline';
  } else {
    indicator.classList.remove('offline');
    statusElement.textContent = 'Online';
  }
}

/**
 * Display a file tree from a nested object structure
 * @param {Element} container - Container element
 * @param {Array} items - File tree items
 * @param {Function} onFileClick - Callback when a file is clicked
 */
function renderFileTree(container, items, onFileClick) {
  // Clear container
  container.innerHTML = '';
  
  // Create list
  const ul = document.createElement('ul');
  ul.className = 'file-tree-list';
  
  // Add items
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = `file-tree-item ${item.type}`;
    
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = item.name;
    link.setAttribute('data-path', item.path);
    link.setAttribute('data-type', item.type);
    
    // Add appropriate icon
    const icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.textContent = item.type === 'dir' ? 'folder' : 'description';
    link.prepend(icon);
    
    // Add click handler
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof onFileClick === 'function') {
        onFileClick(item);
      }
    });
    
    li.appendChild(link);
    ul.appendChild(li);
  });
  
  container.appendChild(ul);
}

/**
 * Render a repository list
 * @param {Element} container - Container element
 * @param {Array} repositories - Repository data
 * @param {Object} options - Rendering options
 */
function renderRepositoryList(container, repositories, options = {}) {
  // Clear container
  container.innerHTML = '';
  
  if (repositories.length === 0) {
    container.innerHTML = '<p class="empty-state">No repositories found</p>';
    return;
  }
  
  repositories.forEach(repo => {
    const repoCard = document.createElement('div');
    repoCard.className = 'repo-card';
    
    const updatedAt = new Date(repo.updated_at).toLocaleDateString();
    
    repoCard.innerHTML = `
      <h3 class="repo-name">${repo.name}</h3>
      <p class="repo-description">${repo.description || 'No description provided'}</p>
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
    
    container.appendChild(repoCard);
    
    // Add event listeners if callbacks provided
    const viewCodeBtn = repoCard.querySelector('.view-code-btn');
    const viewPRsBtn = repoCard.querySelector('.view-prs-btn');
    
    if (options.onViewCode && viewCodeBtn) {
      viewCodeBtn.addEventListener('click', () => {
        options.onViewCode(repo);
      });
    }
    
    if (options.onViewPRs && viewPRsBtn) {
      viewPRsBtn.addEventListener('click', () => {
        options.onViewPRs(repo);
      });
    }
  });
}

/**
 * Render a pull request list
 * @param {Element} container - Container element
 * @param {Array} pullRequests - Pull request data
 * @param {Object} options - Rendering options
 */
function renderPullRequestList(container, pullRequests, options = {}) {
  // Clear container
  container.innerHTML = '';
  
  if (pullRequests.length === 0) {
    container.innerHTML = '<p class="empty-state">No pull requests found</p>';
    return;
  }
  
  pullRequests.forEach(pr => {
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
    
    container.appendChild(prItem);
    
    // Add event listeners if callbacks provided
    if (options.onViewDetails) {
      prItem.addEventListener('click', (e) => {
        // Don't trigger if clicking on a link or button
        if (!e.target.closest('a') && !e.target.closest('button')) {
          options.onViewDetails(pr);
        }
      });
    }
  });
}

// CSS for toast notifications and loaders
// This is added dynamically to avoid needing to modify the CSS file
function addDynamicStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Toast container */
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 100%;
      width: 320px;
    }

    /* Toast notification */
    .toast {
      display: flex;
      align-items: flex-start;
      padding: 1rem;
      background-color: var(--bg-color);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-lg);
      animation: toast-fadein 0.3s ease;
      border-left: 4px solid;
    }

    .toast-info {
      border-left-color: var(--info-color);
    }

    .toast-success {
      border-left-color: var(--success-color);
    }

    .toast-warning {
      border-left-color: var(--warning-color);
    }

    .toast-error {
      border-left-color: var(--error-color);
    }

    .toast-icon {
      margin-right: 0.5rem;
      display: flex;
      align-items: center;
    }

    .toast-info .toast-icon {
      color: var(--info-color);
    }

    .toast-success .toast-icon {
      color: var(--success-color);
    }

    .toast-warning .toast-icon {
      color: var(--warning-color);
    }

    .toast-error .toast-icon {
      color: var(--error-color);
    }

    .toast-content {
      flex: 1;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      color: var(--text-secondary);
    }

    .toast-fadeout {
      animation: toast-fadeout 0.3s ease forwards;
    }

    @keyframes toast-fadein {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes toast-fadeout {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }

    /* Loader */
    .loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9998;
    }

    .loader-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border-color);
      border-top: 4px solid var(--primary-color);
      border-radius: 50%;
      animation: loader-spin 1s linear infinite;
    }

    .loader-message {
      margin-top: 0.5rem;
      color: var(--text-color);
    }

    @keyframes loader-spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Call this function immediately
addDynamicStyles();

// Export UI functions
export {
  initUI,
  showPage,
  showNotification,
  removeNotification,
  showLoader,
  removeLoader,
  openModal,
  closeModal,
  updateOnlineStatus,
  renderFileTree,
  renderRepositoryList,
  renderPullRequestList
};
