'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import Modal from './Modal'

interface InfoDialogProps {
  isVisible: boolean
  onClose: () => void
  title: string
  message: string
  link?: string
}

export default function InfoDialog({
  isVisible,
  onClose,
  title,
  message,
  link,
}: InfoDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (link) {
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose} title={title}>
      <div>
        <p className="text-gray-600 mb-4">{message}</p>
        {link && (
          <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg">
            <input
              type="text"
              readOnly
              value={link}
              className="flex-grow bg-transparent focus:outline-none text-sm"
            />
            <button onClick={handleCopy} className="p-2 text-gray-500 hover:text-gray-700">
              {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        )}
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="btn-primary">
            OK
          </button>
        </div>
      </div>
    </Modal>
  )
}