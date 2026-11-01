import type { AppState, Employee, KpiItem, Participant, Project } from '../types'

export const ADMIN_ID = 'e01'
export const REVIEWER_IDS = ['e02', 'e03']

/** 导入人员时按部门默认分配审核人 */
const DEPARTMENT_REVIEWER: Record<string, string> = {
  技术部: 'e02',
  人事部: 'e02',
  财务部: 'e02',
  产品部: 'e03',
  市场部: 'e03',
}

export function defaultReviewerFor(employee: Employee): string {
  const mapped = DEPARTMENT_REVIEWER[employee.department] ?? 'e02'
  if (mapped === employee.id) {
    // 部门默认审核人本人被考核时，分配另一位审核人
    return mapped === 'e02' ? 'e03' : 'e02'
  }
  return mapped
}

const employees: Employee[] = [
  { id: 'e01', name: '王敏', department: '人事部', position: 'HR 经理' },
  { id: 'e02', name: '李建国', department: '技术部', position: '技术总监' },
  { id: 'e03', name: '陈静', department: '产品部', position: '产品总监' },
  { id: 'e04', name: '张伟', department: '技术部', position: '前端工程师' },
  { id: 'e05', name: '刘洋', department: '技术部', position: '后端工程师' },
  { id: 'e06', name: '赵蕾', department: '产品部', position: '产品专员' },
  { id: 'e07', name: '孙浩', department: '产品部', position: '产品经理' },
  { id: 'e08', name: '周婷', department: '市场部', position: '市场专员' },
  { id: 'e09', name: '吴倩', department: '市场部', position: '市场经理' },
  { id: 'e10', name: '郑强', department: '财务部', position: '财务专员' },
  { id: 'e11', name: '林晓', department: '技术部', position: '前端实习生' },
  { id: 'e12', name: '何雨', department: '产品部', position: '产品助理' },
  { id: 'e13', name: '高翔', department: '市场部', position: '市场助理' },
  { id: 'e14', name: '马涛', department: '技术部', position: '测试工程师' },
  { id: 'e15', name: '许悦', department: '产品部', position: 'UI 设计师' },
  { id: 'e16', name: '韩磊', department: '财务部', position: '会计' },
  { id: 'e17', name: '宋佳', department: '人事部', position: '招聘专员' },
  { id: 'e18', name: '唐明', department: '市场部', position: '新媒体运营' },
  { id: 'e19', name: '冯雪', department: '技术部', position: '算法工程师' },
  { id: 'e20', name: '曹阳', department: '财务部', position: '出纳' },
]

const projects: Project[] = [
  {
    id: 'p1',
    name: '2026 年度绩效考核',
    year: 2026,
    status: 'active',
    creatorId: 'e01',
    createdAt: '2026-10-20',
    startedAt: '2026-10-25',
  },
  {
    id: 'p2',
    name: '2026 Q4 新员工考核',
    year: 2026,
    status: 'pending',
    creatorId: 'e01',
    createdAt: '2026-10-28',
  },
  {
    id: 'p3',
    name: '2025 年度绩效考核',
    year: 2025,
    status: 'ended',
    creatorId: 'e01',
    createdAt: '2025-01-06',
    startedAt: '2025-01-10',
    endedAt: '2025-03-01',
  },
]

let kpiSeq = 0

function k(name: string, weight: number, basicTarget: string, challengeTarget: string): KpiItem {
  kpiSeq += 1
  return { id: `mk${kpiSeq}`, name, weight, basicTarget, challengeTarget }
}

function pt(
  id: string,
  employeeId: string,
  projectId: string,
  reviewerId: string,
  status: Participant['status'],
  kpis: KpiItem[],
  extra?: Pick<Participant, 'returnNote' | 'returnedBy'>,
): Participant {
  return { id, employeeId, projectId, reviewerId, status, kpis, ...extra }
}

