// import { create } from 'zustand'
// import { persist } from 'zustand/middleware'
// import type { AnalysisResult, HistoryItem } from '../types'

// interface HistoryState {
//   items: HistoryItem[]
//   query: string
//   add: (url: string, result: AnalysisResult) => void
//   remove: (id: string) => void
//   setQuery: (q: string) => void
//   filtered: () => HistoryItem[]
//   clear: () => void
// }

// export const useHistoryStore = create<HistoryState>()(
//   persist(
//     (set, get) => ({
//       items: [],
//       query: '',

//       add: (url, result) => {
//         const item: HistoryItem = {
//           id: crypto.randomUUID(),
//           url,
//           result,
//           createdAt: new Date().toISOString(),
//         }
//         set((s) => ({ items: [item, ...s.items].slice(0, 50) }))
//       },

//       remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

//       setQuery: (query) => set({ query }),

//       filtered: () => {
//         const { items, query } = get()
//         if (!query.trim()) return items
//         const q = query.toLowerCase()
//         return items.filter(
//           (i) =>
//             i.url.toLowerCase().includes(q) ||
//             i.result.title.toLowerCase().includes(q) ||
//             i.result.summary.overview.toLowerCase().includes(q)
//         )
//       },

//       clear: () => set({ items: [] }),
//     }),
//     { name: 'history' }
//   )
// )


import { create } from 'zustand'
import { historyApi, type HistoryItemAPI } from '../api/history'

interface HistoryState {
  items: HistoryItemAPI[]
  page: number
  hasMore: boolean
  loading: boolean
  initialLoaded: boolean
  query: string

  // actions
  loadFirstPage: () => Promise<void>
  loadNextPage: () => Promise<void>
  remove: (id: string) => Promise<void>
  clear: () => Promise<void>
  setQuery: (q: string) => void

  // derived
  filtered: () => HistoryItemAPI[]
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  page: 0,
  hasMore: true,
  loading: false,
  initialLoaded: false,
  query: '',

  loadFirstPage: async () => {
    if (get().loading) return
    set({ loading: true, items: [], page: 0, hasMore: true, initialLoaded: false })
    try {
      const data = await historyApi.getPage(1)
      set({ items: data.items, page: 1, hasMore: data.hasMore, initialLoaded: true })
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      set({ loading: false })
    }
  },

  loadNextPage: async () => {
    const { loading, hasMore, page } = get()
    if (loading || !hasMore) return
    set({ loading: true })
    try {
      const nextPage = page + 1
      const data = await historyApi.getPage(nextPage)
      set((s) => ({
        items: [...s.items, ...data.items],
        page: nextPage,
        hasMore: data.hasMore,
      }))
    } catch (err) {
      console.error('Failed to load more history:', err)
    } finally {
      set({ loading: false })
    }
  },

  remove: async (id) => {
    try {
      await historyApi.deleteItem(id)
      set((s) => ({ items: s.items.filter((i) => i._id !== id) }))
    } catch (err) {
      console.error('Failed to delete history item:', err)
    }
  },

  clear: async () => {
    try {
      await historyApi.clearAll()
      set({ items: [], page: 1, hasMore: false })
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  },

  setQuery: (query) => set({ query }),

  filtered: () => {
    const { items, query } = get()
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(
      (i) =>
        i.url.toLowerCase().includes(q) ||
        i.result.title.toLowerCase().includes(q) ||
        i.result.summary.overview.toLowerCase().includes(q)
    )
  },
}))