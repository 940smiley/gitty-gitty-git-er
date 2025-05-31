import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Application initialization logger
const initLogger = {
  log: (message) => {
    console.log(`[INIT] ${message}`);
    // Log to debug container if available
    if (window.appDebug && window.appDebug.log) {
      window.appDebug.log(message);
    }
  },
  error: (message, error) => {
    console.error(`[INIT ERROR] ${message}`, error);
    // Log to debug container if available
    if (window.appDebug && window.appDebug.error) {
      window.appDebug.error(message, error);
    }
  }
};

// Track startup steps
initLogger.log('Application initialization started');

// Environment variable validation and logging function
const validateAndLogEnvironment = () => {
  try {
    // Set default values for required environment variables
    const defaults = {
      VITE_API_URL: '/api',
      VITE_APP_NAME: 'Gitty-Gitty-Git-Er',
      VITE_ENABLE_MOCK_AUTH: 'false',
      MODE: 'production'
    };

    // Create a safe environment object that falls back to defaults
    const safeEnv = {
      ...defaults,
      ...(typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {})
    };
    
    // Log environment information
    initLogger.log(`Environment: ${safeEnv.MODE}`);
    initLogger.log(`API URL: ${safeEnv.VITE_API_URL}`);
    initLogger.log(`App Name: ${safeEnv.VITE_APP_NAME}`);
    initLogger.log(`Mock Auth Enabled: ${safeEnv.VITE_ENABLE_MOCK_AUTH}`);
    
    return {
      mode: safeEnv.MODE,
      apiUrl: safeEnv.VITE_API_URL,
      mockAuthEnabled: safeEnv.VITE_ENABLE_MOCK_AUTH === 'true',
      appName: safeEnv.VITE_APP_NAME
    };
  } catch (error) {
    initLogger.error('Failed to validate environment variables', error);
    return {
      mode: 'production',
      apiUrl: '/api',
      mockAuthEnabled: false,
      appName: 'Gitty-Gitty-Git-Er'
    };
  }
};

// Validate environment safely when module is initialized
const env = validateAndLogEnvironment();

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    initLogger.error('React Error Boundary caught an error', error);
    console.error('Error details:', errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error Details</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </details>
          <button onClick={() => window.location.reload()}>Reload Application</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create a client for React Query
initLogger.log('Creating React Query client');
let queryClient;
try {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 30000,
        onError: (error) => {
          initLogger.error('React Query error', error);
        }
      }
    }
  });
  initLogger.log('React Query client created successfully');
} catch (error) {
  initLogger.error('Failed to create React Query client', error);
  // Create a minimal client to prevent crashes
  queryClient = new QueryClient();
}

initLogger.log('Starting to render React application');

// Find the root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  initLogger.error('Root element not found in the DOM');
  // Create a root element as a fallback
  const fallbackRoot = document.createElement('div');
  fallbackRoot.id = 'root';
  document.body.appendChild(fallbackRoot);
  initLogger.log('Created fallback root element');
}

// Mount the React application
try {
  initLogger.log('Creating React root');
  const root = ReactDOM.createRoot(rootElement || document.getElementById('root'));
  
  initLogger.log('Rendering React application');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  initLogger.log('React render method called successfully');
  
  // Report successful initialization after a delay
  setTimeout(() => {
    // Hide loading screen programmatically
    const loadingElement = document.getElementById('app-loading');
    if (loadingElement) {
      initLogger.log('Hiding loading screen');
      loadingElement.classList.add('hidden');
    }
    
    initLogger.log('Application initialization completed');
  }, 1000);
  
} catch (error) {
  initLogger.error('Failed to render React application', error);
  
  // Display error in the UI
  const errorMessage = document.createElement('div');
  errorMessage.innerHTML = `
    <div style="padding: 20px; background: #f44336; color: white; margin-top: 20px;">
      <h3>Application Failed to Start</h3>
      <p>${error.message}</p>
      <button onclick="window.location.reload()">Reload</button>
    </div>
  `;
  
  if (rootElement) {
    rootElement.appendChild(errorMessage);
  } else {
    document.body.appendChild(errorMessage);
  }
  
  // Hide loading screen
  const loadingElement = document.getElementById('app-loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

// Track navigation events
window.addEventListener('popstate', () => {
  initLogger.log(`Navigation occurred: ${window.location.pathname}`);
});
