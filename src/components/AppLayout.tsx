import { App, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  DownOutlined,
  LogoutOutlined,
  ProjectOutlined,
  ReloadOutlined,
  TeamOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useAppStore } from '../store/AppStore'
import type { Role } from '../types'
import { ROLE_HOME, ROLE_LABEL, ROLE_META, ROLE_ORDER, getRoleEmployee } from '../lib/roles'
import { PersonAvatar } from './PersonAvatar'

const NAV_ITEMS = [
  { key: 'projects', label: '考核项目管理', path: '/projects', icon: <ProjectOutlined /> },
  { key: 'people', label: '考核人员', path: '/people', icon: <TeamOutlined /> },
  { key: 'my', label: '我的考核', path: '/my-kpi', icon: <FileTextOutlined /> },
]

export function AppLayout() {
  const { role, me, enter, exit, reset } = useAppStore()
  const { modal, message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()

  if (!role || !me) return <Navigate to="/" replace />

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.key === 'projects') return role === 'admin'
    if (item.key === 'people') return role === 'admin' || role === 'reviewer'
    return true
  })

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  const switchRole = (next: Role) => {
    enter(next)
    navigate(ROLE_HOME[next])
  }

  const confirmReset = () => {
    modal.confirm({
      title: '重置演示数据',
      content: '将恢复初始的项目、人员与 KPI 数据，本次演示中的填报、审核、确认操作都会清空。',
      okText: '重置数据',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        reset()
        message.success('演示数据已重置')
      },
    })
  }

  const menuItems: MenuProps['items'] = [
    ...ROLE_ORDER.map((itemRole) => {
      const person = getRoleEmployee(itemRole)
      const current = itemRole === role
      return {
        key: `role-${itemRole}`,
        label: current
          ? `当前身份：${ROLE_LABEL[itemRole]} · ${person.name}`
          : `切换到${ROLE_LABEL[itemRole]} · ${person.name}`,
        disabled: current,
        onClick: () => switchRole(itemRole),
      }
    }),
    { type: 'divider' as const },
    {
      key: 'entry',
      icon: <LogoutOutlined />,
      label: '返回角色入口',
      onClick: () => {
        exit()
        navigate('/')
      },
    },
    {
      key: 'reset',
      icon: <ReloadOutlined />,
      label: '重置演示数据',
      danger: true,
      onClick: confirmReset,
    },
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to={ROLE_HOME[role]} className="brand">
            <span className="brand-mark" aria-hidden>
              <svg viewBox="0 0 32 32" width="18" height="18" fill="none">
                <rect x="5" y="19" width="4" height="8" rx="1" fill="currentColor" opacity=".55" />
                <rect x="14" y="13" width="4" height="14" rx="1" fill="currentColor" opacity=".8" />
                <rect x="23" y="7" width="4" height="20" rx="1" fill="currentColor" />
              </svg>
            </span>
            <span className="brand-text">
              <strong>KPI 报送系统</strong>
              <small>绩效目标管理</small>
            </span>
          </Link>

          <nav className="nav" aria-label="主导航">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`nav-link${isActive(item.path) ? ' is-active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="topbar-actions">
            <span className="env-chip">演示环境</span>
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
              <button type="button" className="user-chip" aria-label="切换角色或重置演示数据">
                <PersonAvatar name={me.name} size="sm" />
                <span className="user-chip-text">
                  <strong>{me.name}</strong>
                  <small>{ROLE_LABEL[role]}</small>
                </span>
                <DownOutlined className="user-chip-caret" />
              </button>
            </Dropdown>
          </div>
        </div>
      </header>

      <main className="page">
        <div className="page-inner">
          <Outlet />
        </div>
      </main>

      <footer className="app-foot">
        <span>KPI 报送系统 · 演示数据仅保存在当前会话</span>
        <span>{ROLE_META[role].dept} · {ROLE_META[role].position}</span>
      </footer>
    </div>
  )
}
