import { useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import { useAnalyse } from '../hooks/useAnalyse'
import { AnalyseForm } from '../components/AnalyseForm'
import { ResultCard } from '../components/ResultCard'
import { HistoryList } from '../components/HistoryList'
import { Button } from '../components/ui/Button'
import type { AnalysisResult } from '../types'
import logo from "../assets/logo.png"



export const HomePage = () => {
  const { userName, signOut } = useAuthStore()
  const { result, loading, error, analyse, reset } = useAnalyse()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)



  const handleSignOut = async () => {
    setSigningOut(true)
    try { await signOut() } finally { setSigningOut(false) }
  }

  const handleHistorySelect = (r: AnalysisResult) => {

    reset()
    setTimeout(() => analyse(''), 0)

    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    _setExternalResult(r)
  }

  const [externalResult, setExternalResult] = useState<AnalysisResult | null>(null)
  const _setExternalResult = setExternalResult

  const displayed = externalResult ?? result

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 280 : 0,
        flexShrink: 0,
        borderRight: sidebarOpen ? '1px solid var(--border)' : 'none',
        overflow: 'hidden',
        transition: 'width .2s ease',
        background: 'var(--surface)',
      }}>
        {sidebarOpen && <HistoryList onSelect={handleHistorySelect} />}
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Nav */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 52, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen((o) => !o)}
              style={{ background: 'none', border: 'none', color: 'var(--muted2)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              ☰
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* <span style={{ fontSize: 16 }}>◈</span> */}
              <img style={{ width: 30 }} src={logo} alt="logo" />
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-.02em' }}>KB</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{userName}</span>
            <Button variant="ghost" onClick={handleSignOut} loading={signingOut} style={{ height: 30, fontSize: 12 }}>
              Sign out
            </Button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: '40px 24px 80px' }}>

          {/* Hero — only when no result */}
          {!displayed && !loading && (
            <div style={{ marginBottom: 36, textAlign: 'center' }}>
              <h1 style={{ fontSize: 28, fontWeight: 300, color: 'var(--accent)', letterSpacing: '-.03em', marginBottom: 8 }}>
                What do you want to analyse?
              </h1>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                Instagram - paste URL | YouTube and blogs coming soon!
              </p>
            </div>
          )}

          <AnalyseForm
            onSubmit={(url) => { setExternalResult(null); analyse(url) }}
            loading={loading}
          />

          {/* Loading state */}
          {loading && (
            <div style={{ marginTop: 48, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Downloading & analysing…</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>This may take 20–40 seconds</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ marginTop: 24, padding: '12px 16px', background: '#ef444410', border: '1px solid #ef444425', borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--red)' }}>{error}</p>
            </div>
          )}

          {/* Result */}
          {displayed && !loading && (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Analysis</p>
                <button onClick={() => { reset(); setExternalResult(null) }}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                  ← New
                </button>
              </div>
              <ResultCard result={displayed} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
