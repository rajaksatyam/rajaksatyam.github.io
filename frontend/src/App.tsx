// import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { useAuthStore } from './store/auth.store'
// import { AuthPage } from './pages/AuthPage'
// import { HomePage } from './pages/HomePage'

// const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
//   const isAuth = useAuthStore((s) => s.isAuth)
//   return isAuth ? <>{children}</> : <Navigate to="/auth" replace />
// }

// const PublicRoute = ({ children }: { children: React.ReactNode }) => {
//   const isAuth = useAuthStore((s) => s.isAuth)
//   return isAuth ? <Navigate to="/" replace /> : <>{children}</>
// }

// export const App = () => (
//   <HashRouter>
//     <Routes>
//       <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
//       <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   </HashRouter>
// )



import { useAuthStore } from './store/auth.store'
import { startTokenRefresh } from './api/client'
import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
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


export const App = () => {
  const isAuth = useAuthStore(s => s.isAuth)

  useEffect(() => {
    if (isAuth) {
      startTokenRefresh() // ← restart timer after page refresh
    }
  }, [])

  return < HashRouter >
    <Routes>
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </HashRouter >
}