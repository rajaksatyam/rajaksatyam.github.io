export interface TranscriptionEntry {
  timestamp: string
  text: string
}

export interface AnalysisResult {
  title: string
  summary: {
    overview: string
    keyPoints: string[]
  }
  transcription: TranscriptionEntry[]
  verification: {
    factCheckReport: string
    verdict: 'accurate' | 'inaccurate' | 'partially accurate'
  }
  resources: {
    platform: string
    url: string
    relevance: string
  }[]
}

export interface HistoryItem {
  id: string
  url: string
  result: AnalysisResult
  createdAt: string
}

export interface ApiError {
  msg: string
}
