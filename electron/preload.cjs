const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  platform: process.platform,
  isDesktop: true,
  onMenuNewPage: (callback) => ipcRenderer.on('menu:new-page', callback),
  onMenuToggleSidebar: (callback) => ipcRenderer.on('menu:toggle-sidebar', callback),
  onQuickCapture: (callback) => ipcRenderer.on('quick-capture', callback),
});
