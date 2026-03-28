import api from './axios'

export const getLeadSourcesApi = () => api.get('/lead-sources')