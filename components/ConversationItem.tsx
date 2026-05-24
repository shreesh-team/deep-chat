import type { Conversation } from '@/types'
import { getTitle } from '@/types'
import { relativeTime, absoluteTime } from '@/lib/relativeTime'
import StatusBadge from './StatusBadge'

interface Props {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}

export default function ConversationItem({ conversation, isActive, onClick }: Props) {
  const title = getTitle(conversation)
  const isUntitled = conversation.title === null

  return (
    <button
      onClick={onClick}
      title={absoluteTime(conversation.updated_at)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
        isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span
          className={`text-sm font-medium truncate leading-snug ${
            isUntitled ? 'text-gray-400 italic' : 'text-gray-900'
          } ${isActive ? 'text-gray-900' : ''}`}
        >
          {title}
        </span>
        <span className="shrink-0 text-xs text-gray-400 mt-0.5">
          {relativeTime(conversation.updated_at)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-mono truncate">{conversation.model}</span>
        <StatusBadge status={conversation.status} />
      </div>
    </button>
  )
}
