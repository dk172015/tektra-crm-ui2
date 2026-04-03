import api from './axios'

export const getRevenueAnalyticsSummaryApi = (params) =>
  api.get('/analytics/revenue/summary', { params })

export const getRevenueAnalyticsTrendApi = (params) =>
  api.get('/analytics/revenue/trend', { params })

export const getRevenueAnalyticsBySaleApi = (params) =>
  api.get('/analytics/revenue/by-sale', { params })

export const getRevenueAnalyticsByBuildingApi = (params) =>
  api.get('/analytics/revenue/by-building', { params })

export const getRevenueAnalyticsBySourceApi = (params) =>
  api.get('/analytics/revenue/by-source', { params })

export const getRevenueAnalyticsTopDealsApi = (params) =>
  api.get('/analytics/revenue/top-deals', { params })