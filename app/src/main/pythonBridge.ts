import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { createServer } from 'net'
import { existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

let proc: ChildProcessWithoutNullStreams | null = null

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      srv.close(() => resolve(port))
    })
  })
}

function resolvePython(): { cmd: string; args: string[]; cwd: string } {
  const backendDir = app.isPackaged
    ? join(process.resourcesPath, 'backend')
    : join(__dirname, '../../backend')

  // Dev: предпочитаем venv-интерпретатор, иначе системный python.
  const venvPy = join(backendDir, '.venv', 'Scripts', 'python.exe')
  const cmd = existsSync(venvPy) ? venvPy : 'python'
  return { cmd, args: ['-m', 'app.main'], cwd: backendDir }
}

async function waitForHealth(port: number, timeoutMs = 60000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const resp = await fetch(`http://127.0.0.1:${port}/health`)
      if (resp.ok) return
    } catch {
      // backend ещё поднимается
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error('Backend не ответил на /health за отведённое время')
}

export async function startBackend(): Promise<number> {
  const port = await findFreePort()
  const { cmd, args, cwd } = resolvePython()

  proc = spawn(cmd, [...args, '--host', '127.0.0.1', '--port', String(port)], {
    cwd,
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
    // Не создавать отдельное окно консоли для дочернего Python (важно в упакованной
    // GUI-сборке, где у Electron нет унаследованной консоли).
    windowsHide: true
  })

  proc.stdout.on('data', (d) => console.log(`[py] ${d}`))
  proc.stderr.on('data', (d) => console.error(`[py] ${d}`))
  proc.on('exit', (code) => console.log(`[py] exited code=${code}`))

  await waitForHealth(port)
  return port
}

export function stopBackend(): void {
  if (proc && !proc.killed) {
    proc.kill()
    proc = null
  }
}
