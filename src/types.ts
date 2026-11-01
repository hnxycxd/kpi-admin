export type Role = 'admin' | 'reviewer' | 'employee'

export type ProjectStatus = 'draft' | 'active' | 'ended'

export type KpiStatus =
  | 'pending_submit'
  | 'returned_submit'
  | 'pending_review'
  | 'returned_review'
  | 'approved'
  | 'pending_confirm'
  | 'confirmed'

export interface Employee {
  id: string
  name: string
  dept: string
  position: string
  defaultReviewerId: string
}

export interface KpiItem {
  id: string
  name: string
  weight: number
  basicTarget: string
  challengeTarget: string
}

export interface Participant {
  id: string
  employeeId: string
  reviewerId: string
  status: KpiStatus
  kpis: KpiItem[]
  returnNote?: string
  submittedAt?: string
  reviewedAt?: string
  confirmedAt?: string
  updatedAt?: string
}

export interface Project {
  id: string
  name: string
  year: number
  status: ProjectStatus
  createdAt: string
  createdBy: string
  startedAt?: string
  endedAt?: string
  participants: Participant[]
}

export interface Account {
  role: Role
  employeeId: string
}
