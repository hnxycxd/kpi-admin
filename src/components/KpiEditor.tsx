import { Button, Empty, Input, InputNumber, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { KpiItem } from '../types'
import { blankKpi } from '../lib/status'

interface KpiEditorProps {
  kpis: KpiItem[]
  editable?: boolean
  onChange?: (kpis: KpiItem[]) => void
}

export function KpiEditor({ kpis, editable = false, onChange }: KpiEditorProps) {
  const patchRow = (index: number, patch: Partial<KpiItem>) => {
    if (!onChange) return
    onChange(kpis.map((kpi, current) => (current === index ? { ...kpi, ...patch } : kpi)))
  }

  const removeRow = (index: number) => {
    if (!onChange) return
    onChange(kpis.filter((_, current) => current !== index))
  }

  const columns: TableColumnsType<KpiItem> = [
    {
      title: '序号',
      key: 'index',
      width: 42,
      render: (_value, _record, index) => (
        <span className="kpi-index">{String(index + 1).padStart(2, '0')}</span>
      ),
    },
    {
      title: '关键绩效指标名称',
      dataIndex: 'name',
      width: 172,
      render: (value: string, _record, index) =>
        editable ? (
          <Input
            variant="borderless"
            value={value}
            placeholder="如：需求交付及时率"
            aria-label={`第 ${index + 1} 条指标名称`}
            onChange={(event) => patchRow(index, { name: event.target.value })}
          />
        ) : (
          <span className={value ? 'kpi-name' : 'kpi-name is-empty'}>{value || '未填写'}</span>
        ),
    },
    {
      title: '权重',
      dataIndex: 'weight',
      width: 84,
      align: 'right',
      render: (value: number, _record, index) =>
        editable ? (
          <div className="weight-cell">
            <InputNumber
              variant="borderless"
              min={0}
              max={100}
              precision={0}
              controls={false}
              value={value}
              aria-label={`第 ${index + 1} 条指标权重`}
              onChange={(next) => patchRow(index, { weight: Number(next) || 0 })}
            />
            <span>%</span>
          </div>
        ) : (
          <span className="kpi-weight">{value}%</span>
        ),
    },
    {
      title: '基本目标',
      dataIndex: 'basicTarget',
      width: 196,
      render: (value: string, _record, index) =>
        editable ? (
          <Input
            variant="borderless"
            value={value}
            placeholder="描述保底目标"
            aria-label={`第 ${index + 1} 条基本目标`}
            onChange={(event) => patchRow(index, { basicTarget: event.target.value })}
          />
        ) : (
          <span className={value ? 'kpi-target' : 'kpi-target is-empty'}>{value || '—'}</span>
        ),
    },
    {
      title: '挑战目标',
      dataIndex: 'challengeTarget',
      width: 196,
      render: (value: string, _record, index) =>
        editable ? (
          <Input
            variant="borderless"
            value={value}
            placeholder="描述挑战目标"
            aria-label={`第 ${index + 1} 条挑战目标`}
            onChange={(event) => patchRow(index, { challengeTarget: event.target.value })}
          />
        ) : (
          <span className={value ? 'kpi-target' : 'kpi-target is-empty'}>{value || '—'}</span>
        ),
    },
  ]

  if (editable) {
    columns.push({
      title: '',
      key: 'actions',
      width: 44,
      align: 'center',
      render: (_value, _record, index) => (
        <Button
          type="text"
          size="small"
          danger
          className="row-delete"
          icon={<DeleteOutlined />}
          aria-label={`删除第 ${index + 1} 条指标`}
          onClick={() => removeRow(index)}
        />
      ),
    })
  }

  return (
    <div className={`kpi-editor${editable ? ' is-editing' : ''}`}>
      <Table<KpiItem>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={kpis}
        pagination={false}
        scroll={{ x: 734 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={editable ? '还没有指标，点击下方按钮添加' : '暂无 KPI 指标'}
            />
          ),
        }}
      />
      {editable ? (
        <Button
          type="dashed"
          block
          className="kpi-add"
          icon={<PlusOutlined />}
          disabled={!onChange}
          onClick={() => onChange?.([...kpis, blankKpi()])}
        >
          新增一条指标
        </Button>
      ) : null}
    </div>
  )
}
