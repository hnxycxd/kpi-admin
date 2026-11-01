import { App as AntdApp, Button, Dropdown, Popconfirm, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router'
import { useStore } from '../store'
import { PERSON_STATUS_META } from '../utils/kit'

const ROLE_LABEL = { admin: '管理员', reviewer: '审核人', filler: '填报人' } as const

const ROLE_COLOR = { admin: 'geekblue', reviewer: 'gold', filler: 'blue' } as const

export default function AppHeader() {
  const navigate = useNavigate()
  const { state, currentUser, resetDemo } = useStore()
  const { message } = AntdApp.useApp()
  if (!currentUser) return null

  const me = state.employees.find((e) => e.id === currentUser.employeeId)

  const myItems = state.participants
    .filter((p) => p.employeeId === currentUser.employeeId)
    .flatMap((p) => {
      const project = state.projects.find((pr) => pr.id === p.projectId)
      return project && project.status !== 'pending' ? [{ part: p, project }] : []
    })

  const menuProps: MenuProps = {
    items: myItems.length
      ? myItems.map((x) => ({
          key: x.part.id,
          label: `${x.project.name} · ${PERSON_STATUS_META[x.part.status].label}`,
        }))
      : [{ key: 'empty', label: '暂无考核任务', disabled: true }],
    onClick: (info) => {
      const item = myItems.find((x) => x.part.id === info.key)
      if (item) navigate(`/my-kpi/${item.project.id}/${item.part.id}`)
    },
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
        <button type="button" className="cursor-pointer text-base font-semibold text-gray-900" onClick={() => navigate('/')}>
          KPI 报送系统
        </button>
        <div className="flex items-center gap-3">
          <Dropdown menu={menuProps} placement="bottomRight" disabled={myItems.length === 0}>
            <Button size="small">我的 KPI</Button>
          </Dropdown>
          <span className="text-sm text-gray-500">{me?.name ?? '未知用户'}</span>
          <Tag color={ROLE_COLOR[currentUser.role]}>{ROLE_LABEL[currentUser.role]}</Tag>
          <Popconfirm
            title="重置后将恢复初始演示数据"
            onConfirm={() => {
              resetDemo()
              message.success('已重置演示数据')
              navigate('/')
            }}
          >
            <Button size="small">重置演示数据</Button>
          </Popconfirm>
        </div>
      </div>
    </header>
  )
}
