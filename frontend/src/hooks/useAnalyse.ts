
import { useState } from 'react'
import { analyseApi } from '../api/analyse'
import type { AnalysisResult } from '../types'

export const useAnalyse = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyse = async (url: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await analyseApi.analyse(url)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, analyse, reset: () => setResult(null) }
}