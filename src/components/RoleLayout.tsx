import { Avatar } from 'antd'
import { Link, Outlet } from 'react-router'
import { SourceFileBadge } from './SourceFileBadge'
import { useKpi } from '../store/KpiStore'
import {
  ADMIN_DEPT,
  ADMIN_NAME,
  DEMO_EMPLOYEE_ID,
  DEMO_REVIEWER_ID,
  type Role,
} from '../types'

const ROLE_META: Record<
  Role,
  {
    label: string
    color: string
    chipBg: string
    nav: { to: string; label: string }[]
  }
> = {
  admin: {
    label: '管理员 / HR',
    color: '#2563eb',
    chipBg: '#eff6ff',
    nav: [{ to: '/admin', label: '考核项目管理' }],
  },
  employee: {
    label: '填报人',
    color: '#059669',
    chipBg: '#ecfdf5',
    nav: [{ to: '/employee', label: '我的 KPI' }],
  },
  reviewer: {
    label: '审核人',
    color: '#7c3aed',
    chipBg: '#f5f3ff',
    nav: [{ to: '/reviewer', label: '待我审核' }],
  },
}

export function RoleLayout({ role }: { role: Role }) {
  const { data } = useKpi()
  const meta = ROLE_META[role]

  const identity =
    role === 'admin'
      ? { name: ADMIN_NAME, dept: ADMIN_DEPT, position: 'HR 管理员' }
      : role === 'employee'
        ? (() => {
            const person = data.roster.find((item) => item.id === DEMO_EMPLOYEE_ID)
            return {
              name: person?.name ?? '李四',
              dept: person?.dept ?? '研发部',
              position: person?.position ?? '前端工程师',
            }
          })()
        : (() => {
            const person = data.roster.find((item) => item.id === DEMO_REVIEWER_ID)
            return {
              name: person?.name ?? '王强',
              dept: person?.dept ?? '研发部',
              position: person?.position ?? '研发经理',
            }
          })()

  return (
    <div className="min-h-screen bg-slate-50/80">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold tracking-tight text-white shadow-sm">
              KPI
            </span>
            <span className="text-[15px] font-semibold text-slate-800">
              KPI 报送系统
            </span>
          </Link>

          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: meta.chipBg, color: meta.color }}
          >
            {meta.label}
          </span>

          <div className="hidden h-7 w-px bg-slate-200 lg:block" />

          {/* <nav className="flex items-center gap-1">
            {meta.nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 font-medium text-blue-600'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav> */}

          <div className="ml-auto flex items-center gap-2.5">
            {/* <ResetDemoButton compact /> */}
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2.5">
              <Avatar
                size={34}
                style={{ backgroundColor: meta.color }}
                className="shrink-0 font-medium"
              >
                {identity.name.slice(0, 1)}
              </Avatar>
              <div className="leading-tight">
                <div className="text-sm font-medium text-slate-800">
                  {identity.name}
                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                    {identity.position}
                  </span>
                </div>
                {/* <div className="text-[11px] text-slate-400">
                  {identity.dept} · {meta.label}
                </div> */}
              </div>
            </div>
            {/* <Link
              to="/"
              className="ml-1 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <ArrowLeftOutlined />
              返回入口
            </Link> */}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-360 px-5 py-6">
        <Outlet />
      </main>

      <SourceFileBadge />
    </div>
  )
}
