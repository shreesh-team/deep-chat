import type { Message } from '@/types'

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const { role, content, isOptimistic } = message

  if (role === 'system') {
    return (
      <div className="mx-auto text-center text-xs text-gray-400 italic px-2 py-1">
        {content}
      </div>
    )
  }

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className={`max-w-[70%] bg-gray-900 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed ${
            isOptimistic ? 'opacity-60' : ''
          }`}
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[70%] bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed">
        {content}
      </div>
    </div>
  )
}
