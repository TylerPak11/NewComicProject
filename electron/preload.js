const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you need to expose to the renderer process
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getDatabasePath: () => ipcRenderer.invoke('get-database-path'),
  
  // Platform information
  platform: process.platform,
  
  // App information
  isElectron: true,
  
  // Environment variables
  getEnv: (key) => process.env[key]
});