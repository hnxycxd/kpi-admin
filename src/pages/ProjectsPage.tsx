import { useState } from 'react'
import { App, Button, Empty, Input, Modal, Select, Table, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { EMPLOYEE_MAP } from '../data/mock'
import { useAppStore } from '../store/AppStore'
import type { Project } from '../types'
import { PageHeading } from '../components/PageHeading'
import { PersonAvatar } from '../components/PersonAvatar'
import { PersonPicker } from '../components/ImportPeopleModal'
import { ProjectStatusTag } from '../lib/status'

const YEAR_OPTIONS = [2025, 2026, 2027, 2028].map((year) => ({
  value: year,
  label: `${year} 年度`,
}))

export function ProjectsPage() {
  const { projects, createProject, deleteProject, endProject } = useAppStore()
  const { message, modal } = App.useApp()
  const navigate = useNavigate()

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [year, setYear] = useState(2027)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const activeCount = projects.filter((project) => project.status === 'active').length
  const draftCount = projects.filter((project) => project.status === 'draft').length

  const openCreate = () => {
    setName('')
    setYear(2027)
    setSelectedIds([])
    setCreateOpen(true)
  }

  const submitCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      message.warning('请填写项目名称')
      return
    }
    if (selectedIds.length === 0) {
      message.warning('请至少从人事档案导入 1 名考核人员')
      return
    }
    const project = createProject({ name: trimmed, year, employeeIds: selectedIds })
    setCreateOpen(false)
    message.success(`已创建「${trimmed}」，导入 ${selectedIds.length} 名考核人员`)
    navigate(`/people/${project.id}`)
  }

  const confirmDelete = (project: Project) => {
    modal.confirm({
      title: '删除考核项目',
      content: `删除「${project.name}」后不可恢复，该项目下 ${project.participants.length} 名人员的考核记录将一并移除。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        if (deleteProject(project.id)) message.success(`已删除「${project.name}」`)
      },
    })
  }

  const confirmEnd = (project: Project) => {
    modal.confirm({
      title: '结束考核项目',
      content: `结束后「${project.name}」将转为只读，所有填报、审核与确认操作都无法继续。`,
      okText: '结束项目',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        if (endProject(project.id)) message.success(`「${project.name}」已结束，数据转为只读`)
      },
    })
  }

  const columns: TableColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      render: (value: string, project) => (
        <div className="project-cell">
          <button
            type="button"
            className="project-link"
            onClick={() => navigate(`/people/${project.id}`)}
          >
            {value}
          </button>
        </div>
      ),
    },
    {
      title: '考核年度',
      dataIndex: 'year',
      width: 110,
      render: (value: number) => `${value} 年度`,
    },
    {
      title: '项目状态',
      dataIndex: 'status',
      width: 110,
      render: (value: Project['status']) => <ProjectStatusTag status={value} />,
    },
    {
      title: '参与人数',
      dataIndex: 'participants',
      width: 110,
      render: (value: Project['participants']) => (
        <span className="tabular">{value.length} 人</span>
      ),
    },
    {
      title: '启动日期',
      dataIndex: 'startedAt',
      width: 130,
      render: (value?: string) => (
        <span className={value ? 'tabular' : 'text-muted'}>{value ?? '未启动'}</span>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      width: 130,
      render: (value: string) => {
        const creator = EMPLOYEE_MAP[value]
        if (!creator) return '—'
        return (
          <div className="person-inline">
            <PersonAvatar name={creator.name} size="sm" />
            <span>{creator.name}</span>
          </div>
        )
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 190,
      render: (_value, project) => (
        <div className="row-actions">
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/people/${project.id}`)}
          >
            查看人员
          </Button>
          {project.status === 'active' ? (
            <Button type="link" size="small" onClick={() => confirmEnd(project)}>
              结束项目
            </Button>
          ) : null}
          <Tooltip title={project.status === 'active' ? '进行中的项目不可删除' : undefined}>
            <span>
              <Button
                type="link"
                size="small"
                danger
                disabled={project.status === 'active'}
                onClick={() => confirmDelete(project)}
              >
                删除
              </Button>
            </span>
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading
        eyebrow="绩效管理 / 考核项目"
        title="考核项目管理"
        description={
          <span>
            共 {projects.length} 个项目 · {activeCount} 个进行中 · {draftCount} 个待启动
          </span>
        }
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建考核项目
          </Button>
        }
      />

      <div className="panel table-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">项目列表</h2>
            <p className="panel-sub">项目创建后不可修改，只能启动、结束或删除（进行中项目不可删除）。</p>
          </div>
        </div>
        <Table<Project>
          rowKey="id"
          columns={columns}
          dataSource={projects}
          pagination={false}
          scroll={{ x: 980 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无考核项目，点击右上角新建"
              />
            ),
          }}
        />
      </div>

      <Modal
        open={createOpen}
        title="新建考核项目"
        width={680}
        okText="创建项目"
        cancelText="取消"
        onOk={submitCreate}
        onCancel={() => setCreateOpen(false)}
        destroyOnHidden
      >
        <div className="field-grid">
          <div className="field">
            <label htmlFor="project-name">项目名称</label>
            <Input
              id="project-name"
              maxLength={60}
              placeholder="如：2027 年度 H1 绩效目标考核"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="project-year">考核年度</label>
            <Select
              id="project-year"
              options={YEAR_OPTIONS}
              value={year}
              onChange={setYear}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="picker-head">
          <span>从人事档案导入人员</span>
          <span className="picker-head-count">
            已导入 <b>{selectedIds.length}</b> 人
          </span>
        </div>
        <PersonPicker
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          height={300}
        />
        <p className="modal-tip">导入人员默认状态为「待提交」，审核人取自人事档案中的默认上级。</p>
      </Modal>
    </>
  )
}
