import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppState, CurrentUser, Employee, KpiItem, Participant, Project } from './types'
import { ADMIN_ID, buildSeedState, defaultReviewerFor } from './data/mock'
import { genId, today } from './utils/kit'

const STORAGE_KEY = 'kpi-admin-demo-v1'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed && Array.isArray(parsed.employees) && Array.isArray(parsed.projects) && Array.isArray(parsed.participants)) {
        return parsed
      }
    }
  } catch {
    // 本地存储损坏时回退到种子数据
  }
  return buildSeedState()
}

interface StoreValue {
  state: AppState
  currentUser: CurrentUser | null
  setUser: (user: CurrentUser | null) => void
  resetDemo: () => void
  addProject: (name: string, year: number, employeeIds: string[]) => number
  deleteProject: (projectId: string) => void
  startProject: (projectId: string) => number
  endProject: (projectId: string) => void
  addParticipants: (projectId: string, employeeIds: string[]) => number
  removeParticipants: (participantIds: string[]) => void
  changeReviewer: (participantId: string, reviewerId: string) => void
  submitKpis: (participantId: string, kpis: KpiItem[]) => void
  approveKpis: (participantId: string, kpis: KpiItem[]) => void
  reviewerReturn: (participantId: string, note: string) => void
  startConfirm: (participantIds: string[]) => void
  adminReturn: (participantIds: string[], note: string) => void
  confirmKpi: (participantId: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 存储失败不影响演示
    }
  }, [state])

  const makeParticipant = (emp: Employee, projectId: string): Participant => ({
    id: genId('pt'),
    employeeId: emp.id,
    projectId,
    reviewerId: defaultReviewerFor(emp),
    status: 'toSubmit',
    kpis: [],
  })

  const actions = {
    setUser: (user: CurrentUser | null) => setCurrentUser(user),
    resetDemo: () => setState(buildSeedState()),

    addProject: (name: string, year: number, employeeIds: string[]) => {
      const newProject: Project = {
        id: genId('p'),
        name: name.trim(),
        year,
        status: 'pending',
        creatorId: ADMIN_ID,
        createdAt: today(),
      }
      const emps = state.employees.filter((e) => employeeIds.includes(e.id))
      setState((s) => ({
        ...s,
        projects: [...s.projects, newProject],
        participants: [...s.participants, ...emps.map((e) => makeParticipant(e, newProject.id))],
      }))
      return emps.length
    },

    deleteProject: (projectId: string) => {
      setState((s) => ({
        ...s,
        projects: s.projects.filter((p) => p.id !== projectId),
        participants: s.participants.filter((p) => p.projectId !== projectId),
      }))
    },

    startProject: (projectId: string) => {
      const count = state.participants.filter((p) => p.projectId === projectId).length
      setState((s) => ({
        ...s,
        projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: 'active', startedAt: today() } : p)),
        participants: s.participants.map((p) =>
          p.projectId === projectId ? { ...p, status: 'toSubmit', returnNote: undefined, returnedBy: undefined } : p,
        ),
      }))
      return count
    },

    endProject: (projectId: string) => {
      setState((s) => ({
        ...s,
        projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: 'ended', endedAt: today() } : p)),
      }))
    },

    addParticipants: (projectId: string, employeeIds: string[]) => {
      const existing = new Set(state.participants.filter((p) => p.projectId === projectId).map((p) => p.employeeId))
      const emps = state.employees.filter((e) => employeeIds.includes(e.id) && !existing.has(e.id))
      if (emps.length > 0) {
        setState((s) => ({
          ...s,
          participants: [...s.participants, ...emps.map((e) => makeParticipant(e, projectId))],
        }))
      }
      return emps.length
    },

    removeParticipants: (participantIds: string[]) => {
      const set = new Set(participantIds)
      setState((s) => ({ ...s, participants: s.participants.filter((p) => !set.has(p.id)) }))
    },

    changeReviewer: (participantId: string, reviewerId: string) => {
      setState((s) => ({
        ...s,
        participants: s.participants.map((p) => (p.id === participantId ? { ...p, reviewerId } : p)),
      }))
    },

    submitKpis: (participantId: string, kpis: KpiItem[]) => {
      setState((s) => ({
        ...s,
        participants: s.participants.map((p) =>
          p.id === participantId ? { ...p, kpis, status: 'toReview', returnNote: undefined, returnedBy: undefined } : p,
        ),
      }))
    },

    approveKpis: (participantId: string, kpis: KpiItem[]) => {
      setState((s) => ({
        ...s,
        participants: s.participants.map((p) =>
          p.id === participantId ? { ...p, kpis, status: 'approved', returnNote: undefined, returnedBy: undefined } : p,
        ),
      }))
    },

    reviewerReturn: (participantId: string, note: string) => {
      setState((s) => ({
        ...s,
        participants: s.participants.map((p) =>
          p.id === participantId ? { ...p, status: 'returnedToSubmit', returnNote: note, returnedBy: 'reviewer' } : p,
        ),
      }))
    },

    startConfirm: (participantIds: string[]) => {
      const set = new Set(participantIds)
      setState((s) => ({
        ...s,
        participants: s.participants.map((p) => (set.has(p.id) && p.status === 'approved' ? { ...p, status: 'toConfirm' } : p)),
      }))
    },

    adminReturn: (participantIds: string[], note: string) => {
      const set = new Set(participantIds)
      setState((s) => ({
        ...s,
        participants: s.participants.map((p) =>
          set.has(p.id) && p.status === 'approved' ? { ...p, status: 'returnedToReview', returnNote: note, returnedBy: 'admin' } : p,
        ),
      }))
    },

    confirmKpi: (participantId: string) => {
      setState((s) => ({
        ...s,
        participants: s.participants.map((p) => (p.id === participantId && p.status === 'toConfirm' ? { ...p, status: 'confirmed' } : p)),
      }))
    },
  }

  const value: StoreValue = { state, currentUser, ...actions }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore 必须在 AppProvider 内使用')
  return ctx
}
