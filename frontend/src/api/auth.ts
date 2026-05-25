import { api } from './client'
import type { SignUpInput, SignInInput } from '../validate/auth.validate'

export const authApi = {
  signUp: async (data: SignUpInput) => {
    const res = await api.post<{ msg: string; User: { userName: string } }>('/api/auth/signUp', data)
    return res.data
  },

  signIn: async (data: SignInInput) => {
    const res = await api.post<{ msg: string; user: { userName: string } }>('/api/auth/signIn', data)
    return res.data
  },

  signOut: async () => {

    const res = await api.get<{ msg: string }>('/api/auth/signOut')
    console.log(res.data)
    return res.data
  },
}
