
'use client'

import Modal from './Modal'

interface ActionDialogProps {
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
}

export default function ActionDialog({
  isVisible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
}: ActionDialogProps) {
  return (
    <Modal isVisible={isVisible} onClose={onClose} title={title}>
      <div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="btn-danger"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
