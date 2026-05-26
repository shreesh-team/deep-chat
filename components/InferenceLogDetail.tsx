'use client'

import type { InferenceLog } from '@/types'
import { absoluteTime } from '@/lib/relativeTime'

interface Props {
  log: InferenceLog
  onClose: () => void
}

function TokenRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-900">{value ?? '—'}</span>
    </div>
  )
}

export default function InferenceLogDetail({ log, onClose }: Props) {
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              log.status === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                log.status === 'success' ? 'bg-green-500' : 'bg-red-400'
              }`}
            />
            {log.status === 'success' ? 'Success' : 'Error'}
          </span>
          <span className="text-sm font-medium text-gray-900">{log.model}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-50"
          aria-label="Close detail panel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="3" x2="13" y2="13" />
            <line x1="13" y1="3" x2="3" y2="13" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Timestamps */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Timing</p>
          <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Request sent</span>
              <span className="text-xs text-gray-900">{absoluteTime(log.request_at)}</span>
            </div>
            {log.response_at && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Response received</span>
                <span className="text-xs text-gray-900">{absoluteTime(log.response_at)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Latency</span>
              <span className="text-xs text-gray-900">
                {log.latency_ms === null
                  ? '—'
                  : log.latency_ms < 1000
                  ? `${log.latency_ms} ms`
                  : `${(log.latency_ms / 1000).toFixed(1)} s`}
              </span>
            </div>
          </div>
        </div>

        {/* Token breakdown */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tokens</p>
          <div className="bg-gray-50 rounded-xl px-3 divide-y divide-gray-100">
            <TokenRow label="Input" value={log.input_tokens} />
            <TokenRow label="Output" value={log.output_tokens} />
            <TokenRow label="Total" value={log.total_tokens} />
          </div>
        </div>

        {/* Input preview */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Input</p>
          <pre className="bg-gray-50 rounded-xl px-3 py-3 text-xs text-gray-800 whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono leading-relaxed">
            {log.input_preview ?? '—'}
          </pre>
        </div>

        {/* Output preview or error */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {log.status === 'error' ? 'Error' : 'Output'}
          </p>
          {log.status === 'error' ? (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-3">
              <p className="text-xs text-red-700 break-words leading-relaxed">
                {log.error_message ?? 'Unknown error'}
              </p>
            </div>
          ) : (
            <pre className="bg-gray-50 rounded-xl px-3 py-3 text-xs text-gray-800 whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono leading-relaxed">
              {log.output_preview ?? '—'}
            </pre>
          )}
        </div>

        {/* Metadata */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Details</p>
          <div className="bg-gray-50 rounded-xl px-3 divide-y divide-gray-100">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-500">Provider</span>
              <span className="text-xs text-gray-900">{log.provider}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-500">Conversation ID</span>
              <span className="text-xs text-gray-900 font-mono">{log.conversation_id ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-500">Log ID</span>
              <span className="text-xs text-gray-400 font-mono truncate max-w-32">{log.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
