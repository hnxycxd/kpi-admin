import { useEffect, useMemo, useState } from 'react'
import { App, Button, Dropdown, Empty, Input, Modal, Select, Table, Tooltip } from 'antd'
import type { MenuProps, TableColumnsType } from 'antd'
import {
  CheckOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  SoundOutlined,
} from '@ant-design/icons'
import { Navigate, useNavigate, useParams } from 'react-router'
import { EMPLOYEES, EMPLOYEE_MAP } from '../data/mock'
import { useAppStore } from '../store/AppStore'
import type { Employee, KpiStatus, Participant } from '../types'
import { PageHeading } from '../components/PageHeading'
import { PersonAvatar } from '../components/PersonAvatar'
import { KpiDrawer } from '../components/KpiDrawer'
import { ImportPeopleModal } from '../components/ImportPeopleModal'
import {
  PROJECT_STATUS_META,
  ProjectStatusTag,
  STATUS_OPTIONS,
  StatusTag,
  isPendingReview,
  isPendingSubmit,
} from '../lib/status'

interface Row {
  id: string
  participant: Participant
  employee: Employee
  reviewer: Employee
}

const PAGE_SIZE = 8

const REVIEWER_OPTIONS = EMPLOYEES.map((employee) => ({
  value: employee.id,
  label: `${employee.name} · ${employee.dept}`,
}))

