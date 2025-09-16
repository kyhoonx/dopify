const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMusicFiles: () => ipcRenderer.invoke('get-music-files'),
  startWatching: () => ipcRenderer.invoke('start-watching'),
  onMusicFilesUpdated: (callback) => {
    ipcRenderer.on('music-files-updated', (event, data) => callback(data));
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});


