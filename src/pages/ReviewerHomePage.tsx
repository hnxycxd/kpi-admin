import { Alert, Button, Empty, Table, Tag, type TableProps } from 'antd'
import { Link } from 'react-router'
import { ProjectStatusTag } from '../components/StatusTags'
import { useKpi } from '../store/KpiStore'
import {
  DEMO_REVIEWER_ID,
  REVIEWABLE_STATUSES,
  type Member,
  type Project,
} from '../types'

interface ReviewerRecord {
  project: Project
  assigned: Member[]
  pendingReview: number
}

export default function ReviewerHomePage() {
  const { data } = useKpi()
  const person = data.roster.find((employee) => employee.id === DEMO_REVIEWER_ID)

  const records: ReviewerRecord[] = data.projects
    .map((project) => {
      const assigned = project.members.filter(
        (member) => member.reviewerId === DEMO_REVIEWER_ID,
      )
      const pendingReview =
        project.status === 'ongoing'
          ? assigned.filter((member) =>
              REVIEWABLE_STATUSES.includes(member.status),
            ).length
          : 0
      return { project, assigned, pendingReview }
    })
    .filter((record) => record.assigned.length > 0)

  const totalAssigned = records.reduce(
    (sum, record) => sum + record.assigned.length,
    0,
  )
  const totalPending = records.reduce(
    (sum, record) => sum + record.pendingReview,
    0,
  )

  const columns: TableProps<ReviewerRecord>['columns'] = [
    {
      title: '考核项目',
      width: 320,
      render: (_, record) => (
        <Link
          to={`/reviewer/projects/${record.project.id}`}
          className="font-medium text-slate-800 hover:text-blue-600"
        >
          {record.project.name}
        </Link>
      ),
    },
    {
      title: '年度',
      width: 90,
      render: (_, record) => (
        <span className="text-slate-600">{record.project.year} 年</span>
      ),
    },
    {
      title: '项目状态',
      width: 110,
      render: (_, record) => <ProjectStatusTag status={record.project.status} />,
    },
    {
      title: '我负责员工',
      width: 120,
      render: (_, record) => (
        <span className="text-slate-600">{record.assigned.length} 人</span>
      ),
    },
    {
      title: '待我审核',
      width: 120,
      render: (_, record) => (
        <span
          className={
            record.pendingReview > 0
              ? 'font-semibold text-blue-600'
              : 'text-slate-400'
          }
        >
          {record.pendingReview} 人
        </span>
      ),
    },
    {
      title: '操作',
      width: 140,
      render: (_, record) => (
        <Link to={`/reviewer/projects/${record.project.id}`}>
          <Button type="link" size="small">
            查看人员
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-800">待我审核</h2>
          <Tag color="purple">审核人 · 王强</Tag>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {person?.dept ?? '研发部'} · {person?.position ?? '研发经理'}
          ，仅展示分配给我审核的员工，可在项目内批量通过或退回。
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3">
          <div className="text-xs text-slate-400">参与项目</div>
          <div className="mt-1 text-xl font-semibold text-slate-800">
            {records.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3">
          <div className="text-xs text-slate-400">我负责员工</div>
          <div className="mt-1 text-xl font-semibold text-slate-800">
            {totalAssigned}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3">
          <div className="text-xs text-slate-400">待我审核</div>
          <div className="mt-1 text-xl font-semibold text-blue-600">
            {totalPending}
          </div>
        </div>
      </div>

      {totalPending > 0 && (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message={`有 ${totalPending} 项 KPI 等待我审核`}
          description="可进入项目人员列表逐人审核，或勾选后批量审核通过 / 退回。"
        />
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        <Table<ReviewerRecord>
          rowKey={(record) => record.project.id}
          columns={columns}
          dataSource={records}
          scroll={{ x: 900 }}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无分配给我审核的员工"
              />
            ),
          }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-400">
        说明：审核人仅能看到分配给自己审核的员工；项目结束或未启动时不可执行审核操作。
      </p>
    </div>
  )
}
