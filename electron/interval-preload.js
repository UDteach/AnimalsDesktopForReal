const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('intervalSettings', {
  load: () => ipcRenderer.invoke('interval:get'),
  save: (value) => ipcRenderer.invoke('interval:save', value),
});
