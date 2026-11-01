import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Space,
  Table,
  Tag,
  Dropdown,
} from 'antd'
import type { MenuProps, TableProps } from 'antd'
import { useMemo, useState } from 'react'
import type { Key } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useStore } from '../store'
import ReturnNoteModal from '../components/ReturnNoteModal'
import { PERSON_STATUS_META, PERSON_STATUS_OPTIONS, PROJECT_STATUS_META, fmtDate } from '../utils/kit'
import type { Participant, PersonStatus } from '../types'

interface Row {
  p: Participant
  name: string
  department: string
  position: string
  reviewerName: string
}

export default function ParticipantListPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const store = useStore()
  const { state, currentUser } = store

  const [keyword, setKeyword] = useState('')
  const [dept, setDept] = useState<string | undefined>()
  const [status, setStatus] = useState<PersonStatus | undefined>()
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [addIds, setAddIds] = useState<string[]>([])
  const [returnTarget, setReturnTarget] = useState<{ ids: string[]; mode: 'admin' | 'reviewer' } | null>(null)
  const [prevProjectId, setPrevProjectId] = useState(projectId)

  // 切换项目时重置筛选与勾选（渲染期状态调整，无需 effect）
  if (prevProjectId !== projectId) {
    setPrevProjectId(projectId)
    setKeyword('')
    setDept(undefined)
    setStatus(undefined)
    setSelectedKeys([])
  }

  const clearSelection = () => setSelectedKeys([])

  const project = state.projects.find((p) => p.id === projectId)
  const isAdmin = currentUser?.role === 'admin'
  const isReviewerRole = currentUser?.role === 'reviewer'
  const active = project?.status === 'active'
  const editableProject = project?.status !== 'ended'

  const rowsAll = useMemo(() => {
    if (!projectId) return [] as Row[]
    return state.participants
      .filter((p) => p.projectId === projectId && (isAdmin || p.reviewerId === currentUser?.employeeId))
      .map((p) => {
        const emp = state.employees.find((e) => e.id === p.employeeId)
        const reviewer = state.employees.find((e) => e.id === p.reviewerId)
        return {
          p,
          name: emp?.name ?? '未知',
          department: emp?.department ?? '—',
          position: emp?.position ?? '—',
          reviewerName: reviewer?.name ?? '—',
        }
      })
  }, [state, projectId, isAdmin, currentUser])

  const rows = useMemo(
    () =>
      rowsAll.filter(
        (r) =>
          r.name.toLowerCase().includes(keyword.trim().toLowerCase()) &&
          (!dept || r.department === dept) &&
          (!status || r.p.status === status),
      ),
    [rowsAll, keyword, dept, status],
  )

  const projectTotal = state.participants.filter((p) => p.projectId === projectId).length
  const confirmedCount = state.participants.filter((p) => p.projectId === projectId && p.status === 'confirmed').length
  const toReviewCount = state.participants.filter(
    (p) => p.projectId === projectId && (p.status === 'toReview' || p.status === 'returnedToReview'),
  ).length
  const toConfirmCount = state.participants.filter((p) => p.projectId === projectId && p.status === 'toConfirm').length
  const completionRate = projectTotal > 0 ? Math.round((confirmedCount / projectTotal) * 100) : 0

  const deptOptions = Array.from(new Set(state.employees.map((e) => e.department))).map((d) => ({ value: d, label: d }))

  const switchOptions = state.projects
    .filter((p) => (isAdmin ? true : p.status !== 'pending'))
    .map((p) => ({ value: p.id, label: `${p.name}（${PROJECT_STATUS_META[p.status].label}）` }))

  const selectedRows = rows.filter((r) => selectedKeys.includes(r.p.id))

  const notExist = (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      <Empty description="项目不存在或已被删除">
        <Button type="primary" onClick={() => navigate(isAdmin ? '/admin' : '/reviewer')}>
          返回列表
        </Button>
      </Empty>
    </div>
  )

  if (!currentUser || (!isAdmin && !isReviewerRole)) {
    return <Navigate to="/" replace />
  }
  if (!project) return notExist

  const creatorName = state.employees.find((e) => e.id === project.creatorId)?.name ?? '—'

  // ===== 批量操作 =====

  const requireSelection = (): boolean => {
    if (selectedRows.length === 0) {
      message.warning('请先勾选人员')
      return false
    }
    return true
  }

  const handleStart = () => {
    const count = store.startProject(project.id)
    message.success(`项目已启动，已向 ${count} 位填报人发送飞书消息`)
  }

  const handleUrge: MenuProps['onClick'] = (info) => {
    if (!requireSelection()) return
    const map: Record<string, PersonStatus[]> = {
      submit: ['toSubmit', 'returnedToSubmit'],
      review: ['toReview', 'returnedToReview'],
      confirm: ['toConfirm'],
    }
    const targets = selectedRows.filter((r) => map[info.key]?.includes(r.p.status))
    if (targets.length === 0) {
      message.warning('所选人员中没有该类待办')
      return
    }
    const verb = info.key === 'submit' ? '催填报' : info.key === 'review' ? '催审核' : '催确认'
    message.success(`已发送飞书催办消息（${verb}）：${targets.map((t) => t.name).join('、')}`)
    setSelectedKeys([])
  }

  const urgeItems: MenuProps['items'] = [
    { key: 'submit', label: '催填报（待提交 / 已退回待提交）' },
    { key: 'review', label: '催审核（待审核 / 已退回待审核）' },
    { key: 'confirm', label: '催确认（待确认）' },
  ]

  const handleBatchApprove = () => {
    if (!requireSelection()) return
    const targets = selectedRows.filter((r) => r.p.status === 'toReview' || r.p.status === 'returnedToReview')
    if (targets.length === 0) {
      message.warning('所选人员中没有待审核的记录')
      return
    }
    targets.forEach((t) => store.approveKpis(t.p.id, t.p.kpis))
    message.success(`已审核通过 ${targets.length} 条，等待管理员发起员工确认`)
    setSelectedKeys([])
  }

  const openBatchConfirm = () => {
    if (!requireSelection()) return
    const targets = selectedRows.filter((r) => r.p.status === 'approved')
    if (targets.length === 0) {
      message.warning('所选人员中没有「审核通过」状态的记录')
      return
    }
    store.startConfirm(targets.map((t) => t.p.id))
    message.success(`已发起员工确认，并向 ${targets.map((t) => t.name).join('、')} 发送飞书消息`)
    setSelectedKeys([])
  }

  const openBatchReturn = (mode: 'admin' | 'reviewer') => {
    if (!requireSelection()) return
    const targets =
      mode === 'admin'
        ? selectedRows.filter((r) => r.p.status === 'approved')
        : selectedRows.filter((r) => r.p.status === 'toReview' || r.p.status === 'returnedToReview')
    if (targets.length === 0) {
      message.warning(mode === 'admin' ? '仅「审核通过」状态的记录可退回' : '所选人员中没有待审核的记录')
      return
    }
    setReturnTarget({ ids: targets.map((t) => t.p.id), mode })
  }

  const handleReturnOk = (note: string) => {
    if (!returnTarget) return
    const { ids, mode } = returnTarget
    if (mode === 'admin') {
      store.adminReturn(ids, note)
      message.success(`已退回 ${ids.length} 条至审核环节，并已发送飞书消息给对应审核人`)
    } else {
      ids.forEach((id) => store.reviewerReturn(id, note))
      message.success(`已退回 ${ids.length} 条，并已发送飞书消息给对应填报人`)
    }
    setReturnTarget(null)
    setSelectedKeys([])
  }

  const handleBatchRemove = () => {
    if (!requireSelection()) return
    store.removeParticipants(selectedRows.map((r) => r.p.id))
    message.success(`已移除 ${selectedRows.length} 名考核人员，相关数据已重新计算`)
    setSelectedKeys([])
  }

  // ===== 新增人员 =====

  const existingIds = new Set(state.participants.filter((p) => p.projectId === project.id).map((p) => p.employeeId))
  const archiveOptions = state.employees
    .filter((e) => !existingIds.has(e.id))
    .map((e) => ({ value: e.id, label: `${e.name}（${e.department} · ${e.position}）` }))

  const handleAddOk = () => {
    if (addIds.length === 0) {
      message.warning('请先选择要导入的人员')
      return
    }
    const imported = store.addParticipants(project.id, addIds)
    message.success(`已从人事档案导入 ${imported} 名考核人员`)
    setAddOpen(false)
    setAddIds([])
  }

  const handleReviewerChange = (r: Row, reviewerId: string) => {
    store.changeReviewer(r.p.id, reviewerId)
    const name = state.employees.find((e) => e.id === reviewerId)?.name ?? reviewerId
    message.success(`已将「${r.name}」的审核人修改为「${name}」`)
  }

  // ===== 表格 =====

  const renderRowActions = (r: Row) => {
    if (project.status === 'ended') return <span className="text-gray-400">—</span>
    if (isAdmin) {
      return (
        <Space size={4}>
          {active && r.p.status === 'approved' && (
            <>
              <Button
                type="link"
                size="small"
                className="px-0"
                onClick={() => {
                  store.startConfirm([r.p.id])
                  message.success(`已发起员工确认，并向「${r.name}」发送飞书消息`)
                }}
              >
                发起确认
              </Button>
              <Button
                type="link"
                size="small"
                className="px-0"
                danger
                onClick={() => setReturnTarget({ ids: [r.p.id], mode: 'admin' })}
              >
                退回
              </Button>
            </>
          )}
          <Popconfirm
            title={`确定将「${r.name}」移出本项目？`}
            onConfirm={() => {
              store.removeParticipants([r.p.id])
              message.success(`已移除「${r.name}」，相关数据已重新计算`)
            }}
          >
            <Button type="link" size="small" className="px-0" danger>
              移除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
    if (active && (r.p.status === 'toReview' || r.p.status === 'returnedToReview')) {
      return (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            className="px-0"
            onClick={() => {
              store.approveKpis(r.p.id, r.p.kpis)
              message.success(`已通过「${r.name}」的 KPI，等待管理员发起员工确认`)
            }}
          >
            通过
          </Button>
          <Button
            type="link"
            size="small"
            className="px-0"
            danger
            onClick={() => setReturnTarget({ ids: [r.p.id], mode: 'reviewer' })}
          >
            退回
          </Button>
        </Space>
      )
    }
    return <span className="text-gray-400">—</span>
  }

  const columns: TableProps<Row>['columns'] = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 110,
      render: (_, r) => (
        <Button type="link" className="px-0 font-medium" onClick={() => navigate(`/my-kpi/${project.id}/${r.p.id}`)}>
          {r.name}
        </Button>
      ),
    },
    { title: '部门', dataIndex: 'department', width: 90 },
    { title: '岗位', dataIndex: 'position', width: 110 },
    {
      title: 'KPI 指标',
      width: 100,
      render: (_, r) =>
        r.p.kpis.length > 0 ? (
          <span>{r.p.kpis.length} 项</span>
        ) : (
          <span className="text-gray-400">待填写</span>
        ),
    },
    {
      title: '审核人',
      width: 130,
      render: (_, r) =>
        isAdmin && editableProject ? (
          <Select
            size="small"
            style={{ minWidth: 92 }}
            value={r.p.reviewerId}
            onChange={(v) => handleReviewerChange(r, v)}
            options={state.employees
              .filter((e) => e.id !== r.p.employeeId)
              .map((e) => ({ value: e.id, label: e.name }))}
          />
        ) : (
          r.reviewerName
        ),
    },
    {
      title: '状态',
      width: 150,
      render: (_, r) => (
        <Space size={4} wrap>
          <Tag color={PERSON_STATUS_META[r.p.status].color}>{PERSON_STATUS_META[r.p.status].label}</Tag>
          {(r.p.status === 'returnedToSubmit' || r.p.status === 'returnedToReview') && (
            <Popover
              title="退回说明"
              content={
                <div className="max-w-[260px]">
                  <div>{r.p.returnNote?.trim() || '未填写退回说明'}</div>
                  <div className="mt-1 text-xs text-gray-400">退回人：{r.p.returnedBy === 'admin' ? '管理员' : '审核人'}</div>
                </div>
              }
            >
              <Button type="link" size="small" className="px-0">
                说明
              </Button>
            </Popover>
          )}
        </Space>
      ),
    },
    { title: '操作', key: 'actions', width: 160, render: (_, r) => renderRowActions(r) },
  ]

  const rowSelection: TableProps<Row>['rowSelection'] =
    editableProject && (isAdmin || active)
      ? {
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys as Key[]),
        }
      : undefined

  const reviewerEmpty = !isAdmin && rowsAll.length === 0

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">考核人员列表</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <span className="font-medium text-gray-700">
              {project.name}（{project.year} 年）
            </span>
            <Tag color={PROJECT_STATUS_META[project.status].color}>{PROJECT_STATUS_META[project.status].label}</Tag>
            <span>创建人：{creatorName}</span>
            {project.startedAt && <span>启动于 {fmtDate(project.startedAt)}</span>}
          </div>
        </div>
        <Space>
          <span className="text-sm text-gray-500">切换项目</span>
          <Select
            style={{ minWidth: 230 }}
            value={project.id}
            onChange={(id) => navigate(`/project/${id}`)}
            options={switchOptions}
          />
        </Space>
      </div>

      {isAdmin && active && (
        <Card size="small">
          <div className="flex flex-wrap gap-x-12 gap-y-3">
            <div>
              <div className="text-xs text-gray-500">项目名称</div>
              <div className="mt-0.5 text-sm font-medium">{project.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">状态</div>
              <div className="mt-0.5">
                <Tag color={PROJECT_STATUS_META[project.status].color}>
                  {PROJECT_STATUS_META[project.status].label}
                </Tag>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">完成率</div>
              <div className="mt-0.5 text-sm font-medium">
                {confirmedCount}/{projectTotal} · {completionRate}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">待审核数</div>
              <div className="mt-0.5 text-sm font-medium">{toReviewCount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">待确认数</div>
              <div className="mt-0.5 text-sm font-medium">{toConfirmCount}</div>
            </div>
          </div>
        </Card>
      )}

      {isAdmin && project.status === 'pending' && (
        <Alert
          type="info"
          showIcon
          title="项目待启动"
          description={`可先导入考核人员、调整审核人；启动后全体人员进入「待提交」状态，并向每位填报人发送飞书消息。当前已配置 ${projectTotal} 人。`}
          action={
            <Popconfirm title="启动后将向全体填报人发送飞书消息，确定启动？" onConfirm={handleStart}>
              <Button type="primary">启动项目</Button>
            </Popconfirm>
          }
        />
      )}

      {project.status === 'ended' && (
        <Alert type="warning" showIcon title="项目已结束，数据只读，仅供查看。" />
      )}

      {reviewerEmpty ? (
        <Card>
          <Empty description="您在该项目中暂无负责的考核人员">
            <Button onClick={() => navigate('/reviewer')}>返回我的项目</Button>
          </Empty>
        </Card>
      ) : (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Space wrap>
              <Input
                allowClear
                placeholder="姓名"
                style={{ width: 140 }}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  clearSelection()
                }}
              />
              <Select
                allowClear
                placeholder="部门"
                style={{ width: 120 }}
                value={dept}
                onChange={(v) => {
                  setDept(v)
                  clearSelection()
                }}
                options={deptOptions}
              />
              <Select
                allowClear
                placeholder="状态"
                style={{ width: 160 }}
                value={status}
                onChange={(v) => {
                  setStatus(v)
                  clearSelection()
                }}
                options={PERSON_STATUS_OPTIONS}
              />
              <span className="text-sm text-gray-400">共 {rows.length} 人</span>
            </Space>
            <Space wrap>
              {isAdmin && active && (
                <>
                  <Dropdown menu={{ items: urgeItems, onClick: handleUrge }}>
                    <Button>批量催办</Button>
                  </Dropdown>
                  <Button onClick={openBatchConfirm}>批量发起确认</Button>
                  <Button danger onClick={() => openBatchReturn('admin')}>
                    批量退回
                  </Button>
                </>
              )}
              {isReviewerRole && active && (
                <>
                  <Button type="primary" onClick={handleBatchApprove}>
                    批量审核通过
                  </Button>
                  <Button danger onClick={() => openBatchReturn('reviewer')}>
                    批量退回
                  </Button>
                </>
              )}
              {isAdmin && editableProject && (
                <>
                  <Button onClick={() => setAddOpen(true)}>新增人员</Button>
                  <Button danger onClick={handleBatchRemove}>
                    批量移除
                  </Button>
                </>
              )}
            </Space>
          </div>

          <Table<Row>
            rowKey={(r) => r.p.id}
            columns={columns}
            dataSource={rows}
            rowSelection={rowSelection}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 人` }}
            expandable={{
              expandedRowRender: (r) =>
                r.p.kpis.length > 0 ? (
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={r.p.kpis}
                    columns={[
                      { title: '指标名称', dataIndex: 'name' },
                      { title: '权重', dataIndex: 'weight', width: 80, render: (v) => `${v}%` },
                      { title: '基本目标', dataIndex: 'basicTarget' },
                      { title: '挑战目标', dataIndex: 'challengeTarget' },
                    ]}
                  />
                ) : (
                  <span className="text-gray-400">暂无 KPI 指标（待填报）</span>
                ),
            }}
          />
        </Card>
      )}

      <Modal
        title="新增考核人员（从人事档案导入）"
        open={addOpen}
        okText="导入"
        cancelText="取消"
        onOk={handleAddOk}
        onCancel={() => {
          setAddOpen(false)
          setAddIds([])
        }}
      >
        <Select
          mode="multiple"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          value={addIds}
          onChange={setAddIds}
          placeholder="搜索姓名 / 部门 / 岗位"
          options={archiveOptions}
        />
        <div className="mt-3 text-sm text-gray-500">已选 {addIds.length} 人</div>
      </Modal>

      <ReturnNoteModal
        open={returnTarget !== null}
        title={returnTarget?.mode === 'admin' ? '管理员退回（回到审核环节）' : '审核人退回（退回填报人）'}
        onCancel={() => setReturnTarget(null)}
        onOk={handleReturnOk}
      />
    </div>
  )
}
