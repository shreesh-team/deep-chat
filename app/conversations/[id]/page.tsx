'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import { getFriendlyError } from '@/lib/errorMessages'
import type { ConversationDetail, Message } from '@/types'
import ConversationView from '@/components/ConversationView'
import { useConversations } from '../layout'

interface PageState {
  loadedId: string | null
  detail: ConversationDetail | null
  error: string | null
}

interface Props {
  params: Promise<{ id: string }>
}

export default function ConversationDetailPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const { refresh, addToast } = useConversations()
  const [retryCount, setRetryCount] = useState(0)
  const [state, setState] = useState<PageState>({ loadedId: null, detail: null, error: null })

  // Derive loading: when the loaded id doesn't match the current id
  const isLoading = state.loadedId !== id && !state.error
  const isWrongId = state.detail !== null && state.detail.id !== id

  useEffect(() => {
    let active = true

    api.getConversation(id)
      .then(data => {
        if (!active) return
        setState({ loadedId: id, detail: data, error: null })
      })
      .catch(err => {
        if (!active) return
        const code = err instanceof ApiError ? err.code : 'INTERNAL_ERROR'
        if (code === 'CONVERSATION_NOT_FOUND') {
          addToast(getFriendlyError(code), 'error')
          router.replace('/conversations')
          return
        }
        const message = getFriendlyError(code, err instanceof Error ? err.message : undefined)
        setState({ loadedId: id, detail: null, error: message })
      })

    return () => { active = false }
  }, [id, retryCount, addToast, router])

  function handleUpdate(updated: Partial<ConversationDetail> & { messages?: Message[] }) {
    setState(prev =>
      prev.detail ? { ...prev, detail: { ...prev.detail, ...updated } } : prev,
    )
  }

  if (isLoading || isWrongId) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="animate-pulse bg-gray-100 rounded h-4 w-40 mb-2" />
          <div className="animate-pulse bg-gray-100 rounded h-3 w-24" />
        </div>
        <div className="flex-1 px-6 py-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className="animate-pulse bg-gray-100 rounded-2xl h-10 w-48" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-red-500">{state.error}</p>
        <button
          onClick={() => {
            setState({ loadedId: null, detail: null, error: null })
            setRetryCount(c => c + 1)
          }}
          className="text-sm text-gray-500 hover:text-gray-900 underline transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!state.detail) return null

  return (
    <ConversationView
      detail={state.detail}
      onUpdate={handleUpdate}
      onRefreshList={refresh}
      addToast={addToast}
    />
  )
}
