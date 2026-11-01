import { useEffect, useState } from 'react'
import { App, Button, Drawer, Input, Modal } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { EMPLOYEE_MAP } from '../data/mock'
import { useAppStore } from '../store/AppStore'
import {
  canEditKpis,
  canReturnKpis,
  countWeight,
  isWeightComplete,
  RETURN_TARGET,
  STATUS_META,
  StatusTag,
} from '../lib/status'
import type { Participant, Project } from '../types'
import { KpiEditor } from './KpiEditor'
import { PersonAvatar } from './PersonAvatar'

interface KpiDrawerProps {
  open: boolean
  project: Project
  participant: Participant
  onClose: () => void
}

export function KpiDrawer({ open, project, participant, onClose }: KpiDrawerProps) {
  const { role, me, saveKpis, approve, returnRecord } = useAppStore()
  const { message } = App.useApp()
  const [draft, setDraft] = useState(participant.kpis)
  const [returnOpen, setReturnOpen] = useState(false)
  const [note, setNote] = useState('')

  const employee = EMPLOYEE_MAP[participant.employeeId]
  const reviewer = EMPLOYEE_MAP[participant.reviewerId]
  const total = countWeight(draft)
  const weightOk = isWeightComplete(draft)
  const canEdit = canEditKpis(
    me?.id,
    project.status,
    participant.reviewerId,
    participant.status,
  )
  const canReview = canEdit
  const canReturn = canReturnKpis(
    role,
    me?.id,
    project.status,
    participant.reviewerId,
    participant.status,
  )
  const returnTarget = RETURN_TARGET[participant.status]

  useEffect(() => {
    if (!open) return
    setDraft(participant.kpis.map((kpi) => ({ ...kpi })))
    setNote('')
    setReturnOpen(false)
  }, [open, participant.id, participant.status])

  const handleSave = () => {
    saveKpis(participant.id, draft)
    message.success('KPI 修改已保存')
  }

  const handleApprove = () => {
    if (!weightOk) {
      message.error(`权重合计为 ${total}%，需调整为 100% 后才能审核通过`)
      return
    }
    saveKpis(participant.id, draft)
    approve([participant.id])
    message.success('已审核通过，飞书消息已发送给管理员')
    onClose()
  }

  const handleReturn = () => {
    const target = returnRecord(participant.id, note)
    if (!target) return
    const recipient = target === 'returned_submit' ? employee.name : reviewer.name
    const recipientRole = target === 'returned_submit' ? '填报人' : '审核人'
    message.success(`已退回，飞书消息已发送给${recipientRole} ${recipient}`)
    setReturnOpen(false)
    setNote('')
    onClose()
  }

  const footerHint = (() => {
    if (project.status === 'ended') return '项目已结束，仅可查阅'
    if (canEdit || canReturn) {
      if (participant.status === 'approved') return '已审核通过，如需调整请退回至审核环节'
      return null
    }
    if (participant.status === 'pending_submit') return '等待填报人提交 KPI'
    if (participant.status === 'pending_confirm') return '等待填报人确认最终结果'
    if (participant.status === 'confirmed') return '员工已确认，流程已完成'
    return null
  })()

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        size={800}
        destroyOnHidden
        className="kpi-drawer"
        title={<span className="drawer-title">KPI 指标明细</span>}
        extra={<StatusTag status={participant.status} />}
        styles={{
          header: { padding: '20px 24px' },
          body: { padding: '4px 24px 24px' },
          footer: { padding: '16px 24px' },
        }}
        footer={
          <div className="drawer-foot">
            <span className="drawer-foot-hint">{footerHint}</span>
            <div className="drawer-foot-actions">
              {canEdit ? (
                <Button onClick={handleSave} disabled={draft.length === 0}>
                  保存修改
                </Button>
              ) : null}
              {canReturn ? (
                <Button danger onClick={() => setReturnOpen(true)}>
                  退回
                </Button>
              ) : null}
              {canReview ? (
                <Button type="primary" onClick={handleApprove}>
                  审核通过
                </Button>
              ) : null}
            </div>
          </div>
        }
      >
        <div className="drawer-person">
          <PersonAvatar name={employee.name} size="lg" />
          <div className="drawer-person-main">
            <div className="drawer-person-name">{employee.name}</div>
            <div className="drawer-person-role">
              {employee.dept} · {employee.position}
            </div>
          </div>
          <div className="drawer-person-reviewer">
            <span>审核人</span>
            <strong>{reviewer.name}</strong>
          </div>
        </div>

        <div className="drawer-meta">
          <div>
            <span>提交时间</span>
            <strong>{participant.submittedAt ?? '—'}</strong>
          </div>
          <div>
            <span>审核时间</span>
            <strong>{participant.reviewedAt ?? '—'}</strong>
          </div>
          <div>
            <span>确认时间</span>
            <strong>{participant.confirmedAt ?? '—'}</strong>
          </div>
        </div>

        {participant.returnNote ? (
          <div className="return-note-box">
            <InfoCircleOutlined />
            <div>
              <strong>退回说明</strong>
              <p>{participant.returnNote}</p>
            </div>
          </div>
        ) : null}

        <div className="drawer-section-head">
          <span>指标清单 · 共 {draft.length} 项</span>
          <span className={`weight-inline${weightOk ? ' is-ok' : ' is-bad'}`}>
            权重合计 <b>{total}%</b>
            {weightOk ? '' : ' / 100%'}
          </span>
        </div>

        <KpiEditor kpis={draft} editable={canEdit} onChange={setDraft} />
      </Drawer>

      <Modal
        open={returnOpen}
        title="退回 KPI"
        okText="确认退回"
        cancelText="取消"
        onCancel={() => setReturnOpen(false)}
        onOk={handleReturn}
        okButtonProps={{ danger: true }}
        destroyOnHidden
        width={520}
      >
        <p className="modal-desc">
          退回后状态将变为「
          {returnTarget ? STATUS_META[returnTarget].label : '—'}
          」，系统会向对方发送飞书通知。退回说明选填。
        </p>
        <Input.TextArea
          rows={3}
          maxLength={200}
          showCount
          placeholder="说明需要调整的内容，选填"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Modal>
    </>
  )
}
