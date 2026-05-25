import { api } from './client'
import type { AnalysisResult } from '../types'

export interface HistoryItemAPI {
    _id: string
    url: string
    result: AnalysisResult
    createdAt: string
}

export interface HistoryPage {
    items: HistoryItemAPI[]
    page: number
    limit: number
    total: number
    hasMore: boolean
}

export const historyApi = {
    getPage: async (page: number): Promise<HistoryPage> => {
        const res = await api.get<{ success: boolean } & HistoryPage>(
            `/api/history?page=${page}`
        )
        return res.data
    },

    deleteItem: async (id: string): Promise<void> => {
        await api.delete(`/api/history/${id}`)
    },

    clearAll: async (): Promise<void> => {
        await api.delete('/api/history')
    },
}