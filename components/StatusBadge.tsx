import type { ConversationStatus } from '@/types'

interface Props {
  status: ConversationStatus
}

const config: Record<ConversationStatus, { dot: string; label: string; text: string }> = {
  active: { dot: 'bg-green-500', label: 'Active', text: 'text-green-700' },
  cancelled: { dot: 'bg-red-400', label: 'Cancelled', text: 'text-red-600' },
  archived: { dot: 'bg-gray-300', label: 'Archived', text: 'text-gray-500' },
}

export default function StatusBadge({ status }: Props) {
  const { dot, label, text } = config[status]
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${text}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