export function ParticipantsPage() {
  const { projectId } = useParams()
  const { role, me, projects, addParticipants, removeParticipants, updateReviewer, approve, returnRecord, requestConfirm, startProject, endProject } =
    useAppStore()
  const { message, modal } = App.useApp()
  const navigate = useNavigate()

  const [nameFilter, setNameFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<KpiStatus>()
  const [page, setPage] = useState(1)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [editingReviewerId, setEditingReviewerId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnNote, setReturnNote] = useState('')

  const isAdmin = role === 'admin'
  const isReviewer = role === 'reviewer'

  const visibleProjects = useMemo(
    () => (isAdmin ? projects : projects.filter((project) => project.status !== 'draft')),
    [projects, isAdmin],
  )

  const project = useMemo(() => {
    if (projectId) return projects.find((item) => item.id === projectId)
    return visibleProjects.find((item) => item.status === 'active') ?? visibleProjects[0]
  }, [projectId, projects, visibleProjects])

  useEffect(() => {
    if (!projectId && project) navigate(`/people/${project.id}`, { replace: true })
  }, [projectId, project, navigate])

  useEffect(() => {
    setPage(1)
    setSelectedKeys([])
    setEditingReviewerId(null)
    setDrawerId(null)
  }, [project?.id, nameFilter, deptFilter, statusFilter])

  const allRows = useMemo<Row[]>(() => {
    if (!project) return []
    return project.participants
      .filter((participant) => isAdmin || participant.reviewerId === me?.id)
      .map((participant) => ({
        id: participant.id,
        participant,
        employee: EMPLOYEE_MAP[participant.employeeId],
        reviewer: EMPLOYEE_MAP[participant.reviewerId],
      }))
  }, [project, isAdmin, me?.id])

  const filteredRows = useMemo(() => {
    const keyword = nameFilter.trim().toLowerCase()
    return allRows.filter((row) => {
      const byName = !keyword || row.employee.name.toLowerCase().includes(keyword)
      const byDept = !deptFilter || row.employee.dept === deptFilter
      const byStatus = !statusFilter || row.participant.status === statusFilter
      return byName && byDept && byStatus
    })
  }, [allRows, nameFilter, deptFilter, statusFilter])

  const deptOptions = useMemo(
    () =>
      Array.from(new Set(allRows.map((row) => row.employee.dept)))
        .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
        .map((dept) => ({ value: dept, label: dept })),
    [allRows],
  )

  const selectedRows = allRows.filter((row) => selectedKeys.includes(row.id))
  const reviewSelected = selectedRows.filter((row) => isPendingReview(row.participant.status))
  const approvedSelected = selectedRows.filter((row) => row.participant.status === 'approved')
  const fillSelected = selectedRows.filter((row) => isPendingSubmit(row.participant.status))
  const confirmSelected = selectedRows.filter((row) => row.participant.status === 'pending_confirm')

  const drawerRow = allRows.find((row) => row.id === drawerId)

  if (projectId && !project) return <Navigate to="/people" replace />
  if (project && isReviewer && project.status === 'draft') return <Navigate to="/people" replace />

  if (!project) {
    return (
      <>
        <PageHeading
          eyebrow="绩效管理 / 考核人员"
          title="考核人员"
          description="当前账号下没有可查看的考核项目。"
        />
        <div className="panel empty-panel">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={isAdmin ? '暂无考核项目，请先在考核项目管理中新建' : '暂无可查看的考核项目'}
          />
          {isAdmin ? (
            <Button type="primary" onClick={() => navigate('/projects')}>
              前往考核项目管理
            </Button>
          ) : null}
        </div>
      </>
    )
  }

  const total = project.participants.length
  const confirmedCount = project.participants.filter((p) => p.status === 'confirmed').length
  const pendingReviewCount = project.participants.filter((p) => isPendingReview(p.status)).length
  const pendingConfirmCount = project.participants.filter((p) => p.status === 'pending_confirm').length
  const completionRate = total === 0 ? 0 : Math.round((confirmedCount / total) * 1000) / 10
  const myPendingReview = allRows.filter((row) => isPendingReview(row.participant.status)).length

  const resetFilters = () => {
    setNameFilter('')
    setDeptFilter(undefined)
    setStatusFilter(undefined)
  }

  const handleStart = () => {
    modal.confirm({
      title: '启动考核项目',
      content: `启动后将向 ${project.participants.length} 名填报人发送飞书填报通知，项目进入进行中，人员可开始填写 KPI。`,
      okText: '启动考核',
      cancelText: '取消',
      onOk: () => {
        if (startProject(project.id)) {
          message.success(`项目已启动，飞书填报通知已发送给 ${project.participants.length} 名填报人`)
        }
      },
    })
  }

  const handleEnd = () => {
    modal.confirm({
      title: '结束考核项目',
      content: `结束后「${project.name}」将转为只读，未完成的填报、审核与确认都无法继续。`,
      okText: '结束项目',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        if (endProject(project.id)) message.success('项目已结束，考核数据转为只读')
      },
    })
  }

  const handleAdd = (ids: string[]) => {
    const count = addParticipants(project.id, ids)
    setAddOpen(false)
    message.success(`已添加 ${count} 名考核人员，默认状态为「待提交」`)
  }

  const handleDelete = () => {
    if (selectedKeys.length === 0) return
    modal.confirm({
      title: '批量删除考核人员',
      content: `将所选 ${selectedKeys.length} 人从「${project.name}」中移除，对应 KPI 记录会一并删除，且不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        const removed = removeParticipants(project.id, selectedKeys)
        setSelectedKeys([])
        message.success(`已移除 ${removed} 名考核人员`)
      },
    })
  }

  const handleReviewChange = (participantId: string, reviewerId: string) => {
    updateReviewer(participantId, reviewerId)
    setEditingReviewerId(null)
    message.success(`审核人已更新为 ${EMPLOYEE_MAP[reviewerId].name}`)
  }

  const handleBatchApprove = () => {
    const count = approve(reviewSelected.map((row) => row.participant.id))
    if (count > 0) {
      setSelectedKeys([])
      message.success(`已审核通过 ${count} 人，飞书消息已发送给管理员`)
    }
  }

  const handleBatchReturn = () => {
    const count = reviewSelected.length
    reviewSelected.forEach((row) => {
      returnRecord(row.participant.id, returnNote)
    })
    setSelectedKeys([])
    setReturnOpen(false)
    setReturnNote('')
    message.success(`已退回 ${count} 人，飞书消息已发送给相关填报人`)
  }

  const handleRequestConfirm = () => {
    const count = requestConfirm(approvedSelected.map((row) => row.participant.id))
    if (count > 0) {
      setSelectedKeys([])
      message.success(`已发起员工确认，飞书消息已发送给 ${count} 名填报人`)
    }
  }

  const handleRemind = (type: 'fill' | 'review' | 'confirm') => {
    if (type === 'fill') {
      if (fillSelected.length === 0) {
        message.warning('所选人员中没有处于「待提交 / 已退回待提交」的记录')
        return
      }
      message.success(`已发送飞书催办消息给 ${fillSelected.length} 名填报人`)
      return
    }
    if (type === 'confirm') {
      if (confirmSelected.length === 0) {
        message.warning('所选人员中没有处于「待确认」的记录')
        return
      }
      message.success(`已发送飞书催办消息给 ${confirmSelected.length} 名填报人`)
      return
    }
    if (reviewSelected.length === 0) {
      message.warning('所选人员中没有处于「待审核 / 已退回待审核」的记录')
      return
    }
    const reviewers = new Set(reviewSelected.map((row) => row.participant.reviewerId))
    message.success(`已发送飞书催办消息给 ${reviewers.size} 名审核人`)
  }

  const remindItems: MenuProps['items'] = [
    { key: 'fill', label: '催填报', onClick: () => handleRemind('fill') },
    { key: 'review', label: '催审核', onClick: () => handleRemind('review') },
    { key: 'confirm', label: '催确认', onClick: () => handleRemind('confirm') },
  ]

  const canOperate = project.status !== 'ended'
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE)))

  const columns: TableColumnsType<Row> = [
    {
      title: '姓名',
      dataIndex: ['employee', 'name'],
      width: 140,
      render: (_value, row) => (
        <div className="person-inline">
          <PersonAvatar name={row.employee.name} size="sm" />
          <span className="person-name">{row.employee.name}</span>
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: ['employee', 'dept'],
      width: 130,
      render: (value: string) => <span className="dept-text">{value}</span>,
    },
    {
      title: '岗位',
      dataIndex: ['employee', 'position'],
      width: 150,
    },
    {
      title: 'KPI 指标',
      key: 'kpi',
      width: 110,
      render: (_value, row) => (
        <button
          type="button"
          className={`kpi-count-link${row.participant.kpis.length === 0 ? ' is-empty' : ''}`}
          onClick={() => setDrawerId(row.participant.id)}
        >
          {row.participant.kpis.length > 0 ? `${row.participant.kpis.length} 项` : '未填写'}
          <RightOutlined />
        </button>
      ),
    },
    {
      title: '审核人',
      dataIndex: ['reviewer', 'name'],
      width: 180,
      render: (_value, row) => {
        if (!isAdmin || !canOperate) return <span>{row.reviewer.name}</span>
        if (editingReviewerId === row.participant.id) {
          return (
            <Select
              autoFocus
              open
              size="small"
              variant="borderless"
              className="reviewer-select"
              value={row.participant.reviewerId}
              options={REVIEWER_OPTIONS.filter((option) => option.value !== row.employee.id)}
              showSearch
              optionFilterProp="label"
              popupMatchSelectWidth={240}
              onChange={(value) => handleReviewChange(row.participant.id, value)}
              onBlur={() => setEditingReviewerId(null)}
            />
          )
        }
        return (
          <div className="reviewer-cell">
            <span>{row.reviewer.name}</span>
            {role === 'admin' ? (
              <Button
                type="text"
                size="small"
                className="edit-reviewer"
                icon={<EditOutlined />}
                aria-label={`修改 ${row.employee.name} 的审核人`}
                onClick={() => setEditingReviewerId(row.participant.id)}
              />
            ) : null}
          </div>
        )
      },
    },
    {
      title: '状态',
      dataIndex: ['participant', 'status'],
      width: 210,
      render: (_value, row) => (
        <div className="status-cell">
          <StatusTag status={row.participant.status} />
          {row.participant.returnNote ? (
            <Tooltip title={row.participant.returnNote}>
              <span className="note-flag">退回说明</span>
            </Tooltip>
          ) : null}
        </div>
      ),
    },
  ]

  const creator = EMPLOYEE_MAP[project.createdBy]

  return (
    <>
      <PageHeading
        eyebrow="绩效管理 / 考核人员"
        title={project.name}
        description={
          <span className="project-meta">
            <ProjectStatusTag status={project.status} />
            <span>{project.year} 年度</span>
            <span className="meta-sep">·</span>
            <span>创建人 {creator?.name ?? '管理员'}</span>
            <span className="meta-sep">·</span>
            <span>{total} 人参与</span>
          </span>
        }
        actions={
          <div className="head-actions">
            <Select
              className="project-switch"
              value={project.id}
              options={visibleProjects.map((item) => ({
                value: item.id,
                label: `${item.name} · ${PROJECT_STATUS_META[item.status].label}`,
              }))}
              onChange={(value) => {
                setNameFilter('')
                setDeptFilter(undefined)
                setStatusFilter(undefined)
                navigate(`/people/${value}`)
              }}
              popupMatchSelectWidth={360}
            />
            {isAdmin && project.status === 'active' ? (
              <Button onClick={handleEnd}>结束考核</Button>
            ) : null}
          </div>
        }
      />

      {isAdmin && project.status === 'active' ? (
        <div className="summary-panel">
          <div className="summary-metrics">
            <div className="metric">
              <span className="metric-label">参与人数</span>
              <div className="metric-value">
                {total}
                <small>人</small>
              </div>
            </div>
            <div className="metric">
              <span className="metric-label">完成率</span>
              <div className="metric-value">
                {completionRate}
                <small>%</small>
              </div>
              <span className="metric-hint">
                {confirmedCount} / {total} 人已确认
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">待审核数</span>
              <div className="metric-value">
                {pendingReviewCount}
                <small>人</small>
              </div>
              <span className="metric-hint">含已退回待审核</span>
            </div>
            <div className="metric">
              <span className="metric-label">待确认数</span>
              <div className="metric-value">
                {pendingConfirmCount}
                <small>人</small>
              </div>
              <span className="metric-hint">已审核通过并等待确认</span>
            </div>
          </div>
          <div className="progress-track summary-progress" aria-hidden>
            <div className="progress-fill" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      ) : null}

      {isAdmin && project.status === 'draft' ? (
        <div className="start-callout">
          <div>
            <strong>项目尚未启动</strong>
            <p>
              启动后将向已导入的 {total} 名填报人发送飞书填报通知，项目进入进行中。
            </p>
          </div>
          <Button type="primary" onClick={handleStart}>
            启动考核
          </Button>
        </div>
      ) : null}

      {project.status === 'ended' ? (
        <div className="ended-note">
          <LockOutlined />
          项目已结束，当前页面仅支持查看历史数据，不可再进行填报、审核或确认。
        </div>
      ) : null}

      {isReviewer ? (
        <div className="reviewer-context">
          <span>
            审核范围：<strong>{me?.name}</strong> 名下 {allRows.length} 人
          </span>
          <span className="meta-sep">·</span>
          <span>
            待我审核 <strong className="num">{myPendingReview}</strong> 人
          </span>
        </div>
      ) : null}

      <div className="panel table-panel">
        <div className="panel-head participants-head">
          <div>
            <h2 className="panel-title">考核人员</h2>
            <p className="panel-sub">
              点击 KPI 指标可查看明细
              {canOperate ? '，管理员与审核人可在此完成审批与批量操作' : '，当前项目已结束'}
              。
            </p>
          </div>
        </div>

        <div className="filter-bar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索姓名"
            className="filter-name"
            value={nameFilter}
            onChange={(event) => setNameFilter(event.target.value)}
          />
          <Select
            allowClear
            placeholder="全部部门"
            className="filter-select"
            options={deptOptions}
            value={deptFilter}
            onChange={setDeptFilter}
          />
          <Select
            allowClear
            placeholder="全部状态"
            className="filter-select"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Button type="text" onClick={resetFilters}>
            重置
          </Button>
          <span className="filter-result">筛选结果 {filteredRows.length} 人</span>
        </div>

        {canOperate && isAdmin ? (
          <div className="toolbar">
            <div className="toolbar-group">
              <Button icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                新增人员
              </Button>
              {project.status === 'active' ? (
                <Dropdown
                  menu={{ items: remindItems }}
                  disabled={selectedKeys.length === 0}
                  trigger={['click']}
                >
                  <Button icon={<SoundOutlined />} disabled={selectedKeys.length === 0}>
                    批量催办
                    <DownOutlined />
                  </Button>
                </Dropdown>
              ) : null}
              {project.status === 'active' ? (
                <Button
                  icon={<CheckOutlined />}
                  disabled={approvedSelected.length === 0}
                  onClick={handleRequestConfirm}
                >
                  发起员工确认
                </Button>
              ) : null}
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={selectedKeys.length === 0}
                onClick={handleDelete}
              >
                批量删除
              </Button>
            </div>
            <span className="selection-hint">
              {selectedKeys.length > 0 ? `已选 ${selectedKeys.length} 人` : '勾选人员后可批量操作'}
            </span>
          </div>
        ) : null}

        {project.status === 'active' && isReviewer ? (
          <div className="toolbar">
            <div className="toolbar-group">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                disabled={reviewSelected.length === 0}
                onClick={handleBatchApprove}
              >
                批量审核通过{reviewSelected.length > 0 ? ` (${reviewSelected.length})` : ''}
              </Button>
              <Button
                danger
                disabled={reviewSelected.length === 0}
                onClick={() => setReturnOpen(true)}
              >
                批量退回{reviewSelected.length > 0 ? ` (${reviewSelected.length})` : ''}
              </Button>
            </div>
            <span className="selection-hint">
              {selectedKeys.length > 0 ? `已选 ${selectedKeys.length} 人` : '勾选待审核人员后可批量审批'}
            </span>
          </div>
        ) : null}

        <Table<Row>
          rowKey="id"
          columns={columns}
          dataSource={filteredRows}
          rowSelection={
            canOperate
              ? {
                  selectedRowKeys: selectedKeys,
                  onChange: (keys) => setSelectedKeys(keys.map(String)),
                }
              : undefined
          }
          pagination={{
            current: currentPage,
            pageSize: PAGE_SIZE,
            total: filteredRows.length,
            showSizeChanger: false,
            showTotal: (count) => `共 ${count} 人`,
            onChange: (next) => setPage(next),
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  isReviewer && allRows.length === 0
                    ? '当前项目中暂无需要你审核的人员'
                    : '没有符合筛选条件的人员'
                }
              />
            ),
          }}
        />
      </div>

      {drawerRow ? (
        <KpiDrawer
          open
          project={project}
          participant={drawerRow.participant}
          onClose={() => setDrawerId(null)}
        />
      ) : null}

      <ImportPeopleModal
        open={addOpen}
        title="新增考核人员"
        description="从人事档案中选择人员加入当前项目，加入后默认状态为「待提交」，审核人取默认上级。"
        existingIds={project.participants.map((participant) => participant.employeeId)}
        onCancel={() => setAddOpen(false)}
        onConfirm={handleAdd}
      />

      <Modal
        open={returnOpen}
        title="批量退回"
        okText="确认退回"
        cancelText="取消"
        onCancel={() => {
          setReturnOpen(false)
          setReturnNote('')
        }}
        onOk={handleBatchReturn}
        okButtonProps={{ danger: true }}
        destroyOnHidden
        width={520}
      >
        <p className="modal-desc">
          将退回所选的 {reviewSelected.length} 条待审核记录，状态变为「已退回待提交」，系统会向对应填报人发送飞书通知。
        </p>
        <Input.TextArea
          rows={3}
          maxLength={200}
          showCount
          placeholder="填写退回说明，选填"
          value={returnNote}
          onChange={(event) => setReturnNote(event.target.value)}
        />
      </Modal>
    </>
  )
}
