import {
  Alert,
  Button,
  Empty,
  Table,
  type TableProps,
} from 'antd'
import { Link } from 'react-router'
import { MemberStatusTag, ProjectStatusTag } from '../components/StatusTags'
import { useKpi } from '../store/KpiStore'
import {
  DEMO_EMPLOYEE_ID,
  EMPLOYEE_EDITABLE_STATUSES,
  getReviewerName,
  type Member,
  type Project,
} from '../types'

interface EmployeeRecord {
  project: Project
  member: Member
}

export default function EmployeeHomePage() {
  const { data } = useKpi()

  const records: EmployeeRecord[] = data.projects
    .map((project) => ({
      project,
      member: project.members.find(
        (member) => member.employeeId === DEMO_EMPLOYEE_ID,
      ),
    }))
    .filter((item): item is EmployeeRecord => Boolean(item.member))

  const returned = records.filter(
    (record) => record.member.status === 'returned_submit',
  )

  const getActionLabel = (record: EmployeeRecord) => {
    if (record.project.status !== 'ongoing') return '查看'
    if (EMPLOYEE_EDITABLE_STATUSES.includes(record.member.status)) {
      return record.member.status === 'returned_submit'
        ? '修改并重新提交'
        : '去填报'
    }
    if (record.member.status === 'pending_confirm') return '去确认'
    return '查看'
  }

  const columns: TableProps<EmployeeRecord>['columns'] = [
    {
      title: '考核项目',
      dataIndex: ['project', 'name'],
      width: 280,
      // render: (_, record) => (
      //   <Link
      //     to={`/employee/projects/${record.project.id}`}
      //     className="font-medium text-slate-800 hover:text-blue-600"
      //   >
      //     {record.project.name}
      //   </Link>
      // ),
    },
    {
      title: '年度',
      dataIndex: ['project', 'year'],
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
      title: '我的状态',
      width: 160,
      render: (_, record) => (
        <MemberStatusTag
          status={record.member.status}
          returnNote={record.member.returnNote}
        />
      ),
    },
    {
      title: '审核人',
      width: 110,
      render: (_, record) => (
        <span className="text-slate-600">
          {getReviewerName(data.roster, record.member.reviewerId)}
        </span>
      ),
    },
    {
      title: 'KPI 指标',
      width: 110,
      render: (_, record) => (
        <span className="text-slate-500">{record.member.kpis.length} 项</span>
      ),
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => {
  
        return (
          <Link to={`/employee/projects/${record.project.id}`}>
            <Button type='link' size="small">
              {getActionLabel(record)}
            </Button>
          </Link>
        )
      },
    },
  ]

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-800">我的考核项目</h2>
          </div>

        </div>
      </div>



      {returned.length > 0 && (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message={`你有 ${returned.length} 项 KPI 被退回`}
          description={`${returned
            .map((record) => record.project.name)
            .join('、')}，请修改后重新提交。退回说明可在项目详情中查看。`}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        <Table<EmployeeRecord>
          rowKey={(record) => record.project.id}
          columns={columns}
          dataSource={records}
          scroll={{ x: 1000 }}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂未参与任何考核项目"
              />
            ),
          }}
        />
      </div>
    </div>
  )
}
