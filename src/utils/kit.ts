import type { Employee, KpiItem, PersonStatus, ProjectStatus } from '../types'

export const PERSON_STATUS_META: Record<PersonStatus, { label: string; color: string }> = {
  toSubmit: { label: '待提交', color: 'default' },
  returnedToSubmit: { label: '已退回待提交', color: 'error' },
  toReview: { label: '待审核', color: 'processing' },
  returnedToReview: { label: '已退回待审核', color: 'warning' },
  approved: { label: '审核通过', color: 'cyan' },
  toConfirm: { label: '待确认', color: 'geekblue' },
  confirmed: { label: '已确认', color: 'success' },
}

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  pending: { label: '待启动', color: 'default' },
  active: { label: '进行中', color: 'processing' },
  ended: { label: '已结束', color: 'default' },
}

export const PERSON_STATUS_OPTIONS = (Object.keys(PERSON_STATUS_META) as PersonStatus[]).map((value) => ({
  value,
  label: PERSON_STATUS_META[value].label,
}))

let seq = 0

export function genId(prefix: string): string {
  seq += 1
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}`
}

export function emptyKpiRows(count = 3): KpiItem[] {
  return Array.from({ length: count }, () => ({
    id: genId('k'),
    name: '',
    weight: null,
    basicTarget: '',
    challengeTarget: '',
  }))
}

export function sumWeight(kpis: KpiItem[]): number {
  const sum = kpis.reduce((s, k) => s + (k.weight ?? 0), 0)
  return Math.round(sum * 100) / 100
}

export function validateKpis(kpis: KpiItem[]): string | null {
  if (kpis.length === 0) return '请至少填写一条 KPI 指标'
  for (let i = 0; i < kpis.length; i += 1) {
    const item = kpis[i]
    if (!item.name.trim()) return `第 ${i + 1} 条指标的「指标名称」不能为空`
    if (item.weight == null) return `第 ${i + 1} 条指标的「权重」不能为空`
  }
  const sum = sumWeight(kpis)
  if (sum !== 100) return `权重合计必须等于 100%，当前合计为 ${sum}%`
  return null
}

export function employeeLabel(e: Employee): string {
  return `${e.name}（${e.department} · ${e.position}）`
}

export function fmtDate(iso?: string): string {
  return iso ? iso.slice(0, 10) : '—'
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}
