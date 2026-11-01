import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  Alert,
  App as AntApp,
  Button,
  Empty,
  Input,
  Progress,
  Result,
  Select,
  Space,
  Table,
  type TableProps,
} from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AddMembersModal } from '../components/AddMembersModal'
import { KpiListCell } from '../components/KpiListCell'
import { ReturnNoteModal } from '../components/ReturnNoteModal'
import { MemberStatusTag, ProjectStatusTag } from '../components/StatusTags'
import { useKpi, useKpiActions } from '../store/KpiStore'
import {
  DEMO_REVIEWER_ID,
  MEMBER_STATUS_META,
  REVIEWABLE_STATUSES,
  getProjectStats,
  getReviewerName,
  type HrEmployee,
  type Member,
  type MemberStatus,
  type Role,
} from '../types'

const STATUS_OPTIONS = (Object.keys(MEMBER_STATUS_META) as MemberStatus[]).map(
  (status) => ({
    value: status,
    label: MEMBER_STATUS_META[status].label,
  }),
)

function reminderTarget(status: MemberStatus): '填报' | '审核' | '确认' | null {
  switch (status) {
    case 'pending_submit':
    case 'returned_submit':
      return '填报'
    case 'pending_review':
    case 'returned_review':
      return '审核'
    case 'pending_confirm':
      return '确认'
    default:
      return null
  }
}

