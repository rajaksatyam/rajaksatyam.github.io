
import { useEffect, useRef } from 'react'
import { useHistoryStore } from '../store/history.store'
import type { AnalysisResult } from '../types'

interface Props {
  onSelect: (result: AnalysisResult) => void
}

export const HistoryList = ({ onSelect }: Props) => {
  const {
    filtered,
    query,
    setQuery,
    remove,
    clear,
    loadFirstPage,
    loadNextPage,
    loading,
    hasMore,
    initialLoaded,
    items,
  } = useHistoryStore()

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Load first page when sidebar opens
  useEffect(() => {
    loadFirstPage()
  }, [])

  // IntersectionObserver — fires when sentinel div scrolls into view
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading])

  const displayItems = filtered()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search history…"
          style={{
            width: '100%',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '0 10px',
            height: 32,
            fontSize: 12,
            color: 'var(--text)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>

        {/* Initial loading skeleton */}
        {!initialLoaded && loading && (
          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '24px 16px' }}>
            Loading…
          </p>
        )}

        {/* Empty states */}
        {initialLoaded && displayItems.length === 0 && !loading && (
          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '24px 16px' }}>
            {query ? 'No results' : 'No history yet'}
          </p>
        )}

        {/* Items */}
        {displayItems.map((item) => (
          <div
            key={item._id}
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              marginBottom: 2,
              border: '1px solid transparent',
              transition: 'background .12s, border-color .12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface2)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSelect(item.result)}>
                <p style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text)',
                  marginBottom: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.result.title}
                </p>
                <p style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-mono)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.url}
                </p>
                <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => remove(item._id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: 14,
                  lineHeight: 1,
                  flexShrink: 0,
                  padding: 2,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {/* Sentinel — IntersectionObserver watches this */}
        {/* Only show when NOT filtering (search works on already-loaded items) */}
        {!query && (
          <div ref={sentinelRef} style={{ height: 1 }} />
        )}

        {/* Load-more spinner */}
        {loading && initialLoaded && (
          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>
            Loading more…
          </p>
        )}

        {/* End of list */}
        {!hasMore && items.length > 0 && !query && (
          <p style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>
            All {items.length} items loaded
          </p>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={clear}
            style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}