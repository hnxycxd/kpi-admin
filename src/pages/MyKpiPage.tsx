import {
  CheckCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  RollbackOutlined,
  SendOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App as AntApp,
  Button,
  Empty,
  Input,
  InputNumber,
  Progress,
  Result,
  Space,
  Table,
  type TableProps,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ReturnNoteModal } from '../components/ReturnNoteModal'
import { ProjectStatusTag } from '../components/StatusTags'
import { useKpi, useKpiActions } from '../store/KpiStore'
import {
  DEMO_EMPLOYEE_ID,
  DEMO_REVIEWER_ID,
  EMPLOYEE_EDITABLE_STATUSES,
  REVIEWABLE_STATUSES,
  WEIGHT_TOTAL,
  createId,
  emptyKpiRows,
  getReviewerName,
  totalWeight,
  type KpiItem,
  type Role,
} from '../types'

export default function MyKpiPage({ role }: { role: Role }) {
  const { projectId, memberId } = useParams()
  const { data } = useKpi()
  const { submitMemberKpis, reviewMember, confirmMember } = useKpiActions()
  const { message } = AntApp.useApp()

  const project = data.projects.find((item) => item.id === projectId)
  const member =
    role === 'employee'
      ? project?.members.find((item) => item.employeeId === DEMO_EMPLOYEE_ID)
      : project?.members.find((item) => item.id === memberId)

  const [kpis, setKpis] = useState<KpiItem[]>([])
  const [returnOpen, setReturnOpen] = useState(false)

  useEffect(() => {
    if (!member) {
      setKpis([])
      return
    }
    const stored = structuredClone(member.kpis)
    const needsDefaultRows =
      stored.length === 0 &&
      role === 'employee' &&
      project?.status === 'ongoing' &&
      EMPLOYEE_EDITABLE_STATUSES.includes(member.status)
    setKpis(needsDefaultRows ? emptyKpiRows(3) : stored)
  }, [member?.id, member?.status, member?.updatedAt, member, project?.status, role])

  const weight = useMemo(() => totalWeight(kpis), [kpis])

  const listPath = role === 'admin' ? '/admin' : role === 'reviewer' ? '/reviewer' : '/employee'
  const listLabel =
    role === 'admin' ? '考核项目管理' : role === 'reviewer' ? '待我审核' : '我的 KPI'

  if (!project) {
    return (
      <Result
        status='404'
        title='考核项目不存在'
        subTitle='该项目可能已被删除，请返回列表重新选择。'
        extra={
          <Link to={listPath}>
            <Button type='primary'>返回</Button>
          </Link>
        }
      />
    )
  }

  if (!member) {
    return (
      <Result
        status='403'
        title='未找到考核人员'
        subTitle={
          role === 'employee'
            ? '你不是该考核项目的参与人员，无法查看 KPI。'
            : '该考核人员不存在或已被移除。'
        }
        extra={
          <Link to={role === 'employee' ? '/employee' : `${listPath}/projects/${project.id}`}>
            <Button type='primary'>返回</Button>
          </Link>
        }
      />
    )
  }

  if (role === 'reviewer' && member.reviewerId !== DEMO_REVIEWER_ID) {
    return (
      <Result
        status='403'
        title='无权查看该员工 KPI'
        subTitle='该员工未分配给你审核，审核人只能查看自己负责的员工。'
        extra={
          <Link to={`/reviewer/projects/${project.id}`}>
            <Button type='primary'>返回人员列表</Button>
          </Link>
        }
      />
    )
  }

  if (role === 'employee' && member.employeeId !== DEMO_EMPLOYEE_ID) {
    return (
      <Result
        status='403'
        title='无权查看该员工 KPI'
        subTitle='填报人只能查看自己的 KPI。'
        extra={
          <Link to='/employee'>
            <Button type='primary'>返回我的 KPI</Button>
          </Link>
        }
      />
    )
  }

  const projectOngoing = project.status === 'ongoing'
  const canEmployeeEdit =
    role === 'employee' && projectOngoing && EMPLOYEE_EDITABLE_STATUSES.includes(member.status)
  const canReviewerEdit =
    role === 'reviewer' && projectOngoing && REVIEWABLE_STATUSES.includes(member.status)
  const canEdit = canEmployeeEdit || canReviewerEdit
  const reviewerName = getReviewerName(data.roster, member.reviewerId)

  const updateKpi = (id: string, patch: Partial<KpiItem>) => {
    setKpis((previous) => previous.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addKpi = () => {
    setKpis((previous) => [
      ...previous,
      {
        id: createId('kpi'),
        name: '',
        weight: 0,
        baseTarget: '',
        challengeTarget: '',
      },
    ])
  }

  const handleSubmit = () => {
    if (totalWeight(kpis) !== WEIGHT_TOTAL) {
      message.error(`权重合计需为 100% 才能提交（当前 ${totalWeight(kpis)}%）`)
      return
    }
    const result = submitMemberKpis(project.id, member.id, kpis)
    if (!result.ok) {
      message.error(result.error)
      return
    }
    message.success(`KPI 已提交，已通知审核人 ${reviewerName}（模拟飞书）`)
  }

  const handleApprove = () => {
    if (totalWeight(kpis) !== WEIGHT_TOTAL) {
      message.error(`权重合计需为 100% 才能审核通过（当前 ${totalWeight(kpis)}%）`)
      return
    }
    const result = reviewMember(project.id, member.id, kpis, 'approve')
    if (!result.ok) {
      message.error(result.error)
      return
    }
    message.success('审核已通过，已通知管理员发起员工确认（模拟飞书）')
  }

  const handleReturn = (note: string) => {
    const result = reviewMember(project.id, member.id, kpis, 'return', note)
    if (!result.ok) {
      message.error(result.error)
      return
    }
    setReturnOpen(false)
    message.success('已退回填报人重新提交（模拟飞书）')
  }

  const handleConfirm = () => {
    const result = confirmMember(project.id, member.id)
    if (!result.ok) {
      message.error(result.error)
      return
    }
    message.success('已确认考核结果，本次考核流程结束')
  }

  const columns: TableProps<KpiItem>['columns'] = [
    {
      title: '序号',
      key: 'index',
      width: 62,
      render: (_, __, index) => <span className='text-slate-400'>{index + 1}</span>,
    },
    {
      title: '关键绩效指标名称',
      dataIndex: 'name',
      width: 240,
      render: (value: string, item) =>
        canEdit ? (
          <Input
            value={value}
            placeholder='请输入指标名称'
            maxLength={50}
            onChange={(event) => updateKpi(item.id, { name: event.target.value })}
          />
        ) : (
          <span className={value ? 'font-medium text-slate-700' : 'text-slate-400'}>
            {value || '未填写'}
          </span>
        ),
    },
    {
      title: '权重',
      dataIndex: 'weight',
      width: 120,
      render: (value: number, item) =>
        canEdit ? (
          <InputNumber
            min={0}
            max={100}
            precision={0}
            value={value}
            addonAfter='%'
            style={{ width: '100%' }}
            onChange={(next) => updateKpi(item.id, { weight: Number(next) || 0 })}
          />
        ) : (
          <span className='font-semibold text-blue-600'>{value}%</span>
        ),
    },
    {
      title: '基本目标',
      dataIndex: 'baseTarget',
      width: 270,
      render: (value: string, item) =>
        canEdit ? (
          <Input.TextArea
            value={value}
            placeholder='例如：≥ 90%'
            autoSize={{ minRows: 1, maxRows: 3 }}
            maxLength={100}
            onChange={(event) => updateKpi(item.id, { baseTarget: event.target.value })}
          />
        ) : (
          <span className={value ? 'text-slate-600' : 'text-slate-400'}>{value || '—'}</span>
        ),
    },
    {
      title: '挑战目标',
      dataIndex: 'challengeTarget',
      width: 270,
      render: (value: string, item) =>
        canEdit ? (
          <Input.TextArea
            value={value}
            placeholder='例如：≥ 98%'
            autoSize={{ minRows: 1, maxRows: 3 }}
            maxLength={100}
            onChange={(event) => updateKpi(item.id, { challengeTarget: event.target.value })}
          />
        ) : (
          <span className={value ? 'text-slate-600' : 'text-slate-400'}>{value || '—'}</span>
        ),
    },
    ...(canEdit
      ? [
          {
            title: '操作',
            key: 'actions',
            width: 70,
            render: (_: unknown, item: KpiItem) => (
              <Button
                type='text'
                danger
                icon={<DeleteOutlined />}
                onClick={() => setKpis((previous) => previous.filter((kpi) => kpi.id !== item.id))}
              />
            ),
          },
        ]
      : []),
  ]

  return (
    <div>
      <div className='mb-3 flex items-center gap-2 text-sm text-slate-400'>
        {role === 'employee' ? (
          <Link to='/employee' className='transition-colors hover:text-blue-600'>
            {listLabel}
          </Link>
        ) : (
          <Link
            to={`${listPath}/projects/${project.id}`}
            className='transition-colors hover:text-blue-600'
          >
            {listLabel}
          </Link>
        )}
        <span>/</span>
        <span className='text-slate-600'>{member.name} 的 KPI</span>
      </div>

      {member.returnNote && (
        <Alert
          type='warning'
          showIcon
          className='mt-4'
          message='退回说明'
          description={member.returnNote}
        />
      )}

      <div className='mt-4 overflow-hidden rounded-xl border border-slate-200/80 bg-white'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4'>
          <div className='flex items-center justify-end gap-2'>
            <h3 className='text-base font-semibold text-slate-800'>{project.name}</h3>
            <ProjectStatusTag status={project.status} />
          </div>
          {canEdit && (
            <Button icon={<PlusOutlined />} onClick={addKpi}>
              新增指标
            </Button>
          )}
        </div>

        <Table<KpiItem>
          rowKey='id'
          columns={columns}
          dataSource={kpis}
          pagination={false}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无 KPI 指标' />,
          }}
        />

        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4'>
          <div className='min-w-[220px]'>
            <div className='flex items-center gap-3'>
              <span className='text-sm text-slate-500'>
                权重合计：
                <span
                  className={`ml-1 text-base font-semibold ${
                    weight === WEIGHT_TOTAL ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {weight}%
                </span>
                <span className='ml-1 text-xs text-slate-400'>/ 100%</span>
              </span>
              <Progress
                percent={Math.min(weight, 100)}
                showInfo={false}
                size='small'
                strokeColor={weight === WEIGHT_TOTAL ? '#059669' : '#ef4444'}
                className='!mb-0 w-32'
              />
            </div>
            {weight !== WEIGHT_TOTAL && (
              <div className='mt-1 text-xs text-red-500'>权重合计需为 100% 才能提交或审核通过</div>
            )}
          </div>

          <Space wrap>
            {canEmployeeEdit && (
              <Button type='primary' icon={<SendOutlined />} onClick={handleSubmit}>
                提交审核
              </Button>
            )}
            {role === 'employee' && projectOngoing && member.status === 'pending_confirm' && (
              <Button type='primary' icon={<CheckCircleOutlined />} onClick={handleConfirm}>
                确认考核结果
              </Button>
            )}
            {role === 'employee' && projectOngoing && member.status === 'confirmed' && (
              <span className='text-sm font-medium text-emerald-600'>已完成确认，流程结束</span>
            )}
            {role === 'employee' &&
              projectOngoing &&
              (member.status === 'pending_review' ||
                member.status === 'returned_review' ||
                member.status === 'approved') && (
                <span className='text-sm text-slate-500'>
                  {member.status === 'approved'
                    ? '审核已通过，等待管理员发起员工确认'
                    : '已提交，等待审核人审核'}
                </span>
              )}
            {canReviewerEdit && (
              <>
                <Button danger icon={<RollbackOutlined />} onClick={() => setReturnOpen(true)}>
                  退回
                </Button>
                <Button type='primary' icon={<CheckCircleOutlined />} onClick={handleApprove}>
                  审核通过
                </Button>
              </>
            )}
          </Space>
        </div>
      </div>


      <ReturnNoteModal
        open={returnOpen}
        title='退回 KPI'
        description='退回后填报人可重新编辑并提交，退回说明将展示给填报人。'
        onCancel={() => setReturnOpen(false)}
        onConfirm={handleReturn}
      />
    </div>
  )
}
