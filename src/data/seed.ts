import {
  SEED_VERSION,
  type AppData,
  type HrEmployee,
  type KpiItem,
  type Member,
  type MemberStatus,
  type Project,
} from '../types'

type KpiSeed = [name: string, weight: number, base: string, challenge: string]

function makeKpis(prefix: string, items: KpiSeed[]): KpiItem[] {
  return items.map(([name, weight, baseTarget, challengeTarget], index) => ({
    id: `${prefix}-${index + 1}`,
    name,
    weight,
    baseTarget,
    challengeTarget,
  }))
}

const ROSTER: HrEmployee[] = [
  {
    id: 'emp-wangqiang',
    name: '王强',
    dept: '研发部',
    position: '研发经理',
    reviewerId: null,
    isReviewer: true,
  },
  {
    id: 'emp-liuying',
    name: '刘颖',
    dept: '市场部',
    position: '市场总监',
    reviewerId: null,
    isReviewer: true,
  },
  {
    id: 'emp-lisi',
    name: '李四',
    dept: '研发部',
    position: '前端工程师',
    reviewerId: 'emp-wangqiang',
  },
  {
    id: 'emp-zhangsan',
    name: '张三',
    dept: '研发部',
    position: '后端工程师',
    reviewerId: 'emp-wangqiang',
  },
  {
    id: 'emp-wangwu',
    name: '王五',
    dept: '研发部',
    position: '测试工程师',
    reviewerId: 'emp-wangqiang',
  },
  {
    id: 'emp-zhaoliu',
    name: '赵六',
    dept: '研发部',
    position: '产品经理',
    reviewerId: 'emp-wangqiang',
  },
  {
    id: 'emp-wujiu',
    name: '吴九',
    dept: '研发部',
    position: '运维工程师',
    reviewerId: 'emp-wangqiang',
  },
  {
    id: 'emp-zhengshi',
    name: '郑十',
    dept: '研发部',
    position: '架构师',
    reviewerId: 'emp-wangqiang',
  },
  {
    id: 'emp-zhouba',
    name: '周八',
    dept: '研发部',
    position: '数据分析师',
    reviewerId: 'emp-wangqiang',
  },
  {
    id: 'emp-sunqi',
    name: '孙七',
    dept: '市场部',
    position: '市场专员',
    reviewerId: 'emp-liuying',
  },
  {
    id: 'emp-chenyi',
    name: '陈一',
    dept: '市场部',
    position: '内容运营',
    reviewerId: 'emp-liuying',
  },
  {
    id: 'emp-liner',
    name: '林二',
    dept: '市场部',
    position: '渠道经理',
    reviewerId: 'emp-liuying',
  },
]

function employee(id: string): HrEmployee {
  const found = ROSTER.find((item) => item.id === id)
  if (!found) throw new Error(`Unknown seed employee: ${id}`)
  return found
}

function makeMember(
  id: string,
  employeeId: string,
  reviewerId: string | null,
  status: MemberStatus,
  kpis: KpiItem[],
  updatedAt: string,
  returnNote?: string,
): Member {
  const person = employee(employeeId)
  return {
    id,
    employeeId: person.id,
    name: person.name,
    dept: person.dept,
    position: person.position,
    reviewerId,
    kpis,
    status,
    returnNote,
    updatedAt,
  }
}

const devKpis = (prefix: string) =>
  makeKpis(prefix, [
    ['需求交付及时率', 40, '≥ 90%', '≥ 98%'],
    ['线上缺陷率', 35, '≤ 0.5%', '≤ 0.2%'],
    ['代码评审覆盖率', 25, '≥ 80%', '≥ 95%'],
  ])

const backendKpis = (prefix: string) =>
  makeKpis(prefix, [
    ['接口可用率', 40, '≥ 99.9%', '≥ 99.99%'],
    ['需求按时交付率', 35, '≥ 90%', '≥ 98%'],
    ['线上故障处理时长', 25, '≤ 2 小时', '≤ 30 分钟'],
  ])

const qaKpis = (prefix: string) =>
  makeKpis(prefix, [
    ['测试用例覆盖率', 40, '≥ 85%', '≥ 95%'],
    ['线上漏测率', 35, '≤ 2%', '≤ 0.5%'],
    ['缺陷闭环及时率', 25, '≥ 90%', '≥ 98%'],
  ])

const productKpis = (prefix: string) =>
  makeKpis(prefix, [
    ['版本需求按时上线率', 40, '≥ 90%', '≥ 98%'],
    ['需求变更率', 30, '≤ 10%', '≤ 5%'],
    ['内部用户满意度', 30, '≥ 4.2 分', '≥ 4.6 分'],
  ])

const opsKpis = (prefix: string) =>
  makeKpis(prefix, [
    ['核心系统可用性', 40, '≥ 99.9%', '≥ 99.99%'],
    ['故障平均恢复时长', 30, '≤ 30 分钟', '≤ 10 分钟'],
    ['安全漏洞修复及时率', 30, '≥ 95%', '100%'],
  ])

