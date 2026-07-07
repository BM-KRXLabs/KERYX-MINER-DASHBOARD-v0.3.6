const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('keryx', {
  onEvent: (callback) => {
    const handler = (_evt, payload) => callback(payload);
    ipcRenderer.on('miner-event', handler);
    return () => ipcRenderer.removeListener('miner-event', handler);
  },
  onStatus: (callback) => {
    const handler = (_evt, payload) => callback(payload);
    ipcRenderer.on('miner-status', handler);
    return () => ipcRenderer.removeListener('miner-status', handler);
  },
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  minimize: () => ipcRenderer.invoke('window-min'),
  close: () => ipcRenderer.invoke('window-close'),
  openInfer: () => ipcRenderer.invoke('open-infer-window'),
  openHashrate: () => ipcRenderer.invoke('open-hashrate-window'),
  onSettingsOpen: (callback) => {
    ipcRenderer.on('open-settings', callback);
  },
});