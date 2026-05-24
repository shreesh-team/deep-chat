'use client'

import { useState, FormEvent } from 'react'
import { api, ApiError } from '@/lib/api'
import { getFriendlyError } from '@/lib/errorMessages'
import { getAvailableModels, getProviderForModel, PROVIDERS, type ModelInfo } from '@/lib/models'
import type { Conversation } from '@/types'

interface Props {
  onClose: () => void
  onCreated: (conversation: Conversation) => void
  onOpenSettings: () => void
}

export default function NewConversationModal({ onClose, onCreated, onOpenSettings }: Props) {
  const [availableModels] = useState<ModelInfo[]>(() => getAvailableModels())
  const [model, setModel] = useState<string>(() => {
    const models = getAvailableModels()
    return models.length > 0 ? models[0].model : ''
  })
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Group models by provider for the optgroup display
  const grouped = PROVIDERS.map(p => ({
    ...p,
    models: availableModels.filter(m => m.provider === p.id),
  })).filter(g => g.models.length > 0)

  const hasModels = availableModels.length > 0
  const selectedProvider = model ? getProviderForModel(model) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!model) return
    setLoading(true)
    setError(null)
    try {
      const provider = getProviderForModel(model)
      const conversation = await api.createConversation({
        model,
        provider,
        title: title.trim() || undefined,
      })
      onCreated(conversation)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'INTERNAL_ERROR'
      setError(getFriendlyError(code, err instanceof Error ? err.message : undefined))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">New Conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="16" y2="16" />
              <line x1="16" y1="2" x2="2" y2="16" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {!hasModels ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-gray-500">
                No providers configured. Add an API key in Settings first.
              </p>
              <button
                onClick={() => { onClose(); onOpenSettings() }}
                className="text-sm font-medium text-gray-900 underline hover:no-underline transition-all"
              >
                Open Settings
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Model <span className="text-red-400">*</span>
                </label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors"
                >
                  {grouped.map(group => (
                    <optgroup key={group.id} label={group.label}>
                      {group.models.map(m => (
                        <option key={m.model} value={m.model}>{m.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {selectedProvider && selectedProvider !== 'unknown' && (
                  <p className="text-xs text-gray-400">
                    Provider: <span className="font-medium text-gray-600 capitalize">{selectedProvider}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Title <span className="text-gray-300">(optional)</span>
                </label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Optional title"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50 rounded-xl transition-colors mt-2"
              >
                {loading ? 'Creating…' : 'Create Conversation'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
