import api from './axios'

export const getPropertiesApi = (params) => api.get('/properties', { params })
export const createPropertyApi = (payload) => api.post('/properties', payload)