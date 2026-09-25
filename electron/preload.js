const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('animals', {
  onPlay: (callback) => ipcRenderer.on('play', (_, data) => callback(data)),
  ended: () => ipcRenderer.send('animation-ended'),
});
