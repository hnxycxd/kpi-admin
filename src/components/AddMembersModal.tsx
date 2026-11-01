import { App as AntApp, Modal } from 'antd'
import { useEffect, useState } from 'react'
import { RosterPicker } from '../components/RosterPicker'
import { useKpi, useKpiActions } from '../store/KpiStore'
import type { HrEmployee, Project } from '../types'

interface AddMembersModalProps {
  open: boolean
  project: Project
  onClose: () => void
}

export function AddMembersModal({
  open,
  project,
  onClose,
}: AddMembersModalProps) {
  const { data } = useKpi()
  const { addMembers } = useKpiActions()
  const { message } = AntApp.useApp()
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [selectedRows, setSelectedRows] = useState<HrEmployee[]>([])

  const existingIds = new Set(project.members.map((member) => member.employeeId))
  const candidates = data.roster.filter(
    (employee) => !employee.isReviewer && !existingIds.has(employee.id),
  )

  useEffect(() => {
    if (!open) return
    setSelectedKeys([])
    setSelectedRows([])
  }, [open])

  const handleAdd = () => {
    const result = addMembers(project.id, selectedRows)
    if (!result.ok) {
      message.error(result.error)
      return
    }
    message.success(`已添加 ${selectedRows.length} 名考核人员`)
    onClose()
  }

  return (
    <Modal
      open={open}
      title="添加考核人员"
      width={760}
      okText="添加人员"
      cancelText="取消"
      okButtonProps={{ disabled: selectedRows.length === 0 }}
      onCancel={onClose}
      onOk={handleAdd}
      destroyOnHidden
    >
      <div className="mb-3 flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-slate-500">
          从人事档案中选择人员，添加后状态为「待提交」，默认生成 3 条空白 KPI。
        </p>
        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
          已选择 {selectedRows.length} 人
        </span>
      </div>
      <RosterPicker
        candidates={candidates}
        roster={data.roster}
        value={selectedKeys}
        onChange={(keys, rows) => {
          setSelectedKeys(keys)
          setSelectedRows(rows)
        }}
      />
    </Modal>
  )
}
