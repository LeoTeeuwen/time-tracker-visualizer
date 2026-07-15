const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  pushToDatabase: () => ipcRenderer.send('push-to-db-button'),
  grabAllDataFromDatabase: (showDayEnds) => ipcRenderer.invoke('grab-all-from-database', showDayEnds),
  devToolsSwitch: () => ipcRenderer.send('dev-tools-switch'),
  backOneDay: () => ipcRenderer.send('back-one-button'),
  forwardOneDay: () => ipcRenderer.send('forward-one-button'),
  grabCurrentDate: () => ipcRenderer.invoke('grab-current-date'),
  grabBarChartTimeBreakdown: () => ipcRenderer.invoke('grab-bar-chart-data')
})