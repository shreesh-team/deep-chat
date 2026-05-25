'use client'

import { useMemo, useRef, useState } from 'react'
import type { ConversationDetail, Message } from '@/types'
import { getTitle } from '@/types'
import { api, ApiError } from '@/lib/api'
import { getFriendlyError } from '@/lib/errorMessages'
import { getApiKey } from '@/lib/models'
import StatusBadge from './StatusBadge'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ConfirmDialog from './ConfirmDialog'
import { useEffect } from 'react'

interface Props {
  detail: ConversationDetail
  onUpdate: (updated: Partial<ConversationDetail> & { messages?: Message[] }) => void
  onRefreshList: () => void
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export default function ConversationView({ detail, onUpdate, onRefreshList, addToast }: Props) {
  // Derive sorted messages from prop — avoids sync setState in effect
  const sortedBase = useMemo(
    () => [...detail.messages].sort((a, b) => a.sequence - b.sequence),
    [detail.messages],
  )
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const displayMessages = [...sortedBase, ...optimisticMessages]

  const [sending, setSending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages.length])

  async function handleSend(content: string) {
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: detail.id,
      role: 'user',
      content,
      sequence: (displayMessages[displayMessages.length - 1]?.sequence ?? -1) + 1,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    }

    setOptimisticMessages([optimistic])
    setSending(true)

    try {
      const saved = await api.sendMessage(detail.id, content)

      // Commit user message to local state before streaming begins
      onUpdate({ messages: [...detail.messages, saved] })

      // Build context for the LLM (user + assistant turns only)
      const context = [...detail.messages, saved]
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      // Show an empty streaming assistant bubble
      const streamId = `stream-${Date.now()}`
      const streamingAssistant: Message = {
        id: streamId,
        conversation_id: detail.id,
        role: 'assistant',
        content: '',
        sequence: saved.sequence + 1,
        created_at: new Date().toISOString(),
        isOptimistic: true,
      }
      setOptimisticMessages([streamingAssistant])

      await api.streamChat(detail.id, context, getApiKey('google') ?? '', (text) => {
        setOptimisticMessages(prev =>
          prev.map(m => m.id === streamId ? { ...m, content: m.content + text } : m),
        )
      })

      // Stream complete — re-fetch to replace optimistic with the DB-saved assistant message
      const updated = await api.getConversation(detail.id)
      setOptimisticMessages([])
      onUpdate({ messages: updated.messages })
      onRefreshList()
    } catch (err) {
      setOptimisticMessages([])
      const code = err instanceof ApiError ? err.code : 'INTERNAL_ERROR'
      addToast(getFriendlyError(code, err instanceof Error ? err.message : undefined), 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleCancel() {
    setShowConfirm(false)
    setCancelling(true)
    try {
      const updated = await api.cancelConversation(detail.id)
      onUpdate({ status: updated.status })
      onRefreshList()
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'INTERNAL_ERROR'
      addToast(getFriendlyError(code, err instanceof Error ? err.message : undefined), 'error')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 truncate">{getTitle(detail)}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono text-gray-400">{detail.model}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{detail.provider}</span>
          </div>
        </div>
        <StatusBadge status={detail.status} />
        {detail.status === 'active' && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={cancelling}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50 shrink-0"
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>

      {/* Cancelled banner */}
      {detail.status === 'cancelled' && (
        <div className="bg-amber-50 border-b border-amber-100 text-amber-700 text-sm px-6 py-2 shrink-0">
          This conversation has been cancelled.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {displayMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">No messages yet. Say something!</p>
          </div>
        ) : (
          displayMessages.map(m => <MessageBubble key={m.id} message={m} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput status={detail.status} sending={sending} onSend={handleSend} />

      {/* Confirm cancel dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Cancel conversation?"
          message="You won't be able to send more messages in this conversation."
          confirmLabel="Cancel Conversation"
          onConfirm={handleCancel}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
