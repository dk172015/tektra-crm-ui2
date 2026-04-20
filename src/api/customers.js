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


export const closeDealApi = (id, payload) => api.post(`/customers/${id}/close-deal`, payload)
export const getCustomerDealApi = (id) => api.get(`/customers/${id}/deal`)
export const updateCustomerDealApi = (id, payload) => api.put(`/customers/${id}/deal`, payload)
export const updateCustomerDealApi2 = (id, payload) => api.put(`/customers/${id}/deal`, payload)

export const markLostApi = (id, payload) => api.post(`/customers/${id}/mark-lost`, payload)
export const getCustomerLossApi = (id) => api.get(`/customers/${id}/loss`)
export const updateCustomerLossApi = (id, payload) => api.put(`/customers/${id}/loss`, payload)


export const getCustomerDealsListApi = (params) => api.get('/customer-deals', { params })
export const getCustomerDealDetailByDealIdApi = (id) => api.get(`/customer-deals/${id}`)
export const createNewCustomerFromDealApi = (id) => api.post(`/customer-deals/${id}/create-new-customer`)

export const getCustomerLossesListApi = (params) => api.get('/customer-losses', { params })
export const getCustomerLossDetailByLossIdApi = (id) => api.get(`/customer-losses/${id}`)
export const createNewCustomerFromLossApi = (id) =>  api.post(`/customer-losses/${id}/create-new-customer`)
export const addSupportSaleApi = (customerId, payload) =>
  api.post(`/customers/${customerId}/add-support-sale`, payload)

export const changePrimarySaleApi = (customerId, payload) =>
  api.post(`/customers/${customerId}/change-primary-sale`, payload)

