import axios from 'axios'

export const api = axios.create({
  baseURL: '/',
  withCredentials: true,
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.msg ?? 'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)
