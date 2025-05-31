/**
 * Electron preload script
 * Exposes secure IPC communication to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    // File operations
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    
    // External links
    openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
    
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    
    // System info
    platform: process.platform
  }
);