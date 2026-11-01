import type { ReactNode } from 'react'
import { ArrowRightOutlined, AuditOutlined, FormOutlined, ProjectOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useAppStore } from '../store/AppStore'
import { ROLE_HOME, ROLE_META, ROLE_ORDER } from '../lib/roles'
import type { Role } from '../types'

const ROLE_ICONS: Record<Role, ReactNode> = {
  admin: <ProjectOutlined />,
  reviewer: <AuditOutlined />,
  employee: <FormOutlined />,
}

const FLOW_STEPS = [
  { no: '01', title: '填报', status: '待提交' },
  { no: '02', title: '审核', status: '待审核' },
  { no: '03', title: '发起确认', status: '审核通过' },
  { no: '04', title: '员工确认', status: '已确认' },
]

export function EntryPage() {
  const { enter } = useAppStore()
  const navigate = useNavigate()

  const go = (role: Role) => {
    enter(role)
    navigate(ROLE_HOME[role])
  }

  const now = new Date()

  return (
    <div className="entry">
      <div className="entry-grid" aria-hidden />
      <header className="entry-top">
        <div className="brand">
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
        </div>
        <div className="entry-top-right">
          <span className="env-chip">内部演示</span>
          <span className="entry-date">
            {now.getFullYear()} · {String(now.getMonth() + 1).padStart(2, '0')}
          </span>
        </div>
      </header>

      <main className="entry-main">
        <section className="entry-intro">
          <div className="entry-eyebrow">
            <span className="eyebrow-rule" aria-hidden />
            年度绩效目标管理
          </div>
          <h1 className="entry-title">
            KPI
            <span>报送系统</span>
          </h1>
          <p className="entry-lede">
            从目标填报、直属审核到员工确认，用一套清晰的状态流转，串起管理员、审核人与填报人的协作。
          </p>

          <div className="flow-rail" aria-label="考核流程">
            {FLOW_STEPS.map((step, index) => (
              <div className="flow-step" key={step.no}>
                <span className="flow-no">{step.no}</span>
                <strong>{step.title}</strong>
                <small>{step.status}</small>
                {index < FLOW_STEPS.length - 1 ? <span className="flow-arrow">→</span> : null}
              </div>
            ))}
          </div>

          <div className="entry-note">
            演示数据保存在当前会话，刷新页面会恢复初始状态。
          </div>
        </section>

        <section className="entry-roles" aria-label="角色入口">
          <div className="entry-roles-head">
            <strong>选择入口</strong>
            <span>3 个角色 · 同一套考核数据</span>
          </div>

          <div className="role-list">
            {ROLE_ORDER.map((role, index) => {
              const meta = ROLE_META[role]
              return (
                <button
                  key={role}
                  type="button"
                  className="role-card"
                  style={{ animationDelay: `${index * 70}ms` }}
                  onClick={() => go(role)}
                >
                  <span className="role-index">0{index + 1}</span>
                  <span className="role-icon" aria-hidden>
                    {ROLE_ICONS[role]}
                  </span>
                  <span className="role-body">
                    <span className="role-head">
                      <strong>{meta.label}</strong>
                      <span className="role-person">
                        {meta.name} · {meta.position}
                      </span>
                    </span>
                    <span className="role-intro">{meta.intro}</span>
                    <span className="role-perms">
                      {meta.permissions.map((permission) => (
                        <span key={permission}>{permission}</span>
                      ))}
                    </span>
                  </span>
                  <span className="role-arrow" aria-hidden>
                    <ArrowRightOutlined />
                  </span>
                </button>
              )
            })}
          </div>

          <div className="entry-roles-foot">
            已内置 2025 已结束、2026 进行中、2027 待启动三个项目，覆盖全部 6 种人员状态。
          </div>
        </section>
      </main>

      <footer className="entry-foot">
        <span>KPI 报送系统 · 年度绩效目标管理</span>
        <span>填报 → 审核 → 确认</span>
      </footer>
    </div>
  )
}
