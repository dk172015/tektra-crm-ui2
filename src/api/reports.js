import api from './axios'

export const getRevenueSummaryApi = (params) =>
  api.get('/reports/revenue/summary', { params })

export const getRevenueByPeriodApi = (params) =>
  api.get('/reports/revenue/by-period', { params })

export const getRevenueBySaleApi = (params) =>
  api.get('/reports/revenue/by-sale', { params })

export const getCustomerSummaryReportApi = (params) =>
  api.get('/reports/customers/summary', { params })

export const getCustomerByStatusApi = (params) =>
  api.get('/reports/customers/by-status', { params })

export const getCustomerBySaleApi = (params) =>
  api.get('/reports/customers/by-sale', { params })
