import type { Employee, KpiItem, Participant, Project } from '../types'

export const ADMIN_ID = 'p1'
export const REVIEWER_ID = 'p2'
export const EMPLOYEE_ID = 'p3'

export const EMPLOYEES: Employee[] = [
  { id: 'p1', name: '张敏', dept: '人力资源部', position: '人力资源总监', defaultReviewerId: 'p2' },
  { id: 'p2', name: '王建国', dept: '总经办', position: '运营副总', defaultReviewerId: 'p1' },
  { id: 'p3', name: '陈晨', dept: '技术中心', position: '前端工程师', defaultReviewerId: 'p2' },
  { id: 'p4', name: '赵磊', dept: '技术中心', position: '后端工程师', defaultReviewerId: 'p2' },
  { id: 'p5', name: '孙悦', dept: '技术中心', position: '测试工程师', defaultReviewerId: 'p2' },
  { id: 'p6', name: '周涛', dept: '产品部', position: '产品经理', defaultReviewerId: 'p2' },
  { id: 'p7', name: '吴迪', dept: '市场部', position: '市场专员', defaultReviewerId: 'p2' },
  { id: 'p8', name: '郑琪', dept: '人力资源部', position: '招聘专员', defaultReviewerId: 'p1' },
  { id: 'p9', name: '李雪', dept: '销售部', position: '销售经理', defaultReviewerId: 'p2' },
  { id: 'p10', name: '何静', dept: '人力资源部', position: '薪酬绩效专员', defaultReviewerId: 'p1' },
  { id: 'p11', name: '刘洋', dept: '财务部', position: '财务分析师', defaultReviewerId: 'p2' },
  { id: 'p12', name: '高翔', dept: '技术中心', position: '运维工程师', defaultReviewerId: 'p2' },
  { id: 'p13', name: '林昭', dept: '产品部', position: '产品助理', defaultReviewerId: 'p2' },
  { id: 'p14', name: '徐航', dept: '技术中心', position: '算法工程师', defaultReviewerId: 'p2' },
  { id: 'p15', name: '罗佳', dept: '销售部', position: '客户经理', defaultReviewerId: 'p2' },
  { id: 'p16', name: '秦川', dept: '市场部', position: '品牌经理', defaultReviewerId: 'p2' },
]

export const EMPLOYEE_MAP: Record<string, Employee> = Object.fromEntries(
  EMPLOYEES.map((employee) => [employee.id, employee]),
)

type TemplateKey = 'tech' | 'product' | 'hr' | 'sales' | 'finance' | 'market' | 'ops'

