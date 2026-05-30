// import axios from 'axios'
// import { useAuthStore } from '../store/auth.store'

// export const api = axios.create({
//   baseURL: '/',
//   withCredentials: true,
// })

// api.interceptors.response.use(
//   (r) => r,
//   (err) => {
//     if (err.response?.status === 401) {
//       useAuthStore.setState({ isAuth: false, userName: null })

//       // Pass a reason so the login page can show a message
//       window.location.replace('/auth?reason=session_expired')
//     }

//     const msg = err.response?.data?.message ?? err.response?.data?.msg ?? 'Something went wrong'
//     return Promise.reject(new Error(msg))
//   }
// )

// src/lib/axios.ts
import axios from "axios"

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // must be true for cookies
})

let refreshTimeout: ReturnType<typeof setTimeout>

function scheduleRefresh() {
  clearTimeout(refreshTimeout)
  // refresh 1 min before 15min expiry
  refreshTimeout = setTimeout(async () => {
    try {
      await api.post("/auth/refresh")
      scheduleRefresh() // schedule next refresh
    } catch {
      window.location.href = "/auth" // token expired, force login
    }
  }, 14 * 60 * 1000) //  14 minutes
}

// Start scheduling after login
export function startTokenRefresh() {
  scheduleRefresh()
}

// Also handle 401 responses as a safety net
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await api.post("/auth/refresh")
        // retry original request
        return api(error.config)
      } catch {
        window.location.href = "/auth"
      }
    }
    return Promise.reject(error)
  }
)
