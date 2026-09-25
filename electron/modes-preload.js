const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('modeSettings', {
  load: () => ipcRenderer.invoke('modes:get'),
  save: (value) => ipcRenderer.invoke('modes:save', value),
});
