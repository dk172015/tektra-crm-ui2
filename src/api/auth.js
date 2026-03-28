import api from './axios'

export const loginApi = (payload) => api.post('/login', payload)
export const meApi = () => api.get('/me')
export const logoutApi = () => api.post('/logout')