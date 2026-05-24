export type ConversationStatus = 'active' | 'cancelled' | 'archived'
export type MessageRole = 'user' | 'assistant' | 'system'

export interface Conversation {
  id: string
  title: string | null
  model: string
  provider: string
  status: ConversationStatus
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  sequence: number
  created_at: string
  isOptimistic?: boolean
}

export interface ConversationDetail extends Omit<Conversation, 'created_at'> {
  messages: Message[]
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}

export function getTitle(conversation: Pick<Conversation, 'title'>): string {
  return conversation.title ?? 'Untitled'
}
