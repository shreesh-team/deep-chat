import type { Conversation, ConversationDetail, Message } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let token: string | null = null
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('user')
      if (raw) token = JSON.parse(raw).token ?? null
    } catch {
      // ignore
    }
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Could not reach server. Check your connection.', 0)
  }

  if (!res.ok) {
    let code = 'INTERNAL_ERROR'
    let message = 'Something went wrong. Please try again.'
    try {
      const body = await res.json()
      code = body?.error?.code ?? code
      message = body?.error?.message ?? message
    } catch {
      // ignore parse errors
    }
    throw new ApiError(code, message, res.status)
  }

  return res.json() as Promise<T>
}

export const api = {
  getConversations: () =>
    apiFetch<Conversation[]>('/api/conversations'),

  getConversation: (id: string) =>
    apiFetch<ConversationDetail>(`/api/conversations/${id}`),

  createConversation: (body: { model: string; provider: string; title?: string }) =>
    apiFetch<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  sendMessage: (id: string, content: string) =>
    apiFetch<Message>(`/api/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ role: 'user', content }),
    }),

  cancelConversation: (id: string) =>
    apiFetch<Conversation>(`/api/conversations/${id}/cancel`, {
      method: 'PATCH',
    }),

  streamChat: async (
    conversationId: string,
    context: Array<{ role: 'user' | 'assistant'; content: string }>,
    apiKey: string,
    onChunk: (text: string) => void,
  ): Promise<void> => {
    let token: string | null = null
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('user')
        if (raw) token = JSON.parse(raw).token ?? null
      } catch {
        // ignore
      }
    }

    let res: Response
    try {
      res = await fetch(`${BASE_URL}/api/conversations/${conversationId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ api_key: apiKey, context }),
      })
    } catch {
      throw new ApiError('NETWORK_ERROR', 'Could not reach server. Check your connection.', 0)
    }

    if (!res.ok) {
      let code = 'INTERNAL_ERROR'
      let message = 'Something went wrong. Please try again.'
      try {
        const body = await res.json()
        code = body?.error?.code ?? code
        message = body?.error?.message ?? message
      } catch {
        // ignore
      }
      throw new ApiError(code, message, res.status)
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()

        if (payload === '[DONE]') return

        const event = JSON.parse(payload) as { text?: string; error?: string }
        if (event.error) throw new ApiError('STREAM_ERROR', event.error, 0)
        if (event.text) onChunk(event.text)
      }
    }
  },
}
