import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = ({ label, error, id, style, ...rest }: Props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && (
      <label htmlFor={id} style={{ fontSize: 12, color: 'var(--muted2)', letterSpacing: '.02em' }}>
        {label}
      </label>
    )}
    <input
      id={id}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${error ? '#ef444450' : 'var(--border)'}`,
        borderRadius: 6,
        padding: '0 12px',
        height: 38,
        fontSize: 13,
        color: 'var(--text)',
        outline: 'none',
        width: '100%',
        transition: 'border-color .15s',
        ...style,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = error ? '#ef4444' : '#333' }}
      onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#ef444450' : 'var(--border)' }}
      {...rest}
    />
    {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
  </div>
)
