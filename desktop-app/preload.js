const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  pushToDatabase: () => ipcRenderer.send('push-to-db-button')
})