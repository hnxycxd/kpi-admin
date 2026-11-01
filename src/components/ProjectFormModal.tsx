import { App as AntApp, Form, Input, InputNumber, Modal } from 'antd'
import { useEffect, useState } from 'react'
import { RosterPicker } from '../components/RosterPicker'
import { useKpi, useKpiActions } from '../store/KpiStore'
import type { HrEmployee } from '../types'

interface ProjectFormModalProps {
  open: boolean
  onClose: () => void
}

interface ProjectFormValues {
  name: string
  year: number
}

export function ProjectFormModal({ open, onClose }: ProjectFormModalProps) {
  const [form] = Form.useForm<ProjectFormValues>()
  const { data } = useKpi()
  const { createProject } = useKpiActions()
  const { message } = AntApp.useApp()
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [selectedRows, setSelectedRows] = useState<HrEmployee[]>([])

  const candidates = data.roster.filter((employee) => !employee.isReviewer)

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      name: '',
      year: new Date().getFullYear(),
    })
    setSelectedKeys([])
    setSelectedRows([])
  }, [open, form])

  const handleFinish = (values: ProjectFormValues) => {
    const result = createProject({
      name: values.name,
      year: values.year,
      employees: selectedRows,
    })
    if (!result.ok) {
      message.error(result.error)
      return
    }
    message.success(
      selectedRows.length > 0
        ? `项目已创建，已导入 ${selectedRows.length} 人`
        : '项目已创建，可稍后添加考核人员',
    )
    onClose()
  }

  return (
    <Modal
      open={open}
      title="新增考核项目"
      width={760}
      okText="创建项目"
      cancelText="取消"
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
        className="pt-2"
      >
        <div className="grid gap-x-4 sm:grid-cols-[1fr_180px]">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请填写考核项目名称' }]}
          >
            <Input placeholder="例如：2026年度核心岗位绩效考核" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="year"
            label="考核年度"
            rules={[{ required: true, message: '请填写考核年度' }]}
          >
            <InputNumber
              min={2000}
              max={2100}
              precision={0}
              style={{ width: '100%' }}
              placeholder="2026"
            />
          </Form.Item>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-700">
                从人事档案导入人员
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                支持多选；审核人按人事档案的默认归属自动匹配，可在详情页修改。
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              导入人数 {selectedRows.length}
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
        </div>
      </Form>
    </Modal>
  )
}
