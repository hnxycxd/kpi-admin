import { SearchOutlined } from '@ant-design/icons'
import { Input, Table } from 'antd'
import { useMemo, useState } from 'react'
import { getReviewerName, type HrEmployee } from '../types'

interface RosterPickerProps {
  candidates: HrEmployee[]
  roster: HrEmployee[]
  value: string[]
  onChange: (keys: string[], rows: HrEmployee[]) => void
}

export function RosterPicker({
  candidates,
  roster,
  value,
  onChange,
}: RosterPickerProps) {
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return candidates
    return candidates.filter((employee) =>
      [employee.name, employee.dept, employee.position]
        .join(' ')
        .toLowerCase()
        .includes(text),
    )
  }, [candidates, keyword])

  const selectedRows = useMemo(
    () => candidates.filter((employee) => value.includes(employee.id)),
    [candidates, value],
  )

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="搜索姓名 / 部门 / 岗位"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="max-w-[260px]"
        />
        <span className="text-xs text-slate-500">
          已选择 <span className="font-semibold text-blue-600">{selectedRows.length}</span> 人
        </span>
      </div>
      <Table<HrEmployee>
        rowKey="id"
        size="small"
        bordered
        dataSource={filtered}
        pagination={false}
        scroll={{ y: 220 }}
        locale={{ emptyText: '暂无可导入的人事档案人员' }}
        rowSelection={{
          selectedRowKeys: value,
          preserveSelectedRowKeys: true,
          onChange: (keys) => {
            const nextKeys = keys.map(String)
            onChange(
              nextKeys,
              candidates.filter((employee) => nextKeys.includes(employee.id)),
            )
          },
        }}
        columns={[
          { title: '姓名', dataIndex: 'name', width: 100 },
          { title: '部门', dataIndex: 'dept', width: 100 },
          { title: '岗位', dataIndex: 'position', width: 140 },
          {
            title: '默认审核人',
            dataIndex: 'reviewerId',
            render: (reviewerId: string | null) => (
              <span className="text-slate-500">
                {getReviewerName(roster, reviewerId)}
              </span>
            ),
          },
        ]}
      />
    </div>
  )
}
