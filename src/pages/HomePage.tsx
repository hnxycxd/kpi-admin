import { App as AntdApp, Button, Card, Modal, Popconfirm, Tag } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from '../store'
import { ADMIN_ID, REVIEWER_IDS } from '../data/mock'
import { PERSON_STATUS_META } from '../utils/kit'
import type { Employee, Role } from '../types'

interface RoleCard {
  role: Role
  badge: string
  badgeClass: string
  title: string
  desc: string
  points: string[]
}

const ROLE_CARDS: RoleCard[] = [
  {
    role: 'admin',
    badge: '管',
    badgeClass: 'bg-blue-100 text-blue-600',
    title: '管理员 / HR',
    desc: '初始化考核项目与人员信息，启动 / 结束项目',
    points: ['从人事档案导入考核人员', '批量催办 · 发起确认 · 退回', '总览完成率与待办数据', '可修改任意员工的审核人'],
  },
  {
    role: 'reviewer',
    badge: '审',
    badgeClass: 'bg-amber-100 text-amber-600',
    title: '审核人',
    desc: '审核员工 KPI，可增删改指标后通过或退回',
    points: ['批量审核通过 / 退回（可填退回说明）', '只看到自己负责的员工', '本人也在考核名单中，需填写自己的 KPI'],
  },
  {
    role: 'filler',
    badge: '填',
    badgeClass: 'bg-green-100 text-green-600',
    title: '填报人',
    desc: '填报并提交 KPI，确认审核结果',
    points: ['默认 3 条空指标，可增删改', '权重合计 100% 才能提交', '被退回后修改重新提交', '审核通过后确认完成考核'],
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { state, setUser, resetDemo } = useStore()
  const { message } = AntdApp.useApp()
  const [pickRole, setPickRole] = useState<Role | null>(null)

  const reviewers = state.employees.filter((e) => REVIEWER_IDS.includes(e.id))
  const fillers = state.participants.flatMap((p) => {
    const project = state.projects.find((pr) => pr.id === p.projectId)
    const emp = state.employees.find((e) => e.id === p.employeeId)
    return project && emp && project.status !== 'pending' ? [{ part: p, project, emp }] : []
  })

  const enterAsAdmin = () => {
    setUser({ employeeId: ADMIN_ID, role: 'admin' })
    navigate('/admin')
  }

  const pickReviewer = (e: Employee) => {
    setUser({ employeeId: e.id, role: 'reviewer' })
    setPickRole(null)
    navigate('/reviewer')
  }

  const pickFiller = (item: (typeof fillers)[number]) => {
    setUser({ employeeId: item.emp.id, role: 'filler' })
    setPickRole(null)
    navigate(`/my-kpi/${item.project.id}/${item.part.id}`)
  }

  const handleCardClick = (role: Role) => {
    if (role === 'admin') enterAsAdmin()
    else setPickRole(role)
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">KPI 报送系统</h1>
        <p className="mt-2 text-sm text-gray-500">
          考核项目 · KPI 填报 · 审核 · 员工确认 全流程演示原型（飞书消息为轻量模拟提示）
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
          <span>演示数据保存在浏览器 localStorage 中，可随时重置</span>
          <Popconfirm
            title="重置后将恢复初始演示数据"
            onConfirm={() => {
              resetDemo()
              message.success('已重置演示数据')
            }}
          >
            <Button size="small">重置演示数据</Button>
          </Popconfirm>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ROLE_CARDS.map((card) => (
          <Card
            key={card.role}
            hoverable
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => handleCardClick(card.role)}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold ${card.badgeClass}`}>
                {card.badge}
              </div>
              <div>
                <div className="text-base font-semibold text-gray-900">{card.title}</div>
                <div className="mt-0.5 text-xs text-gray-500">{card.desc}</div>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-gray-600">
              {card.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                  {point}
                </li>
              ))}
            </ul>
            <Button type="primary" block className="mt-4">
              进入
            </Button>
          </Card>
        ))}
      </div>

      <Card size="small" className="mt-6">
        <div className="text-sm font-medium text-gray-700">验收路径建议</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>管理员进入「2026 Q4 新员工考核」（待启动）：导入人员 → 启动项目（全员进入「待提交」）。</li>
          <li>填报人入口选择新员工：填写 3 条 KPI（权重合计 100%）→ 提交，消息提示已发送给审核人。</li>
          <li>审核人入口（李建国）：通过 / 退回（退回则回到第 2 步，可看到退回说明）。</li>
          <li>管理员：批量发起员工确认 / 退回（退回后回到审核环节）。</li>
          <li>填报人确认 → 状态「已确认」，完成率动态更新。</li>
          <li>「2026 年度绩效考核」已预置全部 7 种状态，可直接体验各环节。</li>
        </ol>
      </Card>

      <Modal
        title={pickRole === 'reviewer' ? '选择审核人' : '选择填报人'}
        open={pickRole !== null}
        footer={null}
        onCancel={() => setPickRole(null)}
        width={560}
      >
        {pickRole === 'reviewer' ? (
          <div className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto">
            {reviewers.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{e.name}</div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {e.department} · {e.position}
                  </div>
                </div>
                <Button type="primary" size="small" onClick={() => pickReviewer(e)}>
                  选择
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto">
            {fillers.map((item) => (
              <div key={item.part.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    {item.emp.name}
                    <Tag color={PERSON_STATUS_META[item.part.status].color}>
                      {PERSON_STATUS_META[item.part.status].label}
                    </Tag>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {item.emp.department} · {item.emp.position} · {item.project.name}
                  </div>
                </div>
                <Button type="primary" size="small" onClick={() => pickFiller(item)}>
                  选择
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
