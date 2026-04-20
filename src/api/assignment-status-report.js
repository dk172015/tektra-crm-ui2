import api from './axios'

export const getAssignmentStatusSummaryApi = (params) =>
  api.get('/reports/assignment-status/summary', { params })

export const getAssignmentStatusDetailApi = (params) =>
  api.get('/reports/assignment-status/detail', { params })