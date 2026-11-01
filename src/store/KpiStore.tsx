import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { createSeedData } from '../data/seed'
import {
  ADMIN_NAME,
  EMPLOYEE_EDITABLE_STATUSES,
  REVIEWABLE_STATUSES,
  SEED_VERSION,
  WEIGHT_TOTAL,
  createId,
  formatDate,
  formatDateTime,
  totalWeight,
  type ActionResult,
  type AppData,
  type BulkActionResult,
  type CreateProjectResult,
  type HrEmployee,
  type KpiItem,
  type Member,
  type Project,
} from '../types'

const STORAGE_KEY = 'kpi-admin-demo-data-v1'

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppData
      if (
        parsed.seedVersion === SEED_VERSION &&
        Array.isArray(parsed.projects) &&
        Array.isArray(parsed.roster)
      ) {
        return parsed
      }
    }
  } catch {
    // 本地数据损坏时回退到种子数据
  }
  return createSeedData()
}

interface KpiStoreValue {
  data: AppData
  dispatch: (recipe: (draft: AppData) => void) => void
  reset: () => void
}

const KpiStoreContext = createContext<KpiStoreValue | null>(null)

export function KpiProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())

  const dispatch = useCallback((recipe: (draft: AppData) => void) => {
    setData((previous) => {
      const next = structuredClone(previous)
      recipe(next)
      return next
    })
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // 忽略本地存储写入失败，不影响演示
    }
  }, [data])

  const reset = useCallback(() => {
    setData(createSeedData())
  }, [])

  return (
    <KpiStoreContext.Provider value={{ data, dispatch, reset }}>
      {children}
    </KpiStoreContext.Provider>
  )
}

export function useKpi() {
  const value = useContext(KpiStoreContext)
  if (!value) {
    throw new Error('useKpi must be used within KpiProvider')
  }
  return value
}

function normalizeKpis(kpis: KpiItem[]): KpiItem[] {
  return kpis.map((item) => ({
    ...item,
    name: item.name.trim(),
    weight: Number(item.weight) || 0,
    baseTarget: item.baseTarget.trim(),
    challengeTarget: item.challengeTarget.trim(),
  }))
}

function makeMember(employee: HrEmployee): Member {
  return {
    id: createId('mem'),
    employeeId: employee.id,
    name: employee.name,
    dept: employee.dept,
    position: employee.position,
    reviewerId: employee.reviewerId,
    kpis: [],
    status: 'pending_submit',
    updatedAt: formatDateTime(),
  }
}

