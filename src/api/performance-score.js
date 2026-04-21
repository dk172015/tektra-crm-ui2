import api from './axios'

export const getPerformanceScoreApi = (params) =>
  api.get('/reports/performance-score', { params })