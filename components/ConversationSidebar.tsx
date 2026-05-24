'use client'

import type { Conversation } from '@/types'
import ConversationItem from './ConversationItem'

interface Props {
  conversations: Conversation[]
  loading: boolean
  activeId: string | null
  onSelect: (id: string) => void
  onNewConversation: () => void
  onOpenSettings: () => void
}

function SkeletonRow() {
  return (
    <div className="px-3 py-2.5 space-y-2">
      <div className="animate-pulse bg-gray-100 rounded h-4 w-3/4" />
      <div className="animate-pulse bg-gray-100 rounded h-3 w-1/2" />
    </div>
  )
}

export default function ConversationSidebar({
  conversations,
  loading,
  activeId,
  onSelect,
  onNewConversation,
  onOpenSettings,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-xl transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="7" y1="1" x2="7" y2="13" />
            <line x1="1" y1="7" x2="13" y2="7" />
          </svg>
          New Conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 mb-3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-gray-400">No conversations yet.</p>
            <p className="text-xs text-gray-300 mt-1">Start one!</p>
          </div>
        ) : (
          conversations.map(c => (
            <ConversationItem
              key={c.id}
              conversation={c}
              isActive={c.id === activeId}
              onClick={() => onSelect(c.id)}
            />
          ))
        )}
      </div>

      {/* Settings footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </button>
      </div>
    </div>
  )
}
