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
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
          // Don't fallback on document based (e.g. `/some-page`) requests
          // This removes the default '/' handler
          navigationPreload: true,
          // Only precache runtime
          inlineWorkboxRuntime: true,
          // Skip waiting to update service worker
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            // GitHub API caching
            {
              urlPattern: new RegExp('^https://api.github.com/.*'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'github-api-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                },
                networkTimeoutSeconds: 10 // Fallback to cache if network request takes more than 10 seconds
              }
            },
            // Cache images with a Cache-First strategy
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                }
              }
            },
            // Cache fonts with a Cache-First strategy
            {
              urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            // Cache JS and CSS with a Stale-While-Revalidate strategy
            {
              urlPattern: /\.(?:js|css)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 24 * 60 * 60 // 24 hours
                }
              }
            },
            // Cache the local API endpoints for offline support
            {
              urlPattern: /^\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                networkTimeoutSeconds: 10
              }
            },
            // Fallback for navigation requests
            {
              urlPattern: /\/$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                }
              }
            }
          ]
        },
        // Enable offline detection and handling
        strategies: 'injectManifest',
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