export function useKpiActions() {
  const { data, dispatch } = useKpi()

  const locate = (projectId: string, memberId: string) => {
    const project = data.projects.find((item) => item.id === projectId)
    const member = project?.members.find((item) => item.id === memberId)
    return { project, member }
  }

  const createProject = (input: {
    name: string
    year: number
    employees: HrEmployee[]
  }): CreateProjectResult => {
    const name = input.name.trim()
    if (!name) return { ok: false, error: '请填写项目名称' }
    if (!input.year) return { ok: false, error: '请填写考核年度' }

    const uniqueEmployees = Array.from(
      new Map(input.employees.map((employee) => [employee.id, employee])).values(),
    )
    const projectId = createId('proj')
    const project: Project = {
      id: projectId,
      name,
      year: input.year,
      status: 'pending',
      startDate: null,
      creator: ADMIN_NAME,
      members: uniqueEmployees.map(makeMember),
    }

    dispatch((draft) => {
      draft.projects.unshift(project)
    })
    return { ok: true, projectId }
  }

  const deleteProject = (projectId: string) => {
    dispatch((draft) => {
      draft.projects = draft.projects.filter((item) => item.id !== projectId)
    })
  }

  const startProject = (projectId: string): ActionResult => {
    const project = data.projects.find((item) => item.id === projectId)
    if (!project) return { ok: false, error: '考核项目不存在' }
    if (project.status !== 'pending') return { ok: false, error: '仅待启动项目可以启动' }
    if (project.members.length === 0) {
      return { ok: false, error: '项目下暂无考核人员，请先添加人员' }
    }

    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      if (target) {
        target.status = 'ongoing'
        target.startDate = formatDate()
      }
    })
    return { ok: true }
  }

  const endProject = (projectId: string): ActionResult => {
    const project = data.projects.find((item) => item.id === projectId)
    if (!project) return { ok: false, error: '考核项目不存在' }
    if (project.status !== 'ongoing') return { ok: false, error: '仅进行中项目可以结束' }

    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      if (target) target.status = 'ended'
    })
    return { ok: true }
  }

  const addMembers = (
    projectId: string,
    employees: HrEmployee[],
  ): ActionResult => {
    const project = data.projects.find((item) => item.id === projectId)
    if (!project) return { ok: false, error: '考核项目不存在' }
    if (project.status === 'ended') {
      return { ok: false, error: '项目已结束，不能新增人员' }
    }
    const existingIds = new Set(project.members.map((member) => member.employeeId))
    const freshEmployees = employees.filter((employee) => !existingIds.has(employee.id))
    if (freshEmployees.length === 0) {
      return { ok: false, error: '所选人员已在项目中' }
    }

    const newMembers = freshEmployees.map(makeMember)
    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      target?.members.push(...newMembers)
    })
    return { ok: true }
  }

  const removeMember = (projectId: string, memberId: string): ActionResult => {
    const { project, member } = locate(projectId, memberId)
    if (!project) return { ok: false, error: '考核项目不存在' }
    if (!member) return { ok: false, error: '考核人员不存在' }
    if (project.status === 'ended') {
      return { ok: false, error: '项目已结束，不能移除人员' }
    }

    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      if (target) {
        target.members = target.members.filter((item) => item.id !== memberId)
      }
    })
    return { ok: true }
  }

  const changeReviewer = (
    projectId: string,
    memberId: string,
    reviewerId: string,
  ): ActionResult => {
    const { project, member } = locate(projectId, memberId)
    if (!project) return { ok: false, error: '考核项目不存在' }
    if (!member) return { ok: false, error: '考核人员不存在' }
    if (project.status === 'ended') {
      return { ok: false, error: '项目已结束，不能修改审核人' }
    }
    if (!data.roster.some((employee) => employee.id === reviewerId && employee.isReviewer)) {
      return { ok: false, error: '请选择有效的审核人' }
    }

    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      const targetMember = target?.members.find((item) => item.id === memberId)
      if (targetMember) targetMember.reviewerId = reviewerId
    })
    return { ok: true }
  }

  const updateMemberInfo = (
    projectId: string,
    memberId: string,
    input: { name: string; dept: string; position: string },
  ): ActionResult => {
    const { project, member } = locate(projectId, memberId)
    if (!project) return { ok: false, error: '考核项目不存在' }
    if (!member) return { ok: false, error: '考核人员不存在' }
    if (project.status === 'ended') {
      return { ok: false, error: '项目已结束，不能编辑考核人员' }
    }
    const name = input.name.trim()
    const dept = input.dept.trim()
    const position = input.position.trim()
    if (!name) return { ok: false, error: '请填写姓名' }
    if (!dept) return { ok: false, error: '请填写部门' }
    if (!position) return { ok: false, error: '请填写岗位' }

    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      const targetMember = target?.members.find((item) => item.id === memberId)
      if (targetMember) {
        targetMember.name = name
        targetMember.dept = dept
        targetMember.position = position
      }
    })
    return { ok: true }
  }

  const submitMemberKpis = (
    projectId: string,
    memberId: string,
    kpis: KpiItem[],
  ): ActionResult => {
    const { project, member } = locate(projectId, memberId)
    if (!project) return { ok: false, error: '考核项目不存在' }
    if (!member) return { ok: false, error: '考核人员不存在' }
    if (project.status !== 'ongoing') return { ok: false, error: '项目未启动或已结束' }
    if (!EMPLOYEE_EDITABLE_STATUSES.includes(member.status)) {
      return { ok: false, error: '当前状态不可提交' }
    }
    if (kpis.length === 0) return { ok: false, error: '请至少保留 1 条 KPI' }
    const normalized = normalizeKpis(kpis)
    const total = totalWeight(normalized)
    if (total !== WEIGHT_TOTAL) {
      return { ok: false, error: `权重合计需为 100%（当前 ${total}%）` }
    }

    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      const targetMember = target?.members.find((item) => item.id === memberId)
      if (targetMember) {
        targetMember.kpis = normalized
        targetMember.status = 'pending_review'
        targetMember.returnNote = undefined
        targetMember.updatedAt = formatDateTime()
      }
    })
    return { ok: true }
  }

  const reviewMember = (
    projectId: string,
    memberId: string,
    kpis: KpiItem[],
    action: 'approve' | 'return',
    note?: string,
  ): ActionResult => {
    const { project, member } = locate(projectId, memberId)
    if (!project) return { ok: false, error: '考核项目不存在' }
    if (!member) return { ok: false, error: '考核人员不存在' }
    if (project.status !== 'ongoing') return { ok: false, error: '项目未启动或已结束' }
    if (!REVIEWABLE_STATUSES.includes(member.status)) {
      return { ok: false, error: '当前状态不可审核' }
    }

    const normalized = normalizeKpis(kpis)
    if (action === 'approve' && totalWeight(normalized) !== WEIGHT_TOTAL) {
      return {
        ok: false,
        error: `权重合计需为 100% 才能审核通过（当前 ${totalWeight(normalized)}%）`,
      }
    }

    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      const targetMember = target?.members.find((item) => item.id === memberId)
      if (targetMember) {
        targetMember.kpis = normalized
        targetMember.status = action === 'approve' ? 'approved' : 'returned_submit'
        targetMember.returnNote = action === 'return' && note?.trim() ? note.trim() : undefined
        targetMember.updatedAt = formatDateTime()
      }
    })
    return { ok: true }
  }

  const bulkReviewMembers = (
    projectId: string,
    memberIds: string[],
    action: 'approve' | 'return',
    note?: string,
  ): BulkActionResult => {
    const project = data.projects.find((item) => item.id === projectId)
    if (!project) {
      return { ok: false, error: '考核项目不存在', processed: 0, skipped: 0 }
    }
    if (project.status !== 'ongoing') {
      return { ok: false, error: '项目未启动或已结束', processed: 0, skipped: 0 }
    }

    const eligibleIds: string[] = []
    project.members.forEach((member) => {
      if (!memberIds.includes(member.id)) return
      if (!REVIEWABLE_STATUSES.includes(member.status)) return
      if (action === 'approve' && totalWeight(member.kpis) !== WEIGHT_TOTAL) return
      eligibleIds.push(member.id)
    })

    if (eligibleIds.length === 0) {
      return {
        ok: false,
        error:
          action === 'approve'
            ? '所选人员中没有可审核通过的人员（需处于待审核状态且权重合计 100%）'
            : '所选人员中没有可退回的人员',
        processed: 0,
        skipped: memberIds.length,
      }
    }

    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      target?.members.forEach((member) => {
        if (!eligibleIds.includes(member.id)) return
        member.status = action === 'approve' ? 'approved' : 'returned_submit'
        member.returnNote = action === 'return' && note?.trim() ? note.trim() : undefined
        member.updatedAt = formatDateTime()
      })
    })

    return {
      ok: true,
      processed: eligibleIds.length,
      skipped: memberIds.length - eligibleIds.length,
    }
  }

  const adminDecide = (
    projectId: string,
    memberIds: string[],
    action: 'request_confirm' | 'return_review',
    note?: string,
  ): BulkActionResult => {
    const project = data.projects.find((item) => item.id === projectId)
    if (!project) {
      return { ok: false, error: '考核项目不存在', processed: 0, skipped: 0 }
    }
    if (project.status !== 'ongoing') {
      return { ok: false, error: '项目未启动或已结束', processed: 0, skipped: 0 }
    }

    const eligibleIds = project.members
      .filter((member) => memberIds.includes(member.id) && member.status === 'approved')
      .map((member) => member.id)

    if (eligibleIds.length === 0) {
      return {
        ok: false,
        error:
          action === 'request_confirm'
            ? '所选人员中没有“审核通过”可发起确认的人员'
            : '所选人员中没有“审核通过”可退回的人员',
        processed: 0,
        skipped: memberIds.length,
      }
    }

    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      target?.members.forEach((member) => {
        if (!eligibleIds.includes(member.id)) return
        member.status = action === 'request_confirm' ? 'pending_confirm' : 'returned_review'
        member.returnNote = action === 'return_review' && note?.trim() ? note.trim() : undefined
        member.updatedAt = formatDateTime()
      })
    })

    return {
      ok: true,
      processed: eligibleIds.length,
      skipped: memberIds.length - eligibleIds.length,
    }
  }

  const confirmMember = (projectId: string, memberId: string): ActionResult => {
    const { project, member } = locate(projectId, memberId)
    if (!project) return { ok: false, error: '考核项目不存在' }
    if (!member) return { ok: false, error: '考核人员不存在' }
    if (project.status !== 'ongoing') return { ok: false, error: '项目未启动或已结束' }
    if (member.status !== 'pending_confirm') {
      return { ok: false, error: '当前状态不可确认' }
    }

    dispatch((draft) => {
      const target = draft.projects.find((item) => item.id === projectId)
      const targetMember = target?.members.find((item) => item.id === memberId)
      if (targetMember) {
        targetMember.status = 'confirmed'
        targetMember.updatedAt = formatDateTime()
      }
    })
    return { ok: true }
  }

  return {
    createProject,
    deleteProject,
    startProject,
    endProject,
    addMembers,
    removeMember,
    changeReviewer,
    updateMemberInfo,
    submitMemberKpis,
    reviewMember,
    bulkReviewMembers,
    adminDecide,
    confirmMember,
  }
}
