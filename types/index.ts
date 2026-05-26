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

export interface InferenceLog {
  id: string
  conversation_id: string | null
  model: string
  provider: string
  status: 'success' | 'error'
  latency_ms: number | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  input_preview: string | null
  output_preview: string | null
  error_message: string | null
  request_at: string
  response_at: string | null
  created_at: string
}

export interface InferenceLogsPage {
  items: InferenceLog[]
  total: number
  page: number
  page_size: number
}
