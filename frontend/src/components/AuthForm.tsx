import { useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import { SignUpSchema, SignInSchema } from '../validate/auth.validate'
import type { SignUpInput, SignInInput } from '../validate/auth.validate'
import { Input } from './ui/Input'
import { Button } from './ui/Button'

type Mode = 'signin' | 'signup'
type Fields = { userName: string; email: string; password: string }
type Errors = Partial<Record<keyof Fields, string>>

export const AuthForm = () => {
  const [mode, setMode] = useState<Mode>('signin')
  const [fields, setFields] = useState<Fields>({ userName: '', email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuthStore()

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
    setServerError('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setServerError('')

    const schema = mode === 'signup' ? SignUpSchema : SignInSchema
    const parse = schema.safeParse(fields)

    if (!parse.success) {
      const errs: Errors = {}
      parse.error.issues.forEach((i) => {
        const k = i.path[0] as keyof Fields
        if (!errs[k]) errs[k] = i.message
      })
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') await signUp(parse.data as SignUpInput)
      else await signIn(parse.data as SignInInput)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggle = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setErrors({})
    setServerError('')
  }

  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--accent)', marginBottom: 4 }}>
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {mode === 'signin' ? 'Sign in to continue' : 'Start analysing content'}
        </p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input id="userName" label="Username" value={fields.userName} onChange={set('userName')} error={errors.userName} autoComplete="username" autoFocus />
        {mode === 'signup' && (
          <Input id="email" label="Email" type="email" value={fields.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        )}
        <Input id="password" label="Password" type="password" value={fields.password} onChange={set('password')} error={errors.password} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />

        {serverError && (
          <p style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: '#ef444410', borderRadius: 6, border: '1px solid #ef444420' }}>
            {serverError}
          </p>
        )}

        <Button type="submit" loading={loading} style={{ marginTop: 4, height: 40 }}>
          {mode === 'signin' ? 'Sign in' : 'Sign up'}
        </Button>
      </form>

      <p style={{ marginTop: 20, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
        {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button onClick={toggle} style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
          {mode === 'signin' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  )
}
