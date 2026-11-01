import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Empty, Input, Modal } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { EMPLOYEES } from '../data/mock'
import { PersonAvatar } from './PersonAvatar'

interface PersonPickerProps {
  selectedIds: string[]
  disabledIds?: string[]
  onChange: (ids: string[]) => void
  height?: number
  showSearch?: boolean
}

export function PersonPicker({
  selectedIds,
  disabledIds = [],
  onChange,
  height = 300,
  showSearch = true,
}: PersonPickerProps) {
  const [keyword, setKeyword] = useState('')
  const disabledSet = useMemo(() => new Set(disabledIds), [disabledIds])
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const people = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (!query) return EMPLOYEES
    return EMPLOYEES.filter((employee) =>
      `${employee.name} ${employee.dept} ${employee.position}`.toLowerCase().includes(query),
    )
  }, [keyword])

  const toggle = (id: string) => {
    if (disabledSet.has(id)) return
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((value) => value !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="person-picker">
      <div className="picker-bar">
        {showSearch ? (
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索姓名、部门或岗位"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        ) : null}
        <span className="picker-count">
          已选 <b>{selectedIds.length}</b> 人
        </span>
      </div>
      <div className="picker-list" style={{ maxHeight: height }}>
        {people.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的人员" />
        ) : (
          people.map((employee) => {
            const disabled = disabledSet.has(employee.id)
            const checked = selectedSet.has(employee.id)
            return (
              <div
                key={employee.id}
                role="checkbox"
                aria-checked={checked}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                className={`picker-row${checked ? ' is-checked' : ''}${disabled ? ' is-disabled' : ''}`}
                onClick={() => toggle(employee.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggle(employee.id)
                  }
                }}
              >
                <span onClick={(event) => event.stopPropagation()}>
                  <Checkbox checked={checked} disabled={disabled} />
                </span>
                <PersonAvatar name={employee.name} size="sm" />
                <span className="picker-person">
                  <strong>{employee.name}</strong>
                  <small>{employee.position}</small>
                </span>
                <span className="picker-dept">{employee.dept}</span>
                {disabled ? <span className="picker-flag">已在项目中</span> : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

interface ImportPeopleModalProps {
  open: boolean
  title: string
  description?: string
  existingIds?: string[]
  onCancel: () => void
  onConfirm: (ids: string[]) => void
}

export function ImportPeopleModal({
  open,
  title,
  description,
  existingIds = [],
  onCancel,
  onConfirm,
}: ImportPeopleModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (open) setSelectedIds([])
  }, [open])

  return (
    <Modal
      open={open}
      title={title}
      width={640}
      onCancel={onCancel}
      destroyOnHidden
      footer={
        <div className="modal-footer">
          <span className="modal-count">
            {selectedIds.length > 0 ? `已选择 ${selectedIds.length} 人` : '尚未选择人员'}
          </span>
          <div className="modal-footer-actions">
            <Button onClick={onCancel}>取消</Button>
            <Button
              type="primary"
              disabled={selectedIds.length === 0}
              onClick={() => onConfirm(selectedIds)}
            >
              确认导入
            </Button>
          </div>
        </div>
      }
    >
      {description ? <p className="modal-desc">{description}</p> : null}
      <PersonPicker
        selectedIds={selectedIds}
        disabledIds={existingIds}
        onChange={setSelectedIds}
        height={320}
      />
    </Modal>
  )
}
