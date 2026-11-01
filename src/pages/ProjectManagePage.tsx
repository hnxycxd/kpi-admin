import { App as AntdApp, Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useStore } from '../store'
import { ADMIN_ID } from '../data/mock'
import { PROJECT_STATUS_META, employeeLabel, fmtDate } from '../utils/kit'
import type { Project } from '../types'

interface Row extends Project {
  participantCount: number
  creatorName: string
}

export default function ProjectManagePage() {
  const navigate = useNavigate()
  const { state, currentUser, addProject, deleteProject, endProject } = useStore()
  const { message } = AntdApp.useApp()
  const [keyword, setKeyword] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm<{ name: string; year: number; employeeIds: string[] }>()
  const selectedIds = Form.useWatch('employeeIds', form) ?? []

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const me = state.employees.find((e) => e.id === ADMIN_ID)

  const rows: Row[] = state.projects
    .filter((p) => p.name.toLowerCase().includes(keyword.trim().toLowerCase()))
    .map((p) => ({
      ...p,
      participantCount: state.participants.filter((pt) => pt.projectId === p.id).length,
      creatorName: state.employees.find((e) => e.id === p.creatorId)?.name ?? '—',
    }))

  const employeeOptions = state.employees.map((e) => ({ value: e.id, label: employeeLabel(e) }))

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      const imported = addProject(values.name, values.year, values.employeeIds ?? [])
      setCreateOpen(false)
      form.resetFields()
      if (imported > 0) {
        message.success(`项目已创建，并从人事档案导入 ${imported} 名考核人员`)
      } else {
        message.success('项目已创建（未导入人员，可稍后在人员列表中添加）')
      }
    } catch {
      // 表单校验失败
    }
  }

  const columns: TableProps<Row>['columns'] = [
    {
      title: '项目名称',
      dataIndex: 'name',
      render: (_, r) => (
        <Button type="link" className="px-0 font-medium" onClick={() => navigate(`/project/${r.id}`)}>
          {r.name}
        </Button>
      ),
    },
    { title: '考核年度', dataIndex: 'year', width: 100, render: (v: number) => `${v} 年` },
    {
      title: '项目状态',
      dataIndex: 'status',
      width: 100,
      render: (v: Project['status']) => <Tag color={PROJECT_STATUS_META[v].color}>{PROJECT_STATUS_META[v].label}</Tag>,
    },
    { title: '参与人数', dataIndex: 'participantCount', width: 100, render: (v: number) => `${v} 人` },
    { title: '启动日期', dataIndex: 'startedAt', width: 110, render: (v?: string) => fmtDate(v) },
    { title: '创建人', dataIndex: 'creatorName', width: 90 },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, r) => (
        <Space size={4}>
          <Button type="link" size="small" className="px-0" onClick={() => navigate(`/project/${r.id}`)}>
            进入项目
          </Button>
          {r.status === 'active' && (
            <Popconfirm
              title="结束后项目将变为只读，确定结束？"
              onConfirm={() => {
                endProject(r.id)
                message.success(`已结束项目「${r.name}」`)
              }}
            >
              <Button type="link" size="small" className="px-0">
                结束项目
              </Button>
            </Popconfirm>
          )}
          {r.status !== 'active' && (
            <Popconfirm
              title={`确定删除项目「${r.name}」及其人员数据？`}
              onConfirm={() => {
                deleteProject(r.id)
                message.success(`已删除项目「${r.name}」`)
              }}
            >
              <Button type="link" size="small" className="px-0" danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">考核项目管理</h2>
          <div className="mt-1 text-sm text-gray-500">
            管理员：{me?.name ?? '—'} · 支持新增 / 删除 / 查询，进行中的项目不可删除
          </div>
        </div>
        <Space>
          <Input.Search
            placeholder="搜索项目名称"
            allowClear
            style={{ width: 220 }}
            onSearch={setKeyword}
            onChange={(e) => {
              if (!e.target.value) setKeyword('')
            }}
          />
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            新增项目
          </Button>
        </Space>
      </div>

      <Card>
        <Table<Row>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 个项目` }}
        />
      </Card>

      <Modal
        title="新增考核项目"
        open={createOpen}
        okText="创建"
        cancelText="取消"
        onOk={handleCreate}
        onCancel={() => setCreateOpen(false)}
      >
        <Form form={form} layout="vertical" initialValues={{ year: 2026, employeeIds: [] }}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="例如：2026 年度绩效考核" maxLength={30} />
          </Form.Item>
          <Form.Item name="year" label="考核年度" rules={[{ required: true, message: '请选择考核年度' }]}>
            <Select options={[2024, 2025, 2026, 2027].map((y) => ({ value: y, label: `${y} 年` }))} />
          </Form.Item>
          <Form.Item label="导入考核人员（从人事档案）">
            <Form.Item name="employeeIds" noStyle>
              <Select
                mode="multiple"
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="搜索并选择人员，也可稍后在人员列表中添加"
                options={employeeOptions}
              />
            </Form.Item>
            <div className="mt-2 text-xs text-gray-500">已选 {selectedIds.length} 人，创建后显示导入人数</div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
