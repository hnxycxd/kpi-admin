import { Tag, Tooltip } from 'antd'
import {
  MEMBER_STATUS_META,
  PROJECT_STATUS_META,
  type MemberStatus,
  type ProjectStatus,
} from '../types'

export function MemberStatusTag({
  status,
  returnNote,
}: {
  status: MemberStatus
  returnNote?: string
}) {
  const meta = MEMBER_STATUS_META[status]
  const tag = <Tag color={meta.color}>{meta.label}</Tag>
  return returnNote ? (
    <Tooltip title={`退回说明：${returnNote}`}>
      <span className="cursor-help">{tag}</span>
    </Tooltip>
  ) : (
    tag
  )
}

export function ProjectStatusTag({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status]
  return <Tag color={meta.color}>{meta.label}</Tag>
}
