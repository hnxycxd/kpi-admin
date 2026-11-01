import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { EMPLOYEE_MAP, MOCK_PROJECTS, ROLE_ACCOUNTS } from '../data/mock'
import { RETURN_TARGET } from '../lib/status'
import type { Employee, KpiItem, KpiStatus, Participant, Project, Role } from '../types'

const pad = (value: number) => String(value).padStart(2, '0')

export const formatDateTime = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`

export const formatDate = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const cloneSeed = (): Project[] =>
  MOCK_PROJECTS.map((project) => ({
    ...project,
    participants: project.participants.map((participant) => ({
      ...participant,
      kpis: participant.kpis.map((kpi) => ({ ...kpi })),
    })),
  }))

interface NewProjectInput {
  name: string
  year: number
  employeeIds: string[]
}

interface Store {
  role: Role | null
  me: Employee | null
  projects: Project[]
  enter: (role: Role) => void
  exit: () => void
  reset: () => void
  createProject: (input: NewProjectInput) => Project
  deleteProject: (projectId: string) => boolean
  startProject: (projectId: string) => boolean
  endProject: (projectId: string) => boolean
  addParticipants: (projectId: string, employeeIds: string[]) => number
  removeParticipants: (projectId: string, participantIds: string[]) => number
  updateReviewer: (participantId: string, reviewerId: string) => void
  saveKpis: (participantId: string, kpis: KpiItem[]) => void
  submitKpis: (participantId: string, kpis: KpiItem[]) => void
  approve: (participantIds: string[]) => number
  returnRecord: (participantId: string, note: string) => KpiStatus | null
  requestConfirm: (participantIds: string[]) => number
  confirmRecord: (participantId: string) => boolean
}

const StoreContext = createContext<Store | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(cloneSeed)
  const [role, setRole] = useState<Role | null>(null)

  const me = role ? EMPLOYEE_MAP[ROLE_ACCOUNTS[role].employeeId] : null

  const store = useMemo<Store>(() => {
    const patchParticipants = (ids: string[], updater: (participant: Participant) => Participant) => {
      const idSet = new Set(ids)
      setProjects((prev) =>
        prev.map((project) => {
          if (!project.participants.some((participant) => idSet.has(participant.id))) return project
          return {
            ...project,
            participants: project.participants.map((participant) =>
              idSet.has(participant.id) ? updater(participant) : participant,
            ),
          }
        }),
      )
    }

    const patchParticipant = (id: string, updater: (participant: Participant) => Participant) =>
      patchParticipants([id], updater)

    const allParticipants = projects.flatMap((project) => project.participants)

    return {
      role,
      me,
      projects,
      enter: setRole,
      exit: () => setRole(null),
      reset: () => setProjects(cloneSeed()),
      createProject: ({ name, year, employeeIds }) => {
        const id = `proj-${Date.now()}`
        const now = formatDateTime()
        const project: Project = {
          id,
          name,
          year,
          status: 'draft',
          createdAt: now,
          createdBy: ROLE_ACCOUNTS.admin.employeeId,
          participants: employeeIds.map((employeeId) => ({
            id: `${id}-${employeeId}`,
            employeeId,
            reviewerId: EMPLOYEE_MAP[employeeId].defaultReviewerId,
            status: 'pending_submit',
            kpis: [],
            updatedAt: now,
          })),
        }
        setProjects((prev) => [project, ...prev])
        return project
      },
      deleteProject: (projectId) => {
        const target = projects.find((project) => project.id === projectId)
        if (!target || target.status === 'active') return false
        setProjects((prev) => prev.filter((project) => project.id !== projectId))
        return true
      },
      startProject: (projectId) => {
        const target = projects.find((project) => project.id === projectId)
        if (!target || target.status !== 'draft') return false
        const startedAt = formatDate()
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId
              ? { ...project, status: 'active', startedAt }
              : project,
          ),
        )
        return true
      },
      endProject: (projectId) => {
        const target = projects.find((project) => project.id === projectId)
        if (!target || target.status !== 'active') return false
        const endedAt = formatDate()
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId ? { ...project, status: 'ended', endedAt } : project,
          ),
        )
        return true
      },
      addParticipants: (projectId, employeeIds) => {
        const target = projects.find((project) => project.id === projectId)
        if (!target || target.status === 'ended') return 0
        const existing = new Set(target.participants.map((participant) => participant.employeeId))
        const fresh = employeeIds.filter((employeeId) => !existing.has(employeeId))
        if (fresh.length === 0) return 0
        const now = formatDateTime()
        const additions: Participant[] = fresh.map((employeeId) => ({
          id: `${projectId}-${employeeId}`,
          employeeId,
          reviewerId: EMPLOYEE_MAP[employeeId].defaultReviewerId,
          status: 'pending_submit',
          kpis: [],
          updatedAt: now,
        }))
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId
              ? { ...project, participants: [...project.participants, ...additions] }
              : project,
          ),
        )
        return additions.length
      },
      removeParticipants: (projectId, participantIds) => {
        const target = projects.find((project) => project.id === projectId)
        if (!target || target.status === 'ended') return 0
        const idSet = new Set(participantIds)
        const removed = target.participants.filter((participant) => idSet.has(participant.id)).length
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  participants: project.participants.filter(
                    (participant) => !idSet.has(participant.id),
                  ),
                }
              : project,
          ),
        )
        return removed
      },
      updateReviewer: (participantId, reviewerId) =>
        patchParticipant(participantId, (participant) => ({
          ...participant,
          reviewerId,
          updatedAt: formatDateTime(),
        })),
      saveKpis: (participantId, kpis) =>
        patchParticipant(participantId, (participant) => ({
          ...participant,
          kpis,
          updatedAt: formatDateTime(),
        })),
      submitKpis: (participantId, kpis) =>
        patchParticipant(participantId, (participant) => {
          const now = formatDateTime()
          return {
            ...participant,
            kpis,
            status: 'pending_review',
            returnNote: undefined,
            submittedAt: now,
            updatedAt: now,
          }
        }),
      approve: (participantIds) => {
        const eligible = participantIds.filter((id) => {
          const participant = allParticipants.find((item) => item.id === id)
          return Boolean(
            participant &&
              (participant.status === 'pending_review' ||
                participant.status === 'returned_review'),
          )
        })
        if (eligible.length === 0) return 0
        patchParticipants(eligible, (participant) => {
          const now = formatDateTime()
          return {
            ...participant,
            status: 'approved',
            returnNote: undefined,
            reviewedAt: now,
            updatedAt: now,
          }
        })
        return eligible.length
      },
      returnRecord: (participantId, note) => {
        const participant = allParticipants.find((item) => item.id === participantId)
        const next = participant ? RETURN_TARGET[participant.status] : undefined
        if (!next) return null
        const now = formatDateTime()
        patchParticipant(participantId, (current) => ({
          ...current,
          status: next,
          returnNote: note.trim() || undefined,
          reviewedAt: now,
          updatedAt: now,
        }))
        return next
      },
      requestConfirm: (participantIds) => {
        const eligible = participantIds.filter((id) => {
          const participant = allParticipants.find((item) => item.id === id)
          return participant?.status === 'approved'
        })
        if (eligible.length === 0) return 0
        patchParticipants(eligible, (participant) => ({
          ...participant,
          status: 'pending_confirm',
          updatedAt: formatDateTime(),
        }))
        return eligible.length
      },
      confirmRecord: (participantId) => {
        const participant = allParticipants.find((item) => item.id === participantId)
        if (participant?.status !== 'pending_confirm') return false
        const now = formatDateTime()
        patchParticipant(participantId, (current) => ({
          ...current,
          status: 'confirmed',
          confirmedAt: now,
          updatedAt: now,
        }))
        return true
      },
    }
  }, [projects, role, me])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useAppStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider')
  return store
}
