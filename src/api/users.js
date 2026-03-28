import api from './axios'

export const getUsersApi = (params) => api.get('/users', { params })
export const createUserApi = (payload) => api.post('/users', payload)
export const updateUserApi = (id, payload) => api.put(`/users/${id}`, payload)
export const toggleUserStatusApi = (id) => api.put(`/users/${id}/toggle-status`)

console.log('users api loaded')