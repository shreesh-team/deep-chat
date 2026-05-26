'use client'

import type { InferenceLog, InferenceLogsPage } from '@/types'
import { relativeTime } from '@/lib/relativeTime'
import InferenceLogDetail from './InferenceLogDetail'

interface Filters {
  status: '' | 'success' | 'error'
  model: string
  conversationId: string
}

interface Props {
  data: InferenceLogsPage | null
  loading: boolean
  error: string | null
  filters: Filters
  page: number
  selectedId: string | null
  lastRefreshed: Date | null
  onFilterChange: (filters: Filters) => void
  onPageChange: (page: number) => void
  onSelectLog: (id: string | null) => void
  onRefresh: () => void
}

function formatLatency(ms: number | null): string {
  if (ms === null) return '—'
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
}

function InferenceStatusBadge({ status }: { status: 'success' | 'error' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
        status === 'success'
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'success' ? 'bg-green-500' : 'bg-red-400'}`} />
      {status === 'success' ? 'Success' : 'Error'}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="animate-pulse bg-gray-100 rounded h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 mb-4">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-medium text-gray-900">No inference logs yet</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Integrate the DeepX SDK and make LLM calls — they will appear here automatically.
          </p>
        </div>
      </td>
    </tr>
  )
}

export default function InferenceLogsView({
  data,
  loading,
  error,
  filters,
  page,
  selectedId,
  lastRefreshed,
  onFilterChange,
  onPageChange,
  onSelectLog,
  onRefresh,
}: Props) {
  const selectedLog = data?.items.find(l => l.id === selectedId) ?? null
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main panel */}
      <div className={`flex flex-col min-w-0 transition-all duration-200 ${selectedLog ? 'flex-[3]' : 'flex-1'}`}>
        {/* Page header */}
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-semibold text-gray-900">Inference Logs</h1>
              {lastRefreshed && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Updated {relativeTime(lastRefreshed.toISOString())}
                </p>
              )}
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-40"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={loading ? 'animate-spin' : ''}
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filters.status}
              onChange={e => onFilterChange({ ...filters, status: e.target.value as Filters['status'], })}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>

            <input
              type="text"
              placeholder="Filter by model…"
              value={filters.model}
              onChange={e => onFilterChange({ ...filters, model: e.target.value })}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors w-44"
            />

            <input
              type="text"
              placeholder="Filter by conversation ID…"
              value={filters.conversationId}
              onChange={e => onFilterChange({ ...filters, conversationId: e.target.value })}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors w-56"
            />

            {(filters.status || filters.model || filters.conversationId) && (
              <button
                onClick={() => onFilterChange({ status: '', model: '', conversationId: '' })}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-white border-b border-gray-100">
              <tr>
                {['Timestamp', 'Model', 'Provider', 'Status', 'Latency', 'Tokens', 'Conversation ID'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : !data || data.items.length === 0 ? (
                <EmptyState />
              ) : (
                data.items.map(log => (
                  <LogRow
                    key={log.id}
                    log={log}
                    isSelected={log.id === selectedId}
                    onClick={() => onSelectLog(log.id === selectedId ? null : log.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > data.page_size && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 shrink-0">
            <p className="text-xs text-gray-500">
              {data.total} total · page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedLog && (
        <div className="flex-[2] border-l border-gray-100 overflow-hidden">
          <InferenceLogDetail log={selectedLog} onClose={() => onSelectLog(null)} />
        </div>
      )}
    </div>
  )
}

function LogRow({
  log,
  isSelected,
  onClick,
}: {
  log: InferenceLog
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors ${
        isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
    >
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {relativeTime(log.created_at)}
      </td>
      <td className="px-4 py-3 text-xs text-gray-900 font-medium whitespace-nowrap max-w-36 truncate">
        {log.model}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap capitalize">
        {log.provider}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <InferenceStatusBadge status={log.status} />
      </td>
      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap tabular-nums">
        {formatLatency(log.latency_ms)}
      </td>
      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap tabular-nums">
        {log.total_tokens ?? '—'}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap max-w-32 truncate">
        {log.conversation_id ?? '—'}
      </td>
    </tr>
  )
}
