const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  pushToDatabase: () => ipcRenderer.send('push-to-db-button'),
  grabAllDataFromDatabase: () => ipcRenderer.invoke('grab-all-from-database'),
  devToolsSwitch: () => ipcRenderer.send('dev-tools-switch')
})