import { Alert, Input, Modal } from 'antd'
import { useEffect, useState } from 'react'

interface ReturnNoteModalProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  onCancel: () => void
  onConfirm: (note: string) => void
}

export function ReturnNoteModal({
  open,
  title,
  description,
  confirmText = '确认退回',
  onCancel,
  onConfirm,
}: ReturnNoteModalProps) {
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) setNote('')
  }, [open])

  return (
    <Modal
      open={open}
      title={title}
      okText={confirmText}
      cancelText="取消"
      okButtonProps={{ danger: true }}
      onCancel={onCancel}
      onOk={() => onConfirm(note.trim())}
      width={540}
    >
      <Alert type="warning" showIcon message={description} className="mb-4" />
      <Input.TextArea
        rows={3}
        maxLength={200}
        showCount
        placeholder="填写退回说明（选填），将展示给对方"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
    </Modal>
  )
}
