import type {
  BacklogItem,
  CourseModule,
  DodItem,
  Metric,
  MvpCriterion,
  Overview,
  PracticeRow
} from './types'

let cachedBase: string | null = null

async function baseUrl(): Promise<string> {
  if (cachedBase) return cachedBase
  const port = await window.api.getBackendPort()
  cachedBase = `http://127.0.0.1:${port}`
  return cachedBase
}

export async function apiGet<T>(path: string): Promise<T> {
  const base = await baseUrl()
  const resp = await fetch(`${base}${path}`)
  if (!resp.ok) throw new Error(`GET ${path} → ${resp.status}`)
  return resp.json() as Promise<T>
}

async function apiSend<T>(method: 'PATCH' | 'POST', path: string, body: unknown): Promise<T> {
  const base = await baseUrl()
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!resp.ok) throw new Error(`${method} ${path} → ${resp.status}`)
  return resp.json() as Promise<T>
}

export async function getHealth(): Promise<{ status: string }> {
  return apiGet('/health')
}

// --- чтение сущностей ---
export const getOverview = (): Promise<Overview> => apiGet('/overview')
export const getCourse = (): Promise<CourseModule[]> => apiGet('/course')
export const getPractice = (): Promise<PracticeRow[]> => apiGet('/practice')
export const getBacklog = (): Promise<BacklogItem[]> => apiGet('/backlog')
export const getMetrics = (): Promise<Metric[]> => apiGet('/metrics')
export const getMvp = (): Promise<MvpCriterion[]> => apiGet('/mvp')
export const getDod = (): Promise<DodItem[]> => apiGet('/dod')

// --- обновление состояния ---
export const setModuleStatus = (id: string, status: string, note?: string) =>
  apiSend('PATCH', `/course/${id}`, { status, note })

export const setPracticeState = (id: string, patch: { status?: string; artifact_url?: string }) =>
  apiSend('PATCH', `/practice/${id}`, patch)

export const addJournalEntry = (id: string, data: Record<string, string>) =>
  apiSend('POST', `/practice/${id}/journal`, { data })

export const setBacklogDone = (id: string, done: boolean) =>
  apiSend('PATCH', `/backlog/${id}`, { done })

export const setMvpDone = (id: string, done: boolean) =>
  apiSend('PATCH', `/mvp/${id}`, { done })

export const setDodDone = (id: string, done: boolean) =>
  apiSend('PATCH', `/dod/${id}`, { done })

export const setMetricState = (
  id: string,
  patch: { current_value?: string; done?: boolean }
) => apiSend('PATCH', `/metric/${id}`, patch)