const KPI_TEMPLATES: Record<TemplateKey, Array<[string, number, string, string]>> = {
  tech: [
    ['需求交付及时率', 40, '计划内需求按期交付率不低于 95%', '100% 按期交付，且上线后零回滚'],
    ['线上稳定性', 30, '季度内 P1 级故障不超过 1 起', '全年零 P1 故障，P2 故障数同比下降 50%'],
    ['工程质量', 30, '代码评审覆盖率不低于 80%', '评审覆盖率不低于 95%，单测覆盖率提升 10%'],
  ],
  product: [
    ['版本目标达成率', 40, '关键版本按期上线率不低于 90%', '全部关键版本按期上线且核心指标达成'],
    ['需求价值验证', 30, '完成 2 个核心需求的 A/B 验证', '完成 4 个验证并沉淀可复用的方法论'],
    ['跨团队协作', 30, '需求评审一次通过率不低于 80%', '一次通过率不低于 95%，且无跨团队阻塞'],
  ],
  hr: [
    ['招聘完成率', 40, '关键岗位季度到岗率不低于 85%', '关键岗位 100% 到岗，平均招聘周期缩短 20%'],
    ['绩效流程及时率', 30, '绩效节点按时完成率不低于 95%', '按时完成率 100%，且全年零绩效申诉'],
    ['员工体验', 30, '员工满意度不低于 4.0 分（5 分制）', '满意度不低于 4.5 分，主动离职率下降 10%'],
  ],
  sales: [
    ['回款目标', 40, '完成年度回款 800 万元', '完成年度回款 1000 万元'],
    ['新客拓展', 30, '新增签约客户 12 家', '新增签约客户 18 家，且续约率提升'],
    ['客户满意度', 30, '客户续约率不低于 80%', '客户续约率不低于 90%，NPS 提升 10 分'],
  ],
  finance: [
    ['月度结账及时率', 40, '每月 5 个工作日内完成结账', '每月 3 个工作日内完成结账且零差错'],
    ['预算偏差率', 30, '年度预算执行偏差不超过 8%', '年度预算执行偏差不超过 3%'],
    ['报表质量', 30, '财务报表一次通过率不低于 90%', '报表一次通过率 100%，审计零调整'],
  ],
  market: [
    ['品牌曝光', 40, '季度核心活动曝光量达到 500 万', '季度核心活动曝光量达到 800 万'],
    ['线索转化', 30, 'MQL 到 SQL 转化率不低于 15%', '转化率不低于 22%，获客成本下降 10%'],
    ['内容产出', 30, '季度产出深度内容 8 篇', '季度产出 12 篇，其中 3 篇获行业媒体转载'],
  ],
  ops: [
    ['组织效能', 40, '关键项目里程碑达成率不低于 90%', '关键项目里程碑 100% 达成'],
    ['成本优化', 30, '年度运营成本下降 5%', '年度运营成本下降 10%'],
    ['人才梯队', 30, '关键岗位继任覆盖率不低于 70%', '关键岗位继任覆盖率不低于 90%'],
  ],
}

const TEMPLATE_BY_PERSON: Record<string, TemplateKey> = {
  p1: 'hr',
  p2: 'ops',
  p3: 'tech',
  p4: 'tech',
  p5: 'tech',
  p6: 'product',
  p7: 'market',
  p8: 'hr',
  p9: 'sales',
  p10: 'hr',
  p11: 'finance',
  p12: 'tech',
  p13: 'product',
  p14: 'tech',
  p15: 'sales',
  p16: 'market',
}

const buildKpis = (participantId: string, personId: string): KpiItem[] =>
  (KPI_TEMPLATES[TEMPLATE_BY_PERSON[personId] ?? 'tech'] ?? KPI_TEMPLATES.tech).map(
    ([name, weight, basicTarget, challengeTarget], index) => ({
      id: `${participantId}-kpi-${index + 1}`,
      name,
      weight,
      basicTarget,
      challengeTarget,
    }),
  )

const STATUS_DATES = {
  pending_submit: { updatedAt: '2026-10-15 09:00' },
  returned_submit: {
    submittedAt: '2026-10-16 14:20',
    reviewedAt: '2026-10-18 10:05',
    updatedAt: '2026-10-18 10:05',
  },
  pending_review: { submittedAt: '2026-10-20 16:40', updatedAt: '2026-10-20 16:40' },
  returned_review: {
    submittedAt: '2026-10-19 09:30',
    reviewedAt: '2026-10-24 11:00',
    updatedAt: '2026-10-24 11:00',
  },
  approved: {
    submittedAt: '2026-10-20 16:40',
    reviewedAt: '2026-10-23 15:30',
    updatedAt: '2026-10-23 15:30',
  },
  pending_confirm: { reviewedAt: '2026-10-26 17:00', updatedAt: '2026-10-26 17:00' },
  confirmed: {
    reviewedAt: '2026-10-26 17:00',
    confirmedAt: '2026-10-28 09:15',
    updatedAt: '2026-10-28 09:15',
  },
}

interface ParticipantSeed {
  personId: string
  status: Participant['status']
  reviewerId?: string
  withKpis?: boolean
  returnNote?: string
}

