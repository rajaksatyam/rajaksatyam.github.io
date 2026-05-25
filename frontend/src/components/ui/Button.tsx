import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  loading?: boolean
}

export const Button = ({ variant = 'primary', loading, children, disabled, style, ...rest }: Props) => {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '0 16px',
    height: 36,
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid',
    transition: 'opacity .15s, background .15s',
    opacity: disabled || loading ? 0.5 : 1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: '#f0f0f0',
      color: '#080808',
      borderColor: '#f0f0f0',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--muted2)',
      borderColor: 'var(--border)',
    },
    danger: {
      background: 'transparent',
      color: 'var(--red)',
      borderColor: '#ef444430',
    },
  }

  return (
    <button style={{ ...base, ...variants[variant], ...style }} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner /> : children}
    </button>
  )
}

const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 1s linear infinite' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 14" />
  </svg>
)
