import api from './axios'

export const getCustomerReportSummaryApi = (params) =>
  api.get('/reports/customers/summary', { params })

export const getCustomerReportPipelineApi = (params) =>
  api.get('/reports/customers/pipeline', { params })

export const getCustomerReportBySaleApi = (params) =>
  api.get('/reports/customers/by-sale', { params })

export const getCustomerReportAssignedInPeriodApi = (params) =>
  api.get('/reports/customers/assigned-in-period', { params })

export const getCustomerReportConversionBySaleApi = (params) =>
  api.get('/reports/customers/conversion-by-sale', { params })

export const getCustomerReportWarningApi = (params) =>
  api.get('/reports/customers/warning', { params })

export const getCustomerReportAgingApi = (params) =>
  api.get('/reports/customers/aging', { params })

export const getCustomerReportTabDataApi = (params) =>
  api.get('/reports/customers/tabs', { params })