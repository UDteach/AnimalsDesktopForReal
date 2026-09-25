const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('animalTimer', {
  onUpdate: (callback) => ipcRenderer.on('timer:update', (_, value) => callback(value)),
});
