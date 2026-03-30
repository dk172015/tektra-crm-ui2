import api from './axios'

export const getUsersApi = (params) => api.get('/users', { params })
export const createUserApi = (payload) =>
  api.post('/users', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const updateUserApi = (id, payload) => {
  payload.append('_method', 'PUT')

  return api.post(`/users/${id}`, payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const toggleUserStatusApi = (id) => api.put(`/users/${id}/toggle-status`)

export const getProfileApi = () => api.get('/profile')
export const updateProfileApi = (payload) =>
  api.post('/profile', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })