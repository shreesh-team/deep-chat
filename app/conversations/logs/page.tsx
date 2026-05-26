'use client'

import { useState, useEffect } from 'react'
import { api, ApiError } from '@/lib/api'
import { getFriendlyError } from '@/lib/errorMessages'
import type { InferenceLogsPage } from '@/types'
import InferenceLogsView from '@/components/InferenceLogsView'

interface Filters {
  status: '' | 'success' | 'error'
  model: string
  conversationId: string
}

const PAGE_SIZE = 50

export default function InferenceLogsPage() {
  const [filters, setFilters] = useState<Filters>({ status: '', model: '', conversationId: '' })
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [data, setData] = useState<InferenceLogsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await api.getInferenceLogs({
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.model.trim() ? { model: filters.model.trim() } : {}),
          ...(filters.conversationId.trim() ? { conversation_id: filters.conversationId.trim() } : {}),
          page,
          page_size: PAGE_SIZE,
        })
        if (active) {
          setData(result)
          setLastRefreshed(new Date())
        }
      } catch (err) {
        if (active) {
          const msg =
            err instanceof ApiError
              ? getFriendlyError(err.code, err.message)
              : 'Failed to load inference logs.'
          setError(msg)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [filters, page, refreshToken])

  function handleFiltersChange(next: Filters) {
    setFilters(next)
    setPage(1)
    setSelectedId(null)
  }

  function handleRefresh() {
    setRefreshToken(t => t + 1)
  }

  return (
    <InferenceLogsView
      data={data}
      loading={loading}
      error={error}
      filters={filters}
      page={page}
      selectedId={selectedId}
      lastRefreshed={lastRefreshed}
      onFilterChange={handleFiltersChange}
      onPageChange={setPage}
      onSelectLog={setSelectedId}
      onRefresh={handleRefresh}
    />
  )
}
