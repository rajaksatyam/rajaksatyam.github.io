import { useState } from 'react'
import { UrlSchema } from '../validate/auth.validate'
import { Button } from './ui/Button'

interface Props {
  onSubmit: (url: string) => void
  loading: boolean
}

export const AnalyseForm = ({ onSubmit, loading }: Props) => {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const parse = UrlSchema.safeParse({ url })
    if (!parse.success) {
      setError(parse.error.issues[0].message)
      return
    }
    setError('')
    onSubmit(parse.data.url)
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            placeholder="Paste a Instagram URL…"
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: `1px solid ${error ? '#ef444450' : 'var(--border)'}`,
              borderRadius: 8,
              padding: '0 16px',
              height: 46,
              fontSize: 13,
              color: 'var(--text)',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-.01em',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = error ? '#ef4444' : '#2a2a2a' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#ef444450' : 'var(--border)' }}
          />
          {error && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 6 }}>{error}</p>}
        </div>
        <Button type="submit" loading={loading} style={{ height: 46, padding: '0 20px' }}>
          Analyse
        </Button>
      </div>
    </form>
  )
}
