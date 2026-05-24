'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { Conversation } from '@/types'
import { useToast } from '@/lib/useToast'
import ConversationSidebar from '@/components/ConversationSidebar'
import NewConversationModal from '@/components/NewConversationModal'
import ToastContainer from '@/components/ToastContainer'

interface ConversationsContextValue {
  conversations: Conversation[]
  loading: boolean
  refresh: () => Promise<void>
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export const ConversationsContext = createContext<ConversationsContextValue>({
  conversations: [],
  loading: true,
  refresh: async () => {},
  addToast: () => {},
})

export function useConversations() {
  return useContext(ConversationsContext)
}

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const initialized = useRef(false)

  // Derive active ID from current URL — no effect needed
  const activeId = pathname.match(/\/conversations\/([^/]+)/)?.[1] ?? null

  // Auth guard
  useEffect(() => {
    if (typeof window === 'undefined') return
    const user = localStorage.getItem('user')
    if (!user) router.replace('/login')
  }, [router])

  const refresh = useCallback(async () => {
    try {
      const data = await api.getConversations()
      setConversations(data)
    } catch {
      // silently ignore list refresh errors
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    api.getConversations()
      .then(data => {
        setConversations(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  function handleSelect(id: string) {
    router.push(`/conversations/${id}`)
  }

  function handleCreated(conversation: Conversation) {
    setShowModal(false)
    setConversations(prev => [conversation, ...prev])
    router.push(`/conversations/${conversation.id}`)
  }

  return (
    <ConversationsContext.Provider value={{ conversations, loading, refresh, addToast }}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 shrink-0 border-r border-gray-100 flex flex-col h-full bg-white">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900 tracking-tight">deep-chat</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationSidebar
              conversations={conversations}
              loading={loading}
              activeId={activeId}
              onSelect={handleSelect}
              onNewConversation={() => setShowModal(true)}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {showModal && (
        <NewConversationModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ConversationsContext.Provider>
  )
}
