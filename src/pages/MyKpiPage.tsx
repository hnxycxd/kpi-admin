import { useEffect, useMemo, useState } from 'react'
import { App, Button, Empty, Select } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  LockOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { EMPLOYEE_MAP } from '../data/mock'
import { useAppStore } from '../store/AppStore'
import type { KpiItem } from '../types'
import { PageHeading } from '../components/PageHeading'
import { KpiEditor } from '../components/KpiEditor'
import { PersonAvatar } from '../components/PersonAvatar'
import {
  PROJECT_STATUS_META,
  ProjectStatusTag,
  StatusTag,
  blankKpis,
  countWeight,
  isPendingSubmit,
  isWeightComplete,
} from '../lib/status'

type BannerTone = 'info' | 'warning' | 'success' | 'violet' | 'muted'

interface Banner {
  tone: BannerTone
  icon: ReactNode
  title: string
  text: string
}

export function MyKpiPage() {
  const { me, projects, submitKpis, confirmRecord } = useAppStore()
  const { message } = App.useApp()
  const [selectedId, setSelectedId] = useState<string>()
  const [draft, setDraft] = useState<KpiItem[]>([])

  const myProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.status !== 'draft' &&
          project.participants.some((participant) => participant.employeeId === me?.id),
      ),
    [projects, me?.id],
  )

  const defaultProject = myProjects.find((project) => project.status === 'active') ?? myProjects[0]
  const project = myProjects.find((item) => item.id === selectedId) ?? defaultProject
  const participant = project?.participants.find((item) => item.employeeId === me?.id)
  const reviewer = participant ? EMPLOYEE_MAP[participant.reviewerId] : undefined

  useEffect(() => {
    if (!participant) {
      setDraft([])
      return
    }
    setDraft(
      participant.kpis.length > 0
        ? participant.kpis.map((kpi) => ({ ...kpi }))
        : blankKpis(3),
    )
  }, [participant?.id, participant?.status, project?.id])

  if (!me) return null

  if (!project || !participant) {
    return (
      <>
        <PageHeading
          eyebrow="绩效管理 / 我的考核"
          title="我的考核"
          description={`当前身份：${me.name} · ${me.dept} ${me.position}`}
        />
        <div className="panel empty-panel">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前没有参与中的考核项目" />
        </div>
      </>
    )
  }

  const editable = project.status === 'active' && isPendingSubmit(participant.status)
  const canConfirm = project.status === 'active' && participant.status === 'pending_confirm'
  const weightOk = isWeightComplete(draft)
  const totalWeight = countWeight(draft)

  const banner = ((): Banner => {
    if (project.status === 'ended') {
      return {
        tone: 'muted',
        icon: <LockOutlined />,
        title: '项目已结束',
        text: '本轮考核数据已归档，仅可查阅。',
      }
    }
    switch (participant.status) {
      case 'pending_submit':
        return {
          tone: 'info',
          icon: <ClockCircleOutlined />,
          title: '待填写',
          text: `请完成下方 KPI 指标后提交，系统会通过飞书通知审核人 ${reviewer?.name ?? ''}。`,
        }
      case 'returned_submit':
        return {
          tone: 'warning',
          icon: <ExclamationCircleOutlined />,
          title: '填报被退回',
          text: participant.returnNote
            ? `退回说明：${participant.returnNote} 请修改后重新提交。`
            : '审核人退回了本次填报，请修改后重新提交。',
        }
      case 'pending_review':
        return {
          tone: 'info',
          icon: <ClockCircleOutlined />,
          title: '审核中',
          text: `KPI 已提交给审核人 ${reviewer?.name ?? ''}，请等待审核结果。`,
        }
      case 'returned_review':
        return {
          tone: 'warning',
          icon: <ExclamationCircleOutlined />,
          title: '已退回待审核',
          text: '管理员退回了该记录，审核人将重新审核，请耐心等待。',
        }
      case 'approved':
        return {
          tone: 'success',
          icon: <CheckCircleOutlined />,
          title: '审核通过',
          text: '目标已通过审核，等待管理员发起员工确认。',
        }
      case 'pending_confirm':
        return {
          tone: 'violet',
          icon: <InfoCircleOutlined />,
          title: '待确认',
          text: '请核对最终 KPI 内容，确认后本轮考核即完成。',
        }
      case 'confirmed':
        return {
          tone: 'success',
          icon: <CheckCircleOutlined />,
          title: '已确认',
          text: `本轮考核已完成${participant.confirmedAt ? `，确认时间 ${participant.confirmedAt}` : ''}。`,
        }
      default:
        return {
          tone: 'info',
          icon: <InfoCircleOutlined />,
          title: '进行中',
          text: '请按流程完成当前考核环节。',
        }
    }
  })()

  const submit = () => {
    if (draft.length === 0) {
      message.warning('请至少添加一条 KPI 指标')
      return
    }
    if (draft.some((kpi) => !kpi.name.trim())) {
      message.warning('请填写所有指标名称')
      return
    }
    if (!weightOk) {
      message.error(`权重合计为 ${totalWeight}%，需调整为 100% 后才能提交`)
      return
    }
    submitKpis(participant.id, draft)
    message.success(`KPI 已提交，飞书消息已发送给审核人 ${reviewer?.name ?? ''}`)
  }

  const confirm = () => {
    if (confirmRecord(participant.id)) {
      message.success('已确认，本轮考核已完成')
    }
  }

  const footHint = (() => {
    if (project.status === 'ended') return '项目已结束，不可操作'
    if (participant.status === 'pending_review') return `等待 ${reviewer?.name ?? '审核人'} 审核`
    if (participant.status === 'returned_review') return '等待审核人重新审核'
    if (participant.status === 'approved') return '等待管理员发起员工确认'
    if (participant.status === 'confirmed') return '流程已完成'
    if (participant.status === 'pending_confirm') return '确认后不可再修改'
    return ''
  })()

  return (
    <>
      <PageHeading
        eyebrow="绩效管理 / 我的考核"
        title="我的考核"
        description={`当前身份：${me.name} · ${me.dept} ${me.position}`}
        actions={
          myProjects.length > 0 ? (
            <Select
              className="project-switch"
              value={project.id}
              options={myProjects.map((item) => ({
                value: item.id,
                label: `${item.name} · ${PROJECT_STATUS_META[item.status].label}`,
              }))}
              onChange={setSelectedId}
              popupMatchSelectWidth={360}
            />
          ) : null
        }
      />

      <div className="my-kpi-card">
        <div className="my-kpi-head">
          <div className="my-kpi-head-main">
            <div className="eyebrow">考核周期 · {project.year}</div>
            <h2 className="my-kpi-title">{project.name}</h2>
            <div className="my-kpi-meta">
              <PersonAvatar name={me.name} size="sm" />
              <span className="person-name">{me.name}</span>
              <span className="meta-sep">·</span>
              <span>{me.dept}</span>
              <span className="meta-sep">·</span>
              <span>审核人 {reviewer?.name ?? '—'}</span>
              <ProjectStatusTag status={project.status} />
            </div>
          </div>
          <StatusTag status={participant.status} />
        </div>

        <div className={`status-banner tone-${banner.tone}`}>
          <span className="banner-icon" aria-hidden>
            {banner.icon}
          </span>
          <div>
            <strong>{banner.title}</strong>
            <p>{banner.text}</p>
          </div>
        </div>

        <div className="kpi-block-head">
          <div>
            <h3>关键绩效指标</h3>
            <span>共 {draft.length} 项</span>
          </div>
          <span className={`weight-inline${weightOk ? ' is-ok' : ' is-bad'}`}>
            权重合计 <b>{totalWeight}%</b>
          </span>
        </div>

        <KpiEditor kpis={draft} editable={editable} onChange={setDraft} />

        <div className="my-kpi-foot">
          <div className="weight-summary">
            <span>权重合计</span>
            <strong className={weightOk ? 'is-ok' : 'is-bad'}>{totalWeight}%</strong>
            <span className="weight-hint">
              {weightOk ? '已满足提交要求' : '需调整为 100%'}
            </span>
          </div>
          <div className="foot-actions">
            {footHint ? <span className="foot-hint">{footHint}</span> : null}
            {editable ? (
              <Button type="primary" size="large" onClick={submit}>
                提交 KPI
              </Button>
            ) : null}
            {canConfirm ? (
              <Button type="primary" size="large" onClick={confirm}>
                确认 KPI
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
