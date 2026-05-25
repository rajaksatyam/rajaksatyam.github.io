import type { AnalysisResult } from '../types'

const VERDICT_STYLE: Record<string, React.CSSProperties> = {
  accurate: { color: '#22c55e', background: '#22c55e12', borderColor: '#22c55e25' },
  inaccurate: { color: '#ef4444', background: '#ef444412', borderColor: '#ef444425' },
  'partially accurate': { color: '#eab308', background: '#eab30812', borderColor: '#eab30825' },
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }}>
    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12 }}>
      {title}
    </p>
    {children}
  </div>
)

export const ResultCard = ({ result }: { result: AnalysisResult }) => {
  const vs = VERDICT_STYLE[result.verification.verdict] ?? VERDICT_STYLE['partially accurate']

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>

      {/* Title */}
      <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--accent)', lineHeight: 1.4, marginBottom: 4 }}>
        {result.title}
      </h2>

      {/* Overview */}
      <p style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.7 }}>
        {result.summary.overview}
      </p>

      {/* Key points */}
      {result.summary.keyPoints.length > 0 && (
        <Section title="Key points">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none' }}>
            {result.summary.keyPoints.map((p, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text)' }}>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, paddingTop: 2, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {p}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Verification */}
      <Section title="Fact check">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, border: '1px solid', ...vs }}>
            {result.verification.verdict}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.7 }}>
          {result.verification.factCheckReport}
        </p>
      </Section>

      {/* Transcription */}
      {result.transcription.length > 0 && (
        <Section title="Transcript">
          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.transcription.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0, paddingTop: 2 }}>
                  {t.timestamp}
                </span>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{t.text}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Resources */}
      {result.resources.length > 0 && (
        <Section title="Sources">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, transition: 'border-color .15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{r.platform}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>{r.relevance}</p>
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>↗</span>
              </a>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