const architectKpis = (prefix: string) =>
  makeKpis(prefix, [
    ['架构方案按期交付率', 40, '≥ 90%', '100%'],
    ['技术评审一次通过率', 35, '≥ 80%', '≥ 95%'],
    ['重点项目技术风险闭环', 25, '≥ 90%', '100%'],
  ])

const dataKpis = (prefix: string) =>
  makeKpis(prefix, [
    ['数据报表交付及时率', 40, '≥ 95%', '100%'],
    ['数据准确率', 35, '≥ 99%', '≥ 99.9%'],
    ['分析结论采纳率', 25, '≥ 60%', '≥ 80%'],
  ])

const marketKpis = (prefix: string) =>
  makeKpis(prefix, [
    ['市场活动达成率', 40, '≥ 90%', '≥ 110%'],
    ['有效线索转化率', 35, '≥ 15%', '≥ 25%'],
    ['品牌内容传播量', 25, '≥ 50 万', '≥ 100 万'],
  ])

const projects: Project[] = [
  {
    id: 'proj-2026-core',
    name: '2026年度核心岗位绩效考核',
    year: 2026,
    status: 'ongoing',
    startDate: '2026-10-08',
    creator: '张敏',
    members: [
      makeMember(
        'mem-2026-lisi',
        'emp-lisi',
        'emp-wangqiang',
        'pending_submit',
        [],
        '2026-10-28 10:20',
      ),
      makeMember(
        'mem-2026-zhangsan',
        'emp-zhangsan',
        'emp-wangqiang',
        'pending_review',
        backendKpis('p1-zhangsan'),
        '2026-10-30 09:30',
      ),
      makeMember(
        'mem-2026-wangwu',
        'emp-wangwu',
        'emp-wangqiang',
        'returned_submit',
        qaKpis('p1-wangwu'),
        '2026-10-29 15:40',
        '挑战目标缺少量化标准，请补充测试覆盖目标后重新提交。',
      ),
      makeMember(
        'mem-2026-zhaoliu',
        'emp-zhaoliu',
        'emp-wangqiang',
        'approved',
        productKpis('p1-zhaoliu'),
        '2026-10-29 17:10',
      ),
      makeMember(
        'mem-2026-wujiu',
        'emp-wujiu',
        'emp-wangqiang',
        'returned_review',
        opsKpis('p1-wujiu'),
        '2026-10-30 10:40',
        '目标权重分配需复核，请审核人确认后再提交确认。',
      ),
      makeMember(
        'mem-2026-zhengshi',
        'emp-zhengshi',
        'emp-wangqiang',
        'pending_confirm',
        architectKpis('p1-zhengshi'),
        '2026-10-30 11:00',
      ),
      makeMember(
        'mem-2026-zhouba',
        'emp-zhouba',
        'emp-wangqiang',
        'confirmed',
        dataKpis('p1-zhouba'),
        '2026-10-28 14:00',
      ),
      makeMember(
        'mem-2026-sunqi',
        'emp-sunqi',
        'emp-liuying',
        'pending_review',
        marketKpis('p1-sunqi'),
        '2026-10-30 10:05',
      ),
    ],
  },
  {
    id: 'proj-2025-all',
    name: '2025年度绩效考核（已归档）',
    year: 2025,
    status: 'ended',
    startDate: '2025-03-10',
    creator: '张敏',
    members: [
      makeMember(
        'mem-2025-lisi',
        'emp-lisi',
        'emp-wangqiang',
        'confirmed',
        devKpis('p2-lisi'),
        '2025-06-18 16:30',
      ),
      makeMember(
        'mem-2025-zhangsan',
        'emp-zhangsan',
        'emp-wangqiang',
        'confirmed',
        backendKpis('p2-zhangsan'),
        '2025-06-18 16:30',
      ),
      makeMember(
        'mem-2025-sunqi',
        'emp-sunqi',
        'emp-liuying',
        'confirmed',
        marketKpis('p2-sunqi'),
        '2025-06-18 16:30',
      ),
      makeMember(
        'mem-2025-zhouba',
        'emp-zhouba',
        'emp-wangqiang',
        'confirmed',
        dataKpis('p2-zhouba'),
        '2025-06-18 16:30',
      ),
    ],
  },
  {
    id: 'proj-2026-market',
    name: '2026年度市场部绩效考核',
    year: 2026,
    status: 'pending',
    startDate: null,
    creator: '张敏',
    members: [
      makeMember(
        'mem-market-sunqi',
        'emp-sunqi',
        'emp-liuying',
        'pending_submit',
        [],
        '2026-10-25 09:00',
      ),
      makeMember(
        'mem-market-chenyi',
        'emp-chenyi',
        'emp-liuying',
        'pending_submit',
        [],
        '2026-10-25 09:00',
      ),
      makeMember(
        'mem-market-liner',
        'emp-liner',
        'emp-liuying',
        'pending_submit',
        [],
        '2026-10-25 09:00',
      ),
    ],
  },
]

export function createSeedData(): AppData {
  return {
    seedVersion: SEED_VERSION,
    projects: structuredClone(projects),
    roster: structuredClone(ROSTER),
  }
}
