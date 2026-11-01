import { Alert, Button, Card, Empty, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { Navigate, useNavigate } from 'react-router'
import { useStore } from '../store'
import { PERSON_STATUS_META, PROJECT_STATUS_META } from '../utils/kit'
import type { Project } from '../types'

interface Row {
  project: Project
  mineCount: number
  pendingReviewCount: number
}

export default function ReviewerProjectsPage() {
  const navigate = useNavigate()
  const { state, currentUser } = useStore()

  if (!currentUser || currentUser.role !== 'reviewer') {
    return <Navigate to="/" replace />
  }

  const me = state.employees.find((e) => e.id === currentUser.employeeId)

  const myParts = state.participants.filter((p) => p.reviewerId === currentUser.employeeId)

  const rows: Row[] = state.projects
    .filter((p) => p.status !== 'pending')
    .map((project) => {
      const mine = myParts.filter((p) => p.projectId === project.id)
      return {
        project,
        mineCount: mine.length,
        pendingReviewCount: mine.filter((m) => m.status === 'toReview' || m.status === 'returnedToReview').length,
      }
    })
    .filter((r) => r.mineCount > 0)

  const myOwnTasks = state.participants
    .filter((p) => p.employeeId === currentUser.employeeId)
    .flatMap((p) => {
      const project = state.projects.find((pr) => pr.id === p.projectId)
      return project && project.status !== 'pending' ? [{ part: p, project }] : []
    })

  const columns: TableProps<Row>['columns'] = [
    {
      title: '项目名称',
      dataIndex: ['project', 'name'],
      render: (_, r) => (
        <Button type="link" className="px-0 font-medium" onClick={() => navigate(`/project/${r.project.id}`)}>
          {r.project.name}
        </Button>
      ),
    },
    { title: '考核年度', dataIndex: ['project', 'year'], width: 100, render: (v: number) => `${v} 年` },
    {
      title: '项目状态',
      dataIndex: ['project', 'status'],
      width: 100,
      render: (v: Project['status']) => <Tag color={PROJECT_STATUS_META[v].color}>{PROJECT_STATUS_META[v].label}</Tag>,
    },
    { title: '我负责的员工', dataIndex: 'mineCount', width: 130, render: (v: number) => `${v} 人` },
    {
      title: '待我审核',
      dataIndex: 'pendingReviewCount',
      width: 110,
      render: (v: number) =>
        v > 0 ? <span className="font-semibold text-orange-500">{v} 条</span> : <span className="text-gray-400">0 条</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, r) => (
        <Button type="link" size="small" className="px-0" onClick={() => navigate(`/project/${r.project.id}`)}>
          进入审核
        </Button>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1000px] space-y-4 px-6 py-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">我参与审核的项目</h2>
        <div className="mt-1 text-sm text-gray-500">当前审核人：{me?.name ?? '—'} · 仅展示您负责审核的员工</div>
      </div>

      {myOwnTasks.length > 0 && (
        <Alert
          type="info"
          showIcon
          title="您本人也参与了考核，请注意填写自己的 KPI"
          description={
            <div className="flex flex-wrap gap-2">
              {myOwnTasks.map((x) => (
                <Button
                  key={x.part.id}
                  size="small"
                  onClick={() => navigate(`/my-kpi/${x.project.id}/${x.part.id}`)}
                >
                  {x.project.name}（{PERSON_STATUS_META[x.part.status].label}）
                </Button>
              ))}
            </div>
          }
        />
      )}

      <Card>
        {rows.length > 0 ? (
          <Table<Row> rowKey={(r) => r.project.id} columns={columns} dataSource={rows} pagination={false} />
        ) : (
          <Empty description="暂无负责的审核项目">
            <Button onClick={() => navigate('/')}>返回首页</Button>
          </Empty>
        )}
      </Card>
    </div>
  )
}