function ReviewerEditor({
  roster,
  initialValue,
  onSave,
  onCancel,
}: {
  roster: HrEmployee[]
  initialValue: string | null
  onSave: (reviewerId: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState<string | undefined>(initialValue ?? undefined)
  const valueRef = useRef<string | undefined>(initialValue ?? undefined)
  const finishedRef = useRef(false)

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    if (valueRef.current && valueRef.current !== (initialValue ?? undefined)) {
      onSave(valueRef.current)
      return
    }
    onCancel()
  }

  return (
    <Select
      autoFocus
      defaultOpen
      showSearch
      optionFilterProp="label"
      placeholder="选择审核人"
      value={value}
      style={{ width: '100%' }}
      options={roster
        .filter((employee) => employee.isReviewer)
        .map((employee) => ({
          value: employee.id,
          label: `${employee.name}（${employee.dept} · ${employee.position}）`,
        }))}
      onChange={(next) => {
        valueRef.current = next
        setValue(next)
      }}
      onBlur={finish}
    />
  )
}

function StatCard({
  label,
  value,
  hint,
  accent,
  progress,
}: {
  label: string
  value: string
  hint: string
  accent?: string
  progress?: number
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3.5">
      <div className="text-xs text-slate-400">{label}</div>
      <div
        className="mt-1 text-2xl font-semibold text-slate-800"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {progress !== undefined && (
        <Progress
          percent={progress}
          showInfo={false}
          size="small"
          strokeColor="#2563eb"
          className="!mb-0 !mt-1"
        />
      )}
      <div className="mt-1 text-[11px] text-slate-400">{hint}</div>
    </div>
  )
}

export default function MemberListPage({
  role,
}: {
  role: Extract<Role, 'admin' | 'reviewer'>
}) {
  const { projectId } = useParams()
  const { data } = useKpi()
  const {
    removeMember,
    changeReviewer,
    adminDecide,
    bulkReviewMembers,
    startProject,
  } = useKpiActions()
  const { message, modal } = AntApp.useApp()

  const [keyword, setKeyword] = useState('')
  const [dept, setDept] = useState<string>()
  const [status, setStatus] = useState<MemberStatus>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [editingReviewerId, setEditingReviewerId] = useState<string | null>(null)
  const [returnState, setReturnState] = useState<{
    kind: 'admin' | 'reviewer'
    memberIds: string[]
  } | null>(null)

  const project = data.projects.find((item) => item.id === projectId)

  const scopedMembers = useMemo(() => {
    if (!project) return []
    return role === 'admin'
      ? project.members
      : project.members.filter((member) => member.reviewerId === DEMO_REVIEWER_ID)
  }, [project, role])

  const filteredMembers = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    return scopedMembers.filter((member) => {
      if (dept && member.dept !== dept) return false
      if (status && member.status !== status) return false
      if (!text) return true
      return [member.name, member.dept, member.position]
        .join(' ')
        .toLowerCase()
        .includes(text)
    })
  }, [scopedMembers, keyword, dept, status])

  // 不要删
  console.log('filteredMembers', filteredMembers);

  useEffect(() => {
    setSelectedRowKeys([])
  }, [keyword, dept, status, projectId])

  if (!project) {
    return (
      <Result
        status="404"
        title="考核项目不存在"
        subTitle="该项目可能已被删除，请返回列表重新选择。"
        extra={
          <Link to={role === 'admin' ? '/admin' : '/reviewer'}>
            <Button type="primary">返回列表</Button>
          </Link>
        }
      />
    )
  }

  const stats = getProjectStats(project)
  const canOperate = project.status === 'ongoing'
  const canEditReviewer = role === 'admin' && project.status !== 'ended'
  const listPath = role === 'admin' ? '/admin' : '/reviewer'
  const listLabel = role === 'admin' ? '考核项目管理' : '待我审核'
  const kpiPath = (member: Member) =>
    `${listPath}/projects/${project.id}/members/${member.id}`
  const departments = Array.from(new Set(scopedMembers.map((member) => member.dept)))
  const selectedMembers = scopedMembers.filter((member) =>
    selectedRowKeys.includes(member.id),
  )

  const handleRemind = (members: Member[]) => {
    const actionable = members.filter((member) => reminderTarget(member.status))
    if (actionable.length === 0) {
      message.info('所选人员当前没有可催办的事项')
      return
    }
    const fill = actionable.filter(
      (member) =>
        member.status === 'pending_submit' || member.status === 'returned_submit',
    ).length
    const review = actionable.filter((member) =>
      REVIEWABLE_STATUSES.includes(member.status),
    ).length
    const confirm = actionable.filter((member) => member.status === 'pending_confirm').length
    const parts = [
      fill > 0 ? `填报 ${fill} 人` : '',
      review > 0 ? `审核 ${review} 人` : '',
      confirm > 0 ? `确认 ${confirm} 人` : '',
    ]
      .filter(Boolean)
      .join('、')
    message.success(
      `已发送 ${actionable.length} 条催办（模拟飞书）：${parts}`,
    )
  }

  const handleRequestConfirm = (member: Member) => {
    const result = adminDecide(project.id, [member.id], 'request_confirm')
    if (!result.ok) {
      message.error(result.error)
      return
    }
    message.success(`已向 ${member.name} 发起员工确认（模拟飞书）`)
  }

  const handleBatchRequestConfirm = () => {
    const result = adminDecide(project.id, selectedRowKeys, 'request_confirm')
    if (!result.ok) {
      message.error(result.error)
      return
    }
    message.success(
      `已发起员工确认 ${result.processed} 人${
        result.skipped > 0 ? `，${result.skipped} 人状态不符已跳过` : ''
      }（模拟飞书通知）`,
    )
    setSelectedRowKeys([])
  }

  const handleBatchApprove = () => {
    const result = bulkReviewMembers(project.id, selectedRowKeys, 'approve')
    if (!result.ok) {
      message.error(result.error)
      return
    }
    message.success(
      `已审核通过 ${result.processed} 人${
        result.skipped > 0 ? `，${result.skipped} 人状态不符已跳过` : ''
      }（模拟飞书通知管理员）`,
    )
    setSelectedRowKeys([])
  }

  const handleReturnConfirm = (note: string) => {
    if (!returnState) return
    const result =
      returnState.kind === 'admin'
        ? adminDecide(project.id, returnState.memberIds, 'return_review', note)
        : bulkReviewMembers(project.id, returnState.memberIds, 'return', note)
    if (!result.ok) {
      message.error(result.error)
      return
    }
    message.success(
      returnState.kind === 'admin'
        ? `已退回 ${result.processed} 人至审核人复核（模拟飞书）`
        : `已退回 ${result.processed} 人重新填报（模拟飞书）`,
    )
    setReturnState(null)
    setSelectedRowKeys([])
  }

  const handleStart = () => {
    if (project.members.length === 0) {
      message.warning('项目下暂无考核人员，请先添加人员')
      return
    }
    modal.confirm({
      title: '启动考核项目',
      content: `启动「${project.name}」后，${project.members.length} 名填报人将进入「待提交」状态，并收到填报通知（模拟飞书）。`,
      okText: '确认启动',
      cancelText: '取消',
      onOk: () => {
        const result = startProject(project.id)
        if (!result.ok) {
          message.error(result.error)
          return
        }
        message.success('项目已启动，已向填报人发送填报通知（模拟飞书）')
      },
    })
  }

  const handleSaveReviewer = (member: Member, reviewerId: string) => {
    setEditingReviewerId(null)
    const result = changeReviewer(project.id, member.id, reviewerId)
    if (!result.ok) {
      message.error(result.error)
      return
    }
    message.success(
      `已将 ${member.name} 的审核人更新为 ${getReviewerName(data.roster, reviewerId)}`,
    )
  }

  const handleRemove = (member: Member) => {
    modal.confirm({
      title: '移除考核人员',
      content: `确定将「${member.name}」从「${project.name}」中移除吗？其 KPI 数据将一并删除。`,
      okText: '移除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const result = removeMember(project.id, member.id)
        if (!result.ok) {
          message.error(result.error)
          return
        }
        setSelectedRowKeys((keys) => keys.filter((key) => key !== member.id))
        message.success('考核人员已移除')
      },
    })
  }

  const columns: TableProps<Member>['columns'] = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100,
      fixed: 'left',
      render: (name: string, member) => (
        <Link
          to={kpiPath(member)}
          className="font-medium text-slate-800 hover:text-blue-600"
        >
          {name}
        </Link>
      ),
    },
    {
      title: '部门',
      dataIndex: 'dept',
      width: 100,
      render: (value: string) => <span className="text-slate-600">{value}</span>,
    },
    {
      title: '岗位',
      dataIndex: 'position',
      width: 120,
      render: (value: string) => <span className="text-slate-600">{value}</span>,
    },
    {
      title: 'KPI 内容',
      dataIndex: 'kpis',
      width: 400,
      render: (_, member) => <KpiListCell kpis={member.kpis} />,
    },
    {
      title: '审核人',
      dataIndex: 'reviewerId',
      width: 150,
      render: (value: string | null, member) => {
        if (canEditReviewer && editingReviewerId === member.id) {
          return (
            <ReviewerEditor
              roster={data.roster}
              initialValue={value}
              onSave={(reviewerId) => handleSaveReviewer(member, reviewerId)}
              onCancel={() => setEditingReviewerId(null)}
            />
          )
        }
        return (
          <span className="inline-flex items-center gap-1 text-slate-600">
            {getReviewerName(data.roster, value)}
            {canEditReviewer && (
              <Button
                type="text"
                size="small"
                aria-label="修改审核人"
                icon={<EditOutlined />}
                className="!h-6 !w-6 !p-0 text-slate-400 hover:!text-blue-600"
                onClick={() => setEditingReviewerId(member.id)}
              />
            )}
          </span>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 130,
      render: (value: MemberStatus, member) => (
        <MemberStatusTag status={value} returnNote={member.returnNote} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: role === 'admin' ? 240 : 100,
      fixed: 'right',
      render: (_, member) => {
        if (role === 'admin') {
          const canRemind = reminderTarget(member.status)
          return (
            <Space size={0} wrap>
              {canOperate && canRemind && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleRemind([member])}
                >
                  催办
                </Button>
              )}
              {canOperate && member.status === 'approved' && (
                <>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleRequestConfirm(member)}
                  >
                    发起确认
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() =>
                      setReturnState({ kind: 'admin', memberIds: [member.id] })
                    }
                  >
                    退回
                  </Button>
                </>
              )}
              {project.status !== 'ended' && (
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => handleRemove(member)}
                >
                  移除人员
                </Button>
              )}
            </Space>
          )
        }

        const canReview =
          canOperate && REVIEWABLE_STATUSES.includes(member.status)
        if (!canReview) return null
        return (
          <Link to={kpiPath(member)}>
            <Button type="link" size="small">
              去审核
            </Button>
          </Link>
        )
      },
    },
  ]

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
        <Link to={listPath} className="transition-colors hover:text-blue-600">
          {listLabel}
        </Link>
        <span>/</span>
        <span className="text-slate-600">{project.name}</span>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200/80 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-800">
                {project.name}
              </h2>
              <ProjectStatusTag status={project.status} />
            </div>
            <div className="mt-1.5 text-xs text-slate-400">
              {project.year} 年度 · 启动日期 {project.startDate ?? '未启动'} · 创建人{' '}
              {project.creator}
            </div>
            {role === 'reviewer' && (
              <div className="mt-1.5 text-xs text-violet-500">
                当前列表仅展示分配给我审核的员工，共 {scopedMembers.length} 人
              </div>
            )}
          </div>
     
        </div>

        {role === 'admin' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="参与人数"
              value={`${stats.total} 人`}
              hint={`${stats.total - stats.confirmed} 人尚未完成确认`}
            />
            <StatCard
              label="完成率"
              value={`${stats.completion}%`}
              hint={`已确认 ${stats.confirmed} / ${stats.total}`}
              progress={stats.completion}
            />
            <StatCard
              label="待审核数"
              value={`${stats.pendingReview} 人`}
              hint="含待审核与已退回待审核"
              accent="#2563eb"
            />
            <StatCard
              label="待确认数"
              value={`${stats.pendingConfirm} 人`}
              hint="已发起员工确认、等待填报人确认"
              accent="#7c3aed"
            />
          </div>
        )}
      </div>

      {/* {project.status === 'pending' && (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="项目尚未启动"
          description="当前人员为待提交状态，但项目未启动前不可编辑 KPI、审核或催办。管理员启动项目后流程才会流转。"
        />
      )} */}
      {project.status === 'ended' && (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="项目已结束"
          description="项目数据已归档，当前页面与 KPI 详情均为只读。"
        />
      )}

      <div className="mb-4 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="搜索姓名 / 岗位"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full sm:!w-[220px]"
          />
          <Select
            allowClear
            placeholder="全部部门"
            value={dept}
            onChange={setDept}
            options={departments.map((item) => ({ value: item, label: item }))}
            className="w-full sm:!w-[150px]"
          />
          <Select
            allowClear
            placeholder="全部状态"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            className="w-full sm:!w-[180px]"
          />
          <Button
            onClick={() => {
              setKeyword('')
              setDept(undefined)
              setStatus(undefined)
            }}
          >
            重置
          </Button>
          {role === 'admin' && project.status !== 'ended' && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {project.status === 'pending' && (
                <Button type="primary" onClick={handleStart}>
                  启动
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddOpen(true)}
              >
                添加人员
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        {canOperate && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
            <div className="text-xs text-slate-500">
              已选 <span className="font-semibold text-slate-800">{selectedRowKeys.length}</span> 人
              {selectedRowKeys.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setSelectedRowKeys([])}
                >
                  清空
                </Button>
              )}
            </div>
            <Space wrap size={4}>
              {role === 'admin' ? (
                <>
                  <Button
                    size="small"
                    disabled={selectedRowKeys.length === 0}
                    onClick={() => handleRemind(selectedMembers)}
                  >
                    批量催办
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    disabled={selectedRowKeys.length === 0}
                    onClick={handleBatchRequestConfirm}
                  >
                    批量发起确认
                  </Button>
                  <Button
                    size="small"
                    danger
                    disabled={selectedRowKeys.length === 0}
                    onClick={() =>
                      setReturnState({ kind: 'admin', memberIds: selectedRowKeys })
                    }
                  >
                    批量退回
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="small"
                    type="primary"
                    disabled={selectedRowKeys.length === 0}
                    onClick={handleBatchApprove}
                  >
                    批量审核通过
                  </Button>
                  <Button
                    size="small"
                    danger
                    disabled={selectedRowKeys.length === 0}
                    onClick={() =>
                      setReturnState({ kind: 'reviewer', memberIds: selectedRowKeys })
                    }
                  >
                    批量退回
                  </Button>
                </>
              )}
            </Space>
          </div>
        )}

        <Table<Member>
          rowKey="id"
          columns={columns}
          dataSource={filteredMembers}
          scroll={{ x: 1280 }}
          rowSelection={
            canOperate
              ? {
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys.map(String)),
                  preserveSelectedRowKeys: true,
                }
              : undefined
          }
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20],
            showTotal: (total) => `共 ${total} 名考核人员`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  role === 'admin'
                    ? '暂无符合条件的考核人员'
                    : '暂无分配给我审核的员工'
                }
              />
            ),
          }}
        />
      </div>

      {role === 'admin' && (
        <AddMembersModal
          open={addOpen}
          project={project}
          onClose={() => setAddOpen(false)}
        />
      )}

      <ReturnNoteModal
        open={Boolean(returnState)}
        title={returnState?.kind === 'admin' ? '退回审核人复核' : '退回 KPI'}
        description={
          returnState?.kind === 'admin'
            ? `将所选 ${returnState?.memberIds.length ?? 0} 人从「审核通过」退回至「已退回待审核」，审核人可重新审核。`
            : `将所选 ${returnState?.memberIds.length ?? 0} 人退回填报人重新提交，退回说明将同步展示给对方。`
        }
        confirmText="确认退回"
        onCancel={() => setReturnState(null)}
        onConfirm={handleReturnConfirm}
      />
    </div>
  )
}
