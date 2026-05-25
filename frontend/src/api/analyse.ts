import { api } from './client'
import type { AnalysisResult } from '../types'

export const analyseApi = {
  analyse: async (url: string) => {
    const res = await api.post<{ success: boolean; data: AnalysisResult }>('/api/analyze', { url })
    return res.data.data
  },
}
