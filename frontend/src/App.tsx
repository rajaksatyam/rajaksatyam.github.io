import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useAuthStore((s) => s.isAuth)
  return isAuth ? <>{children}</> : <Navigate to="/auth" replace />
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useAuthStore((s) => s.isAuth)
  return isAuth ? <Navigate to="/" replace /> : <>{children}</>
}

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)
