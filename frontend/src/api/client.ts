// import axios from "axios"

// export const api = axios.create({
//   baseURL: 'https://kb-api.flashhub.net/api',
//   withCredentials: true, // must be true for cookies
// })

// let refreshTimeout: ReturnType<typeof setTimeout>

// function scheduleRefresh() {
//   clearTimeout(refreshTimeout)
//   // refresh 1 min before 15min expiry
//   refreshTimeout = setTimeout(async () => {
//     try {
//       await api.post("/auth/refresh")
//       scheduleRefresh() // schedule next refresh
//     } catch {
//       window.location.href = "/auth" // token expired, force login
//     }
//   }, 14 * 60 * 1000) //  14 minutes
// }

// // Start scheduling after login
// export function startTokenRefresh() {
//   scheduleRefresh()
// }


// api.interceptors.response.use(null, async (error) => {
//   const originalRequest = error.config

//   if (error.response?.status === 401 && !originalRequest._retry) {
//     originalRequest._retry = true  // ← prevents infinite loop
//     try {
//       await api.post("/auth/refresh")
//       return api(originalRequest)
//     } catch {
//       // refresh failed, redirect to login
//       window.location.href = '/#/auth'
//       return Promise.reject(error)
//     }
//   }

//   return Promise.reject(error)
// })

import axios from "axios"

export const api = axios.create({
  baseURL: "https://kb-api.flashhub.net/api",
  withCredentials: true,
})

let refreshTimeout: ReturnType<typeof setTimeout>

function scheduleRefresh() {
  clearTimeout(refreshTimeout)
  refreshTimeout = setTimeout(async () => {
    try {
      await api.post("/auth/refresh")
      scheduleRefresh()
    } catch {
      window.location.href = '/auth'
    }
  }, 14 * 60 * 1000)
}

export function startTokenRefresh() {
  scheduleRefresh()
}

// ✅ Fixed interceptor — skip refresh routes to prevent loop
api.interceptors.response.use(null, async (error) => {
  const originalRequest = error.config

  // Never retry refresh or auth routes — would cause infinite loop
  const isAuthRoute = originalRequest.url?.includes('/auth/')

  if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
    originalRequest._retry = true
    try {
      await api.post("/auth/refresh")
      scheduleRefresh() // restart the timer after successful refresh
      return api(originalRequest)
    } catch {
      window.location.href = '/auth'
      return Promise.reject(error)
    }
  }

  return Promise.reject(error)
})