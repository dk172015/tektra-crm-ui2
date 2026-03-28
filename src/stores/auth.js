import { defineStore } from 'pinia'
import { loginApi, logoutApi, meApi } from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isSale: (state) => state.user?.role === 'sale',
  },

  actions: {
    async login(payload) {
      this.loading = true
      try {
        const { data } = await loginApi(payload)
        this.token = data.token
        this.user = data.user

        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      } finally {
        this.loading = false
      }
    },

    async fetchMe() {
      if (!this.token) return

      const { data } = await meApi()
      this.user = data
      localStorage.setItem('user', JSON.stringify(data))
    },

    async logout() {
      try {
        await logoutApi()
      } catch (_) {
      }

      this.token = ''
      this.user = null

      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})