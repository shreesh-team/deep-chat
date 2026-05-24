'use client'

import { useState } from 'react'
import { PROVIDERS, getApiKey, setApiKey, removeApiKey, type Provider } from '@/lib/models'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const [keys, setKeys] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const { id } of PROVIDERS) {
      initial[id] = getApiKey(id) ?? ''
    }
    return initial
  })
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  function handleSave(provider: Provider) {
    const key = keys[provider]?.trim()
    if (!key) return
    setApiKey(provider, key)
    setSaved(prev => ({ ...prev, [provider]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [provider]: false })), 2000)
  }

  function handleRemove(provider: Provider) {
    removeApiKey(provider)
    setKeys(prev => ({ ...prev, [provider]: '' }))
  }

  const providerIcons: Record<string, string> = {
    anthropic: 'A',
    openai:    'O',
    google:    'G',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
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

        <div className="p-6 space-y-5">
          <p className="text-xs text-gray-400">
            API keys are stored locally in your browser and never sent to our servers.
          </p>

          {PROVIDERS.map(({ id, label }) => {
            const isConfigured = !!getApiKey(id)
            return (
              <div key={id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {providerIcons[id]}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  {isConfigured && (
                    <span className="flex items-center gap-1 text-xs text-green-600 ml-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Configured
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={keys[id] ?? ''}
                    onChange={e => setKeys(prev => ({ ...prev, [id]: e.target.value }))}
                    placeholder={isConfigured ? '••••••••••••••••' : `${label} API key`}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 transition-colors font-mono"
                  />
                  <button
                    onClick={() => handleSave(id as Provider)}
                    disabled={!keys[id]?.trim()}
                    className="px-3 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 rounded-xl transition-colors shrink-0"
                  >
                    {saved[id] ? 'Saved ✓' : 'Save'}
                  </button>
                  {isConfigured && (
                    <button
                      onClick={() => handleRemove(id as Provider)}
                      className="px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 border border-gray-200 rounded-xl transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
