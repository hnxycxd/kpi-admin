import { ReloadOutlined } from '@ant-design/icons'
import { App as AntApp, Button, Popconfirm } from 'antd'
import { useKpi } from '../store/KpiStore'

export function ResetDemoButton({ compact = false }: { compact?: boolean }) {
  const { reset } = useKpi()
  const { message } = AntApp.useApp()

  return (
    <Popconfirm
      title="重置演示数据"
      description="所有操作记录将恢复为初始模拟数据，确定继续吗？"
      okText="重置"
      cancelText="取消"
      okButtonProps={{ danger: true }}
      onConfirm={() => {
        reset()
        message.success('演示数据已重置')
      }}
    >
      <Button
        type="text"
        size={compact ? 'small' : 'middle'}
        icon={<ReloadOutlined />}
        className="!text-slate-500 hover:!text-slate-800"
      >
        重置数据
      </Button>
    </Popconfirm>
  )
}
