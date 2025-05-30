import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Check if we're in production mode
  const isProduction = mode === 'production';
  
  // Determine if we're running in Azure Static Web Apps
  const isAzure = Boolean(process.env.GITHUB_WORKFLOW) || Boolean(process.env.AZURE_STATIC_WEB_APPS_API_TOKEN);
  
  // Set base URL based on deployment environment
  // - For Azure Static Web Apps: '/'
  // - For GitHub Pages: '/gitty-gitty-git-er/'
  // - For local development: '/'
  const base = isProduction && !isAzure ? '/gitty-gitty-git-er/' : '/';
  
  // Debug configuration loading
  console.log(`Running in ${mode} mode with base: ${base}`);
  console.log(`Azure Static Web Apps: ${isAzure ? 'Yes' : 'No'}`);
  console.log('API URL from env:', env.VITE_API_URL);

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt', // Changed to prompt for better user experience
        includeAssets: [
          'favicon.svg', 
          'favicon.ico', 
          'robots.txt', 
          'apple-touch-icon.png',
          'icons/*.png'
        ],
        manifest: {
          name: 'Gitty-Gitty-Git-Er',
          short_name: 'GittyGit',
          description: 'A comprehensive GitHub manager with AI capabilities',
          theme_color: '#2da44e',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: base,
          icons: [
            { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }
          ],
          categories: ['productivity', 'developer tools', 'utilities']
        },
        // Configure the service worker based on environment
        ...(isAzure 
          ? {
              // For Azure, use a simpler auto-generated service worker
              registerType: 'autoUpdate',
              workbox: {
                clientsClaim: true,
                skipWaiting: true
              }
            } 
          : {
              // For other environments, use our custom service worker
              strategy: 'injectManifest',
              swSrc: './service-worker.js',
              injectRegister: 'auto',
              injectManifest: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
                globIgnores: ['**/node_modules/**/*']
              }
            }
        ),
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    server: {
      port: 5173,
      host: true, // Expose to all network interfaces
      strictPort: true, // Fail if port is already in use
      hmr: {
        overlay: true, // Show errors as overlay
      },
      cors: {
        origin: '*', // Allow all origins in development
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
      },
      proxy: {
        // Forward API requests to the backend server
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxy request:', req.method, req.url);
            });
          }
        },
        // Forward auth requests
        '/auth': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        },
        // For Azure auth - only in development mode
        '/.auth': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      // Generate source maps for better debugging
      sourcemap: true,
      // Configure output directory
      outDir: 'dist',
      // Optimize chunks
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'query-vendor': ['@tanstack/react-query', 'axios']
          }
        }
      },
      // Ensure we copy the static web app config to the output
      assetsInlineLimit: 4096, // 4kb - don't inline files larger than this
      // Report build errors better
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      // Copy the Azure Static Web Apps configuration file
      emptyOutDir: true,
      copyPublicDir: true
    },
    // Define environment variables with defaults for better compatibility
    define: {
      // Provide fallbacks for environment variables
      'import.meta.env.VITE_API_URL': JSON.stringify(
        isAzure
          ? '/api' // In Azure, use the relative API path
          : (env.VITE_API_URL || 'http://localhost:3001')
      ),
      'import.meta.env.VITE_ENABLE_MOCK_AUTH': JSON.stringify(
        isAzure 
          ? 'false' // In Azure, use real auth
          : (env.VITE_ENABLE_MOCK_AUTH || 'true')
      ),
      'import.meta.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG || 'true'),
      'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || 'Gitty-Gitty-Git-Er'),
      'import.meta.env.VITE_IS_AZURE': JSON.stringify(isAzure ? 'true' : 'false')
    }
  };
});
