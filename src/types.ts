export type Role = 'admin' | 'employee' | 'reviewer'

export type ProjectStatus = 'pending' | 'ongoing' | 'ended'

export type MemberStatus =
  | 'pending_submit'
  | 'returned_submit'
  | 'pending_review'
  | 'returned_review'
  | 'approved'
  | 'pending_confirm'
  | 'confirmed'

export interface KpiItem {
  id: string
  name: string
  weight: number
  baseTarget: string
  challengeTarget: string
}

export interface Member {
  id: string
  employeeId: string
  name: string
  dept: string
  position: string
  reviewerId: string | null
  kpis: KpiItem[]
  status: MemberStatus
  returnNote?: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  year: number
  status: ProjectStatus
  startDate: string | null
  creator: string
  members: Member[]
}

export interface HrEmployee {
  id: string
  name: string
  dept: string
  position: string
  reviewerId: string | null
  isReviewer?: boolean
}

export interface AppData {
  seedVersion: number
  projects: Project[]
  roster: HrEmployee[]
}

export interface ActionResult {
  ok: boolean
  error?: string
}

export interface CreateProjectResult extends ActionResult {
  projectId?: string
}

export interface BulkActionResult extends ActionResult {
  processed: number
  skipped: number
}

export const ADMIN_NAME = '张敏'
export const ADMIN_DEPT = '人力资源部'
export const DEMO_EMPLOYEE_ID = 'emp-lisi'
export const DEMO_REVIEWER_ID = 'emp-wangqiang'
export const SEED_VERSION = 2
export const WEIGHT_TOTAL = 100

export const MEMBER_STATUS_META: Record<
  MemberStatus,
  { label: string; color: string }
> = {
  pending_submit: { label: '待提交', color: 'gold' },
  returned_submit: { label: '已退回待提交', color: 'volcano' },
  pending_review: { label: '待审核', color: 'blue' },
  returned_review: { label: '已退回待审核', color: 'orange' },
  approved: { label: '审核通过', color: 'cyan' },
  pending_confirm: { label: '待确认', color: 'geekblue' },
  confirmed: { label: '已确认', color: 'gray' },
}

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; color: string }
> = {
  pending: { label: '待启动', color: 'gold' },
  ongoing: { label: '进行中', color: 'blue' },
  ended: { label: '已结束', color: 'default' },
}

export const EMPLOYEE_EDITABLE_STATUSES: MemberStatus[] = [
  'pending_submit',
  'returned_submit',
]

export const REVIEWABLE_STATUSES: MemberStatus[] = [
  'pending_review',
  'returned_review',
]

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function roundWeight(value: number): number {
  return Math.round(value * 100) / 100
}

export function totalWeight(kpis: KpiItem[]): number {
  return roundWeight(
    kpis.reduce((sum, item) => sum + (Number(item.weight) || 0), 0),
  )
}

export function emptyKpiRows(count = 3): KpiItem[] {
  return Array.from({ length: count }, () => ({
    id: createId('kpi'),
    name: '',
    weight: 0,
    baseTarget: '',
    challengeTarget: '',
  }))
}

export function formatDate(value: Date = new Date()): string {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateTime(value: Date = new Date()): string {
  const hours = `${value.getHours()}`.padStart(2, '0')
  const minutes = `${value.getMinutes()}`.padStart(2, '0')
  return `${formatDate(value)} ${hours}:${minutes}`
}

export function getProjectStats(project: Project) {
  const total = project.members.length
  const confirmed = project.members.filter(
    (member) => member.status === 'confirmed',
  ).length
  const pendingReview = project.members.filter((member) =>
    REVIEWABLE_STATUSES.includes(member.status),
  ).length
  const pendingConfirm = project.members.filter(
    (member) => member.status === 'pending_confirm',
  ).length
  const completion = total === 0 ? 0 : roundWeight((confirmed / total) * 100)

  return { total, confirmed, pendingReview, pendingConfirm, completion }
}

export function getMemberByEmployee(project: Project, employeeId: string) {
  return project.members.find((member) => member.employeeId === employeeId)
}

export function getReviewerName(
  roster: HrEmployee[],
  reviewerId: string | null,
): string {
  if (!reviewerId) return '未分配'
  return roster.find((employee) => employee.id === reviewerId)?.name ?? '未知'
}
