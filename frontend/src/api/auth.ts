import { api, startTokenRefresh } from './client'

import type { SignUpInput, SignInInput } from '../validate/auth.validate'

export const authApi = {
  signUp: async (data: SignUpInput) => {
    const res = await api.post<{ msg: string; User: { userName: string } }>('/auth/signUp', data)
    return res.data
  },



  signIn: async (data: SignInInput) => {
    const res = await api.post<{ msg: string; user: { userName: string } }>('/auth/signIn', data)
    startTokenRefresh()
    return res.data
  },

  signOut: async () => {

    const res = await api.get<{ msg: string }>('/auth/signOut')
    console.log(res.data)
    return res.data
  },
}