const makeParticipants = (
  projectId: string,
  seed: ParticipantSeed[],
  use2025Dates = false,
): Participant[] =>
  seed.map(({ personId, status, reviewerId, withKpis, returnNote }) => {
    const employee = EMPLOYEE_MAP[personId]
    const id = `${projectId}-${personId}`
    const hasKpis = withKpis ?? status !== 'pending_submit'
    const dates = STATUS_DATES[status]
    const shifted = use2025Dates
      ? Object.fromEntries(
          Object.entries(dates).map(([key, value]) => [
            key,
            value.replace('2026-', '2025-').replace('2026', '2025'),
          ]),
        )
      : dates
    return {
      id,
      employeeId: personId,
      reviewerId: reviewerId ?? employee.defaultReviewerId,
      status,
      kpis: hasKpis ? buildKpis(id, personId) : [],
      returnNote,
      ...shifted,
    }
  })

export const PROJECT_2025: Project = {
  id: 'proj-2025',
  name: '2025 年度绩效目标考核',
  year: 2025,
  status: 'ended',
  createdAt: '2025-01-06 10:00',
  createdBy: ADMIN_ID,
  startedAt: '2025-01-10',
  endedAt: '2025-12-31',
  participants: makeParticipants(
    'proj-2025',
    [
      { personId: 'p1', status: 'confirmed' },
      { personId: 'p2', status: 'confirmed' },
      { personId: 'p3', status: 'confirmed' },
      { personId: 'p4', status: 'confirmed' },
      { personId: 'p6', status: 'confirmed' },
      { personId: 'p7', status: 'confirmed' },
      { personId: 'p9', status: 'confirmed' },
    ],
    true,
  ),
}

export const PROJECT_2026: Project = {
  id: 'proj-2026',
  name: '2026 年度绩效目标考核',
  year: 2026,
  status: 'active',
  createdAt: '2026-01-05 09:30',
  createdBy: ADMIN_ID,
  startedAt: '2026-01-12',
  participants: makeParticipants('proj-2026', [
    { personId: 'p1', status: 'pending_review' },
    { personId: 'p2', status: 'pending_submit', reviewerId: 'p1' },
    { personId: 'p3', status: 'pending_submit', withKpis: false },
    { personId: 'p4', status: 'pending_review' },
    { personId: 'p5', status: 'pending_review' },
    {
      personId: 'p6',
      status: 'returned_submit',
      returnNote: '基本目标描述过于笼统，请量化到具体版本与指标后再提交。',
    },
    {
      personId: 'p7',
      status: 'returned_review',
      returnNote: '挑战目标低于当前基线，请上调后重新提交审核。',
    },
    { personId: 'p8', status: 'pending_confirm' },
    { personId: 'p9', status: 'approved' },
    { personId: 'p10', status: 'confirmed' },
    { personId: 'p11', status: 'approved' },
    { personId: 'p12', status: 'confirmed' },
  ]),
}

export const PROJECT_2027: Project = {
  id: 'proj-2027',
  name: '2027 年度 H1 绩效目标考核',
  year: 2027,
  status: 'draft',
  createdAt: '2026-10-28 15:00',
  createdBy: ADMIN_ID,
  participants: makeParticipants('proj-2027', [
    { personId: 'p1', status: 'pending_submit' },
    { personId: 'p2', status: 'pending_submit', reviewerId: 'p1' },
    { personId: 'p3', status: 'pending_submit' },
    { personId: 'p6', status: 'pending_submit' },
    { personId: 'p9', status: 'pending_submit' },
    { personId: 'p12', status: 'pending_submit' },
  ]),
}

export const MOCK_PROJECTS: Project[] = [PROJECT_2027, PROJECT_2026, PROJECT_2025]

export const ROLE_ACCOUNTS = {
  admin: { role: 'admin' as const, employeeId: ADMIN_ID },
  reviewer: { role: 'reviewer' as const, employeeId: REVIEWER_ID },
  employee: { role: 'employee' as const, employeeId: EMPLOYEE_ID },
}
