import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'app/src/main/index.ts') }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'app/src/preload/index.ts') }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'app/src/renderer'),
    server: {
      // На Windows Vite по умолчанию может слушать только IPv6 (::1), из-за чего
      // Electron не достучится по 127.0.0.1. Жёстко привязываем dev-сервер к IPv4.
      host: '127.0.0.1'
    },
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'app/src/renderer/index.html') }
      }
    },
    resolve: {
      alias: { '@renderer': resolve(__dirname, 'app/src/renderer/src') }
    },
    plugins: [react()]
  }
})
