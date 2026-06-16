export type ModuleStatus = 'not_started' | 'in_progress' | 'done' | 'optional'

export interface CourseModule {
  id: string
  number: number
  title: string
  niche: string
  deadline_hint: string
  study_points: string[]
  task: string[]
  acceptance_criterion: string
  optional: boolean
  status: ModuleStatus
  note: string
}

export interface JournalEntry {
  id: number
  created_at: string
  data: Record<string, string>
}

export interface PracticeRow {
  id: string
  module_ref: string
  artifact: string
  metric_criterion: string
  link: string
  status: string
  artifact_url: string
  journal: JournalEntry[]
}

export interface BacklogItem {
  id: string
  phase: string
  week: number
  text: string
  done: boolean
  done_at: string
}

export interface Metric {
  id: string
  text: string
  target: string
  current_value: string
  done: boolean
}

export interface MvpCriterion {
  id: string
  group: string
  text: string
  done: boolean
}

export interface DodItem {
  id: string
  text: string
  done: boolean
}

export interface Dimension {
  done: number
  total: number
  percent: number
}

export interface CurrentFocus {
  kind: 'backlog' | 'course' | 'mvp' | 'done'
  id: string
  title: string
  context: string
  screen: string
}

export interface Overview {
  theory: Dimension
  practice: Dimension
  projects: Dimension
  dod: Dimension
  current_focus: CurrentFocus | null
}
