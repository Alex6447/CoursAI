import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { Socket } from 'net'
import { startBackend, stopBackend } from './pythonBridge'

let backendPort = 0
let backendReady: Promise<number> | null = null

// Проверяем, реально ли dev-сервер уже принимает TCP-соединения.
function probePort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new Socket()
    const finish = (ok: boolean): void => {
      sock.destroy()
      resolve(ok)
    }
    sock.setTimeout(1000)
    sock.once('connect', () => finish(true))
    sock.once('timeout', () => finish(false))
    sock.once('error', () => finish(false))
    sock.connect(port, host)
  })
}

async function loadRenderer(win: BrowserWindow): Promise<void> {
  const devUrl = process.env.ELECTRON_RENDERER_URL
  if (!devUrl) {
    await win.loadFile(join(__dirname, '../renderer/index.html'))
    return
  }

  // На Windows "localhost" может резолвиться в IPv6 ::1, а Vite слушает IPv4 — грузим
  // через 127.0.0.1. Кроме того, electron-vite печатает "dev server running" раньше,
  // чем сервер фактически начинает принимать соединения: на холодном старте под
  // антивирусом это десятки секунд. Поэтому ждём готовности порта TCP-пробой (до 60с),
  // а did-fail-load перезагружает страницу, если сервер всё же отвалится.
  const url = devUrl.replace('localhost', '127.0.0.1')
  const parsed = new URL(url)
  const host = parsed.hostname
  const port = Number(parsed.port) || 5173

  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    if (await probePort(host, port)) break
    await new Promise((r) => setTimeout(r, 400))
  }

  win.webContents.on('did-fail-load', (_e, errorCode, _desc, _failedUrl, isMainFrame) => {
    // -3 (ERR_ABORTED) — нормальная отмена при перезагрузке, не реагируем.
    if (!isMainFrame || errorCode === -3) return
    setTimeout(() => {
      if (!win.isDestroyed()) win.loadURL(url).catch(() => {})
    }, 500)
  })

  await win.loadURL(url).catch(() => {})
}

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  await loadRenderer(win)
}

// Рендерер дожидается готовности бэкенда через этот промис.
ipcMain.handle('backend:port', async () => {
  if (backendReady) {
    try {
      return await backendReady
    } catch {
      return 0
    }
  }
  return backendPort
})

app.whenReady().then(async () => {
  backendReady = startBackend()
    .then((port) => {
      backendPort = port
      console.log(`[backend] готов на порту ${port}`)
      return port
    })
    .catch((err) => {
      console.error('Не удалось запустить backend:', err)
      return 0
    })

  await createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => stopBackend())
