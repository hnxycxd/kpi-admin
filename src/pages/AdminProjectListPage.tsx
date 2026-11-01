import { PlusOutlined } from '@ant-design/icons'
import { App as AntApp, Button, Empty, Space, Table, Typography, type TableProps } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { ProjectStatusTag } from '../components/StatusTags'
import { useKpi, useKpiActions } from '../store/KpiStore'
import type { Project } from '../types'

export default function AdminProjectListPage() {
  const { data } = useKpi()
  const { startProject, endProject, deleteProject } = useKpiActions()
  const { message, modal } = AntApp.useApp()
  const [formOpen, setFormOpen] = useState(false)

  const handleStart = (project: Project) => {
    if (project.members.length === 0) {
      message.warning('项目下暂无考核人员，请先进入详情添加人员')
      return
    }
    modal.confirm({
      title: '启动考核项目',
      content: `启动「${project.name}」后，${project.members.length} 名填报人将进入「待提交」状态，并收到填报通知（模拟飞书）。`,
      okText: '确认启动',
      cancelText: '取消',
      onOk: () => {
        const result = startProject(project.id)
        if (!result.ok) {
          message.error(result.error)
          return
        }
        message.success('项目已启动，已向填报人发送填报通知（模拟飞书）')
      },
    })
  }

  const handleEnd = (project: Project) => {
    modal.confirm({
      title: '结束考核项目',
      content: `结束后「${project.name}」将变为只读，所有人员状态不能继续流转。确定结束吗？`,
      okText: '确认结束',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const result = endProject(project.id)
        if (!result.ok) {
          message.error(result.error)
          return
        }
        message.success('考核项目已结束')
      },
    })
  }

  const handleDelete = (project: Project) => {
    modal.confirm({
      title: '删除考核项目',
      content: `确定删除「${project.name}」吗？项目下 ${project.members.length} 名人员及其 KPI 数据将一并删除，且无法恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        deleteProject(project.id)
        message.success('考核项目已删除')
      },
    })
  }

  const columns: TableProps<Project>['columns'] = [
    {
      title: '项目名称',
      dataIndex: 'name',
      width: 280,
      render: (name: string, project) => (
        <Link
          to={`/admin/projects/${project.id}`}
          className='font-medium text-slate-800 hover:text-blue-600'
        >
          {name}
        </Link>
      ),
    },
    {
      title: '考核年度',
      dataIndex: 'year',
      width: 100,
      render: (year: number) => <span className='text-slate-600'>{year} 年</span>,
    },
    {
      title: '项目状态',
      dataIndex: 'status',
      width: 110,
      render: (_, project) => <ProjectStatusTag status={project.status} />,
    },
    {
      title: '参与人数',
      dataIndex: 'members',
      width: 100,
      render: (_, project) => <span className='text-slate-600'>{project.members.length} 人</span>,
    },
    {
      title: '启动日期',
      dataIndex: 'startDate',
      width: 130,
      render: (startDate: string | null) => (
        <span className='text-slate-500'>{startDate ?? '—'}</span>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      width: 100,
      render: (creator: string) => <span className='text-slate-600'>{creator}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, project) => (
        <Space size={0} wrap>
          {project.status === 'pending' && (
            <Button type='link' size='small' onClick={() => handleStart(project)}>
              启动
            </Button>
          )}

          {project.status === 'ongoing' && (
            <Button type='link' size='small' danger onClick={() => handleEnd(project)}>
              结束
            </Button>
          )}
          {project.status !== 'ongoing' && (
            <Button type='link' size='small' danger onClick={() => handleDelete(project)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className='mb-5 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <Typography.Title level={3} className='mb-1'>
            考核项目管理
          </Typography.Title>
        </div>
        <Button type='primary' icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
          新增考核项目
        </Button>
      </div>

      {/* <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3">
          <div className="text-xs text-slate-400">全部项目</div>
          <div className="mt-1 text-xl font-semibold text-slate-800">
            {data.projects.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3">
          <div className="text-xs text-slate-400">进行中</div>
          <div className="mt-1 text-xl font-semibold text-blue-600">
            {data.projects.filter((project) => project.status === 'ongoing').length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3">
          <div className="text-xs text-slate-400">待启动</div>
          <div className="mt-1 text-xl font-semibold text-amber-600">
            {data.projects.filter((project) => project.status === 'pending').length}
          </div>
        </div>
      </div> */}

      <div className='overflow-hidden rounded-xl border border-slate-200/80 bg-white'>
        <Table<Project>
          rowKey='id'
          columns={columns}
          dataSource={data.projects}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 5,
            hideOnSinglePage: true,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 个项目`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description='暂无考核项目，点击右上角新增'
              />
            ),
          }}
        />
      </div>

      <ProjectFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
