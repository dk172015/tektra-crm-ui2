import api from './axios'

export const getCustomersApi = (params) => api.get('/customers', { params })
export const getCustomerDetailApi = (id) => api.get(`/customers/${id}`)
export const createCustomerApi = (payload) => api.post('/customers', payload)
export const updateCustomerApi = (id, payload) => api.put(`/customers/${id}`, payload)
export const updateCustomerStatusApi = (id, payload) => api.put(`/customers/${id}/status`, payload)
export const assignCustomerApi = (id, payload) => api.post(`/customers/${id}/assign`, payload)
export const updateCustomerRequirementApi = (id, payload) => api.put(`/customers/${id}/requirement`, payload)
export const addActivityApi = (id, payload) => api.post(`/customers/${id}/activities`, payload)
export const addViewingApi = (id, payload) => api.post(`/customers/${id}/viewings`, payload)
export const togglePriorityApi = (id) => api.put(`/customers/${id}/toggle-priority`)