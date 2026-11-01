import {
  ApartmentOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { ResetDemoButton } from '../components/ResetDemoButton'
import { SourceFileBadge } from '../components/SourceFileBadge'

interface RoleEntry {
  key: string
  to: string
  label: string
  name: string
  meta: string
  description: string
  features: string[]
  color: string
  softColor: string
  icon: ReactNode
}

const ROLE_ENTRIES: RoleEntry[] = [
  {
    key: 'admin',
    to: '/admin',
    label: '管理员 / HR',
    name: '张敏',
    meta: '人力资源部',
    description: '创建考核项目、配置参与人员与审核人，掌控全流程节奏。',
    features: ['项目管理与人员导入', '催办、发起确认与退回', '完成率实时统计'],
    color: '#2563eb',
    softColor: '#eff6ff',
    icon: <ApartmentOutlined />,
  },
  {
    key: 'employee',
    to: '/employee',
    label: '填报人',
    name: '李四',
    meta: '研发部 · 前端工程师',
    description: '填写并提交个人 KPI，接收退回意见，确认最终考核结果。',
    features: ['默认 3 项 KPI', '权重合计校验', '撤回意见与结果确认'],
    color: '#059669',
    softColor: '#ecfdf5',
    icon: <EditOutlined />,
  },
  {
    key: 'reviewer',
    to: '/reviewer',
    label: '审核人',
    name: '王强',
    meta: '研发部 · 研发经理',
    description: '审核我负责员工的 KPI，可调整内容、批量通过或退回。',
    features: ['仅展示我负责的员工', '在线修改 KPI', '批量通过 / 退回'],
    color: '#7c3aed',
    softColor: '#f5f3ff',
    icon: <AuditOutlined />,
  },
]

function RoleCard({ entry }: { entry: RoleEntry }) {
  return (
    <Link
      to={entry.to}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.28)]"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-90"
        style={{ backgroundColor: entry.color }}
      />
      <div className="flex items-center justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: entry.softColor, color: entry.color }}
        >
          {entry.icon}
        </div>
        <ArrowRightOutlined className="text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-slate-500" />
      </div>

      <div className="mt-5">
        <div
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: entry.color }}
        >
          {entry.label}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-semibold text-slate-800">{entry.name}</span>
          <span className="text-xs text-slate-400">{entry.meta}</span>
        </div>
        <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-500">
          {entry.description}
        </p>
      </div>

      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
        {entry.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-[13px] text-slate-600">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {feature}
          </li>
        ))}
      </ul>

      <div
        className="mt-5 flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: entry.color }}
      >
        进入工作台
        <ArrowRightOutlined className="text-xs transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <header className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold tracking-tight text-white shadow-sm">
            KPI
          </span>
          <div>
            <div className="text-[15px] font-semibold text-slate-800">KPI 报送系统</div>
            <div className="text-[11px] text-slate-400">Performance Review Workspace</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
            演示环境 · 本地模拟数据
          </span> */}
          <ResetDemoButton compact />
        </div>
      </header>

      <main className="mx-auto max-w-300 px-5 pb-16">
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">选择角色入口</h2>
      
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {ROLE_ENTRIES.map((entry) => (
              <RoleCard key={entry.key} entry={entry} />
            ))}
          </div>
        </section>

    
      </main>

      <SourceFileBadge />
    </div>
  )
}
