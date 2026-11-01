import type { KpiItem, KpiStatus, ProjectStatus } from '../types'

type Tone = 'neutral' | 'danger' | 'info' | 'success' | 'violet' | 'confirmed'

export const STATUS_META: Record<
  KpiStatus,
  { label: string; tone: Tone; short: string }
> = {
  pending_submit: { label: '待提交', tone: 'neutral', short: '等待填报人填写并提交' },
  returned_submit: { label: '已退回待提交', tone: 'danger', short: '等待填报人修改后重新提交' },
  pending_review: { label: '待审核', tone: 'info', short: '等待审核人审批' },
  returned_review: { label: '已退回待审核', tone: 'danger', short: '等待审核人重新审核' },
  approved: { label: '审核通过', tone: 'success', short: '等待管理员发起员工确认' },
  pending_confirm: { label: '待确认', tone: 'violet', short: '等待填报人确认最终结果' },
  confirmed: { label: '已确认', tone: 'confirmed', short: '本轮考核已完成' },
}

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: Tone }
> = {
  draft: { label: '待启动', tone: 'neutral' },
  active: { label: '进行中', tone: 'success' },
  ended: { label: '已结束', tone: 'neutral' },
}

export const STATUS_OPTIONS = (Object.keys(STATUS_META) as KpiStatus[]).map((value) => ({
  value,
  label: STATUS_META[value].label,
}))

export const StatusTag = ({ status }: { status: KpiStatus }) => {
  const meta = STATUS_META[status]
  return (
    <span className={`status-pill status-${meta.tone}`}>
      <i aria-hidden />
      {meta.label}
    </span>
  )
}

export const ProjectStatusTag = ({ status }: { status: ProjectStatus }) => {
  const meta = PROJECT_STATUS_META[status]
  return (
    <span className={`status-pill status-${meta.tone} ${status === 'active' ? 'status-live' : ''}`}>
      <i aria-hidden />
      {meta.label}
    </span>
  )
}

export const countWeight = (kpis: KpiItem[]) =>
  Math.round(kpis.reduce((total, kpi) => total + (Number(kpi.weight) || 0), 0) * 10) / 10

export const isWeightComplete = (kpis: KpiItem[]) =>
  kpis.length > 0 && Math.abs(countWeight(kpis) - 100) < 0.01

let sequence = 0
export const uid = (prefix = 'id') => {
  sequence += 1
  return `${prefix}-${Date.now().toString(36)}-${sequence}`
}

export const blankKpi = (): KpiItem => ({
  id: uid('kpi'),
  name: '',
  weight: 0,
  basicTarget: '',
  challengeTarget: '',
})

export const blankKpis = (count = 3) => Array.from({ length: count }, blankKpi)

export const RETURN_TARGET: Partial<Record<KpiStatus, KpiStatus>> = {
  pending_review: 'returned_submit',
  returned_review: 'returned_submit',
  approved: 'returned_review',
  pending_confirm: 'returned_review',
}

export const isPendingReview = (status: KpiStatus) =>
  status === 'pending_review' || status === 'returned_review'

export const isPendingSubmit = (status: KpiStatus) =>
  status === 'pending_submit' || status === 'returned_submit'

export const canEditKpis = (
  meId: string | undefined,
  projectStatus: ProjectStatus,
  reviewerId: string,
  status: KpiStatus,
) =>
  projectStatus === 'active' &&
  isPendingReview(status) &&
  reviewerId === meId

export const canReturnKpis = (role: string | null, meId: string | undefined, projectStatus: ProjectStatus, reviewerId: string, status: KpiStatus) => {
  if (projectStatus !== 'active') return false
  if (role === 'admin') return Boolean(RETURN_TARGET[status])
  if (role === 'reviewer' && reviewerId === meId) return isPendingReview(status)
  return false
}
