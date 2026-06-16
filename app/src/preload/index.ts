import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getBackendPort: (): Promise<number> => ipcRenderer.invoke('backend:port')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
