export type ProjectStatus = 'pending' | 'active' | 'ended'

export type PersonStatus =
  | 'toSubmit'
  | 'returnedToSubmit'
  | 'toReview'
  | 'returnedToReview'
  | 'approved'
  | 'toConfirm'
  | 'confirmed'

export type Role = 'admin' | 'reviewer' | 'filler'

export interface KpiItem {
  id: string
  name: string
  weight: number | null
  basicTarget: string
  challengeTarget: string
}

export interface Employee {
  id: string
  name: string
  department: string
  position: string
}

export interface Participant {
  id: string
  employeeId: string
  projectId: string
  reviewerId: string
  status: PersonStatus
  kpis: KpiItem[]
  returnNote?: string
  returnedBy?: 'reviewer' | 'admin'
}

export interface Project {
  id: string
  name: string
  year: number
  status: ProjectStatus
  creatorId: string
  createdAt: string
  startedAt?: string
  endedAt?: string
}

export interface AppState {
  employees: Employee[]
  projects: Project[]
  participants: Participant[]
}

export interface CurrentUser {
  employeeId: string
  role: Role
}
