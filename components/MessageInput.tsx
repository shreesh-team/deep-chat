'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import type { ConversationStatus } from '@/types'

interface Props {
  status: ConversationStatus
  sending: boolean
  onSend: (content: string) => void
}

export default function MessageInput({ status, sending, onSend }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isDisabled = status !== 'active' || sending

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || isDisabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  return (
    <div className="border-t border-gray-100 p-4">
      {status === 'cancelled' && (
        <p className="text-xs text-gray-400 text-center mb-2">
          This conversation has been cancelled.
        </p>
      )}
      <div className={`flex items-end gap-3 bg-gray-100 rounded-2xl px-4 py-3 ${isDisabled ? 'opacity-60' : ''}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={status === 'active' ? 'Type a message…' : 'Conversation is cancelled'}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-900 placeholder-gray-400 leading-relaxed"
          style={{ maxHeight: '160px' }}
        />
        <button
          onClick={submit}
          disabled={isDisabled || !value.trim()}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-gray-900 text-white disabled:opacity-40 hover:bg-gray-700 transition-colors"
          aria-label="Send message"
        >
          {sending ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <circle cx="7" cy="7" r="5" strokeOpacity="0.3" />
              <path d="M7 2 A5 5 0 0 1 12 7" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="12" x2="7" y2="2" />
              <polyline points="3,6 7,2 11,6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
