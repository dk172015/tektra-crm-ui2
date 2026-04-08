import api from './axios'

export const getRevenueReportSummaryApi = (params) =>
  api.get('/reports/revenue-new/summary', { params })

export const getRevenueReportDealsApi = (params) =>
  api.get('/reports/revenue-new/deals', { params })