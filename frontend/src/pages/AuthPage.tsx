import { AuthForm } from '../components/AuthForm'
import logo from "../assets/logo.png"

export const AuthPage = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div style={{ width: '100%', maxWidth: 360 }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {/* <span style={{ fontSize: 20 }}>◈</span> */}
          <img style={{ width: 50 }} src={logo} alt="logo" />
          <span style={{ fontSize: 30, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-.02em' }}>KB</span>
        </div>
      </div>
      <AuthForm />
    </div>
  </div>
)
