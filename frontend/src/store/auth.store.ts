import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth'
import type { SignUpInput, SignInInput } from '../validate/auth.validate'

interface AuthState {
  userName: string | null
  isAuth: boolean
  signUp: (data: SignUpInput) => Promise<void>
  signIn: (data: SignInInput) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userName: null,
      isAuth: false,

      signUp: async (data) => {
        const res = await authApi.signUp(data)
        set({ userName: res.User.userName, isAuth: true })
      },

      // signIn: async (data) => {
      //   const res = await authApi.signIn(data)
      //   set({ userName: res.user.userName, isAuth: true })
      // },
      signIn: async (data) => {
        const res = await authApi.signIn(data)
        set({ userName: res.user.userName, isAuth: true })
        // Clean up the ?reason= param from the URL
        window.history.replaceState({}, '', '/auth')
      },

      signOut: async () => {
        try {
          await authApi.signOut()
        } catch (err) {
          console.error('Sign out request failed:', err)
        } finally {
          set({ userName: null, isAuth: false })
        }
      },
    }),
    { name: 'auth' }
  )
)
