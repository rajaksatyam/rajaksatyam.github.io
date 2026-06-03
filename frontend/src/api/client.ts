import axios from "axios"

export const api = axios.create({
  baseURL: 'https://kb-api.flashhub.net/api',
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
