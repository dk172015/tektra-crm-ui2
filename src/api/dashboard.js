import api from './axios'

export const getDashboardSummaryApi = (params) =>
  api.get('/dashboard/summary', { params })

export const getDashboardRevenueDailyApi = (params) =>
  api.get('/dashboard/revenue-daily', { params })

export const getDashboardRevenueBySaleApi = (params) =>
  api.get('/dashboard/revenue-by-sale', { params })

export const getDashboardCustomersBySaleApi = (params) =>
  api.get('/dashboard/customers-by-sale', { params })

export const getDashboardPipelineResultApi = (params) =>
  api.get('/dashboard/pipeline-result', { params })

export const getDashboardTopSaleApi = (params) =>
  api.get('/dashboard/top-sale', { params })

export const getDashboardMyRankApi = (params) =>
  api.get('/dashboard/my-rank', { params })
export const getDashboardConversionBySaleApi = (params) =>
  api.get('/dashboard/conversion-by-sale', { params })

export const getDashboardSourcePerformanceApi = (params) =>
  api.get('/dashboard/source-performance', { params })

export const getDashboardBuildingPerformanceApi = (params) =>
  api.get('/dashboard/building-performance', { params })

export const getDashboardRecycleLeadsApi = (params) =>
  api.get('/dashboard/recycle-leads', { params })

export const getDashboardAgingPipelineApi = (params) =>
  api.get('/dashboard/aging-pipeline', { params })
export const getDashboardAssignedCurrentApi = (params) =>
  api.get('/dashboard/assigned-current', { params })

export const getDashboardAssignedInPeriodApi = (params) =>
  api.get('/dashboard/assigned-in-period', { params })

export const getDashboardRankingSaleApi = (params) =>
  api.get('/dashboard/ranking-sale', { params })