const participants: Participant[] = [
  // ===== p1 · 2026 年度绩效考核（进行中，9 人覆盖全部 7 种状态）=====
  pt('pt101', 'e01', 'p1', 'e02', 'toSubmit', []),
  pt('pt102', 'e02', 'p1', 'e03', 'toSubmit', []),
  pt('pt103', 'e04', 'p1', 'e02', 'returnedToSubmit', [
    k('前端页面性能优化', 30, '首屏加载时间 ≤ 2.0s', '首屏加载时间 ≤ 1.2s'),
    k('通用组件库建设', 30, '沉淀 20 个通用组件', '沉淀 35 个组件并被 3 个以上项目复用'),
    k('线上缺陷修复及时率', 40, '≥ 90%', '≥ 98%'),
  ], { returnNote: '挑战目标设定偏保守，请结合部门 OKR 校准后重新提交。', returnedBy: 'reviewer' }),
  pt('pt104', 'e05', 'p1', 'e02', 'toReview', [
    k('订单接口平均响应时间', 40, '≤ 300ms', '≤ 150ms'),
    k('核心服务可用性', 30, '99.9%', '99.95%'),
    k('单元测试覆盖率', 30, '≥ 70%', '≥ 85%'),
  ]),
  pt('pt105', 'e06', 'p1', 'e03', 'returnedToReview', [
    k('需求文档按时交付率', 40, '≥ 90%', '100%'),
    k('需求返工率', 30, '≤ 10%', '≤ 5%'),
    k('跨部门协作满意度', 30, '≥ 4.0 分', '≥ 4.5 分'),
  ], { returnNote: '权重分配需与部门年度目标对齐，请重新审核。', returnedBy: 'admin' }),
  pt('pt106', 'e07', 'p1', 'e03', 'approved', [
    k('产品版本按时上线率', 40, '≥ 90%', '100%'),
    k('重点功能用户采纳率', 30, '≥ 60%', '≥ 75%'),
    k('用户反馈闭环处理率', 30, '≥ 95%', '100%'),
  ]),
  pt('pt107', 'e08', 'p1', 'e03', 'toConfirm', [
    k('品牌活动执行', 40, '完成 4 场活动', '完成 6 场并产出 2 个标杆案例'),
    k('新媒体粉丝增长', 30, '+20%', '+50%'),
    k('市场线索转化率', 30, '≥ 8%', '≥ 12%'),
  ]),
  pt('pt108', 'e09', 'p1', 'e03', 'confirmed', [
    k('全年市场费用控制', 40, '预算内', '节省 5% 以上'),
    k('渠道合作拓展', 30, '新增 5 家渠道', '新增 10 家渠道'),
    k('团队人效提升', 30, '+10%', '+20%'),
  ]),
  pt('pt109', 'e10', 'p1', 'e02', 'confirmed', [
    k('月度结账及时率', 40, '按时完成', '提前 2 个工作日'),
    k('财务报表差错率', 30, '≤ 1%', '0 差错'),
    k('费用报销审核时效', 30, '≤ 3 个工作日', '≤ 1 个工作日'),
  ]),

  // ===== p2 · 2026 Q4 新员工考核（待启动，用于验收 导入 → 启动 流程）=====
  pt('pt201', 'e11', 'p2', 'e02', 'toSubmit', []),
  pt('pt202', 'e12', 'p2', 'e03', 'toSubmit', []),
  pt('pt203', 'e13', 'p2', 'e03', 'toSubmit', []),

  // ===== p3 · 2025 年度绩效考核（已结束，只读）=====
  pt('pt301', 'e14', 'p3', 'e02', 'confirmed', [
    k('接口自动化覆盖率', 50, '≥ 60%', '≥ 75%'),
    k('缺陷回归及时率', 50, '≥ 95%', '100%'),
  ]),
  pt('pt302', 'e15', 'p3', 'e03', 'confirmed', [
    k('设计规范落地', 40, '覆盖 8 条产品线', '覆盖 12 条产品线'),
    k('设计稿一次通过率', 60, '≥ 80%', '≥ 90%'),
  ]),
  pt('pt303', 'e16', 'p3', 'e02', 'confirmed', [
    k('月度结账及时率', 50, '按时完成', '提前 2 个工作日'),
    k('报表差错率', 50, '≤ 1%', '0 差错'),
  ]),
  pt('pt304', 'e17', 'p3', 'e02', 'confirmed', [
    k('核心岗位到面率', 50, '≥ 70%', '≥ 85%'),
    k('平均招聘周期', 50, '≤ 35 天', '≤ 25 天'),
  ]),
  pt('pt305', 'e18', 'p3', 'e03', 'confirmed', [
    k('账号粉丝增长', 40, '+30%', '+60%'),
    k('内容爆款数', 30, '≥ 2 篇', '≥ 5 篇'),
    k('活动线索转化率', 30, '≥ 5%', '≥ 10%'),
  ]),
]

const seed: AppState = { employees, projects, participants }

/** 每次重置都返回全新的深拷贝，避免多次演示之间互相污染 */
export function buildSeedState(): AppState {
  return JSON.parse(JSON.stringify(seed)) as AppState
}
