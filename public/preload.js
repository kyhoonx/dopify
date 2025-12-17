const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMusicFiles: () => ipcRenderer.invoke('get-music-files'),
  startWatching: () => ipcRenderer.invoke('start-watching'),
  onMusicFilesUpdated: (callback) => {
    ipcRenderer.on('music-files-updated', (event, data) => callback(data));
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
  getApiKeys: () => ipcRenderer.invoke('get-api-keys'),
  saveApiKeys: (keys) => ipcRenderer.invoke('save-api-keys', keys),
  searchSpotifyArtist: (artistName) => ipcRenderer.invoke('search-spotify-artist', artistName),
  // Deprecated but kept for backward compatibility if needed
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  saveApiKey: (key) => ipcRenderer.invoke('save-api-key', key),
  selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
  getMusicFolder: () => ipcRenderer.invoke('get-music-folder')
});


