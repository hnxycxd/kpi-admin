import { Alert, App as AntdApp, Button, Card, Empty, Input, InputNumber, Space, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useStore } from '../store'
import ReturnNoteModal from '../components/ReturnNoteModal'
import { PERSON_STATUS_META, emptyKpiRows, sumWeight, validateKpis } from '../utils/kit'
import type { KpiItem } from '../types'

export default function MyKpiPage() {
  const { projectId, participantId } = useParams()
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const store = useStore()
  const { state, currentUser } = store

  const [draft, setDraft] = useState<KpiItem[]>([])
  const [returnOpen, setReturnOpen] = useState(false)

  const participant = state.participants.find((p) => p.id === participantId)
  const project = state.projects.find((p) => p.id === projectId)
  const employee = participant ? state.employees.find((e) => e.id === participant.employeeId) : undefined
  const reviewer = participant ? state.employees.find((e) => e.id === participant.reviewerId) : undefined

  useEffect(() => {
    if (participant) {
      setDraft(participant.kpis.length > 0 ? participant.kpis.map((k) => ({ ...k })) : emptyKpiRows())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId, participant?.status, participant?.kpis])

  if (!currentUser) {
    return <Navigate to="/" replace />
  }
  if (!participant || !project || !employee) {
    return (
      <div className="mx-auto max-w-[900px] px-6 py-16">
        <Empty description="记录不存在或已被移除">
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </Empty>
      </div>
    )
  }

  const active = project.status === 'active'
  const isSelf = currentUser.employeeId === participant.employeeId
  const isReviewer = currentUser.employeeId === participant.reviewerId

  const canEdit =
    active &&
    ((isSelf && (participant.status === 'toSubmit' || participant.status === 'returnedToSubmit')) ||
      (isReviewer && (participant.status === 'toReview' || participant.status === 'returnedToReview')))
  const canConfirm = active && isSelf && participant.status === 'toConfirm'

  const sum = sumWeight(draft)

  const update = (idx: number, patch: Partial<KpiItem>) => {
    setDraft((d) => d.map((k, i) => (i === idx ? { ...k, ...patch } : k)))
  }

  const addRow = () => {
    if (draft.length >= 10) {
      message.warning('最多支持 10 条指标')
      return
    }
    setDraft((d) => [...d, { id: `${Date.now()}`, name: '', weight: null, basicTarget: '', challengeTarget: '' }])
  }

  const removeRow = (idx: number) => {
    setDraft((d) => d.filter((_, i) => i !== idx))
  }

  const handleSubmit = () => {
    const err = validateKpis(draft)
    if (err) {
      message.error(err)
      return
    }
    store.submitKpis(participant.id, draft)
    message.success(`提交成功，已发送飞书消息给审核人「${reviewer?.name ?? '—'}」`)
  }

  const handleApprove = () => {
    const err = validateKpis(draft)
    if (err) {
      message.error(`无法通过：${err}`)
      return
    }
    store.approveKpis(participant.id, draft)
    message.success('审核通过，等待管理员发起员工确认')
  }

  const handleReturnOk = (note: string) => {
    store.reviewerReturn(participant.id, note)
    setReturnOpen(false)
    message.success(`已退回，并已发送飞书消息给「${employee.name}」`)
  }

  const handleConfirm = () => {
    store.confirmKpi(participant.id)
    message.success('确认成功，本条考核流程已完成')
  }

  const editColumns: TableProps<KpiItem>['columns'] = [
    {
      title: '指标名称',
      render: (_, r, idx) => (
        <Input
          value={r.name}
          maxLength={50}
          placeholder="例如：订单接口平均响应时间"
          onChange={(e) => update(idx, { name: e.target.value })}
        />
      ),
    },
    {
      title: '权重',
      width: 140,
      render: (_, r, idx) => (
        <InputNumber
          min={0}
          max={100}
          value={r.weight}
          addonAfter="%"
          style={{ width: 130 }}
          onChange={(v) => update(idx, { weight: v })}
        />
      ),
    },
    {
      title: '基本目标',
      render: (_, r, idx) => (
        <Input
          value={r.basicTarget}
          maxLength={60}
          placeholder="例如：≥ 90%"
          onChange={(e) => update(idx, { basicTarget: e.target.value })}
        />
      ),
    },
    {
      title: '挑战目标',
      render: (_, r, idx) => (
        <Input
          value={r.challengeTarget}
          maxLength={60}
          placeholder="例如：≥ 98%"
          onChange={(e) => update(idx, { challengeTarget: e.target.value })}
        />
      ),
    },
    {
      title: '操作',
      width: 70,
      render: (_, _r, idx) => (
        <Button
          type="link"
          size="small"
          className="px-0"
          danger
          disabled={draft.length <= 1}
          onClick={() => removeRow(idx)}
        >
          删除
        </Button>
      ),
    },
  ]

  const readColumns: TableProps<KpiItem>['columns'] = [
    { title: '指标名称', dataIndex: 'name' },
    { title: '权重', dataIndex: 'weight', width: 90, render: (v) => `${v}%` },
    { title: '基本目标', dataIndex: 'basicTarget' },
    { title: '挑战目标', dataIndex: 'challengeTarget' },
  ]

  const backPath = currentUser.role === 'filler' ? '/' : `/project/${projectId}`

  return (
    <div className="mx-auto max-w-[1000px] space-y-4 px-6 py-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">{employee.name} · 我的 KPI</h2>
              <Tag color={PERSON_STATUS_META[participant.status].color}>
                {PERSON_STATUS_META[participant.status].label}
              </Tag>
              {!canEdit && !canConfirm && <Tag>阅读模式</Tag>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
              <span>部门：{employee.department}</span>
              <span>岗位：{employee.position}</span>
              <span>
                考核项目：{project.name}（{project.year} 年）
              </span>
              <span>审核人：{reviewer?.name ?? '—'}</span>
            </div>
          </div>
          <Button onClick={() => navigate(backPath)}>返回</Button>
        </div>
      </Card>

      {(participant.status === 'returnedToSubmit' || participant.status === 'returnedToReview') && (
        <Alert
          type="warning"
          showIcon
          title={`退回说明（${participant.returnedBy === 'admin' ? '管理员' : '审核人'}退回）`}
          description={participant.returnNote?.trim() || '未填写退回说明'}
        />
      )}

      {project.status === 'pending' && <Alert type="info" showIcon title="项目待启动，暂不可填写。" />}
      {project.status === 'ended' && <Alert type="warning" showIcon title="项目已结束，仅供查看。" />}

      {canEdit ? (
        <Card
          title={isSelf ? 'KPI 指标（填报中）' : 'KPI 指标（审核中，可增删改）'}
          extra={
            <Space>
              <span className="text-sm">
                合计权重{' '}
                <span className={sum === 100 ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>
                  {sum}%
                </span>
              </span>
              <Button onClick={addRow} disabled={draft.length >= 10}>
                新增指标
              </Button>
            </Space>
          }
        >
          <Table<KpiItem> rowKey="id" size="middle" pagination={false} dataSource={draft} columns={editColumns} />
        </Card>
      ) : (
        <Card title={canConfirm ? 'KPI 指标（待确认）' : 'KPI 指标（阅读模式）'}>
          <Table<KpiItem>
            rowKey="id"
            size="middle"
            pagination={false}
            dataSource={participant.kpis}
            columns={readColumns}
            locale={{ emptyText: '暂无 KPI 指标（待填报）' }}
          />
        </Card>
      )}

      {canEdit && isSelf && (
        <div className="flex justify-end">
          <Button type="primary" onClick={handleSubmit}>
            提交（权重合计须为 100%）
          </Button>
        </div>
      )}
      {canEdit && isReviewer && (
        <div className="flex justify-end gap-3">
          <Button danger onClick={() => setReturnOpen(true)}>
            退回
          </Button>
          <Button type="primary" onClick={handleApprove}>
            审核通过
          </Button>
        </div>
      )}
      {canConfirm && (
        <div className="flex justify-end">
          <Button type="primary" onClick={handleConfirm}>
            确认 KPI，完成考核
          </Button>
        </div>
      )}

      <ReturnNoteModal
        open={returnOpen}
        title={`退回给填报人「${employee.name}」`}
        onCancel={() => setReturnOpen(false)}
        onOk={handleReturnOk}
      />
    </div>
  )
}
