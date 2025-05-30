import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  // Set base URL for GitHub Pages deployment in production
  // Format: /<repo-name>/
  const base = isProduction ? '/gitty-gitty-git-er/' : '/';

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
        // We're using a custom service worker with our own caching strategies
        // No need for Workbox configuration here since we handle it in service-worker.js
        // Enable offline detection and handling
        strategy: 'injectManifest',
        swSrc: './service-worker.js',
        injectRegister: 'auto',
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
          globIgnores: ['**/node_modules/**/*']
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
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
      }
    }
  };
});
