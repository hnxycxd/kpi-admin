import { Input, Modal } from 'antd'
import { useState } from 'react'

interface Props {
  open: boolean
  title: string
  confirmText?: string
  onCancel: () => void
  onOk: (note: string) => void
}

export default function ReturnNoteModal({ open, title, confirmText = '确定退回', onCancel, onOk }: Props) {
  const [note, setNote] = useState('')

  const reset = () => setNote('')

  return (
    <Modal
      open={open}
      title={title}
      okText={confirmText}
      cancelText="取消"
      onOk={() => {
        const value = note.trim()
        reset()
        onOk(value)
      }}
      onCancel={() => {
        reset()
        onCancel()
      }}
    >
      <div className="mb-2 text-sm text-gray-500">退回说明（选填），将随飞书消息发送给对方：</div>
      <Input.TextArea
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="例如：权重分配与部门年度目标不一致，请调整后重新提交。"
        maxLength={200}
        showCount
      />
    </Modal>
  )
}
