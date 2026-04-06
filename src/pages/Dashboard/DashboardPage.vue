<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { getUsersApi } from '../../api/users'
import {
  getDashboardSummaryApi,
  getDashboardRevenueDailyApi,
  getDashboardRevenueBySaleApi,
  getDashboardTopSaleApi,
  getDashboardMyRankApi,
  getDashboardAssignedCurrentApi,
  getDashboardAssignedInPeriodApi,
} from '../../api/dashboard'
import {
  getCustomerReportPipelineApi,
  getCustomerReportConversionBySaleApi,
  getCustomerReportWarningApi,
  getCustomerReportAgingApi,
  getCustomerReportTabDataApi,
} from '../../api/customer-report'

const router = useRouter()
const auth = useAuthStore()

const isPrivileged = computed(() => ['admin', 'leader'].includes(auth.user?.role))

const loading = ref(false)
const tableLoading = ref(false)
const saleOptions = ref([])

const filters = reactive({
  date_from: '',
  date_to: '',
  sale_id: '',
  customer_group: '',
})

const activeTab = ref('new_assignments')
const tablePage = ref(1)

const tabs = [
  { key: 'new_assignments', label: 'New Assignments' },
  { key: 'warning', label: 'Warning' },
  { key: 'viewing', label: 'Viewing' },
  { key: 'deals', label: 'Deals' },
  { key: 'lost', label: 'Lost' },
]

const summary = ref({
  current_assigned_customers: 0,
  current_assigned_self_found: 0,
  current_assigned_company_lead: 0,

  assigned_in_period: 0,
  assigned_in_period_self_found: 0,
  assigned_in_period_company_lead: 0,

  processing_customers: 0,
  processing_self_found: 0,
  processing_company_lead: 0,

  month_revenue: 0,
  month_revenue_self_found: 0,
  month_revenue_company_lead: 0,

  month_won_customers: 0,
  month_won_self_found: 0,
  month_won_company_lead: 0,

  month_lost_customers: 0,
  month_lost_self_found: 0,
  month_lost_company_lead: 0,

  yellow_warnings: 0,
  yellow_warnings_self_found: 0,
  yellow_warnings_company_lead: 0,

  red_warnings: 0,
  red_warnings_self_found: 0,
  red_warnings_company_lead: 0,

  team_month_revenue: null,
})

const revenueDaily = ref([])
const pipeline = ref([])
const warning = ref({
  yellow_warnings: 0,
  red_warnings: 0,
  due_today: 0,
})
const assignedCurrentRows = ref([])
const assignedInPeriodRows = ref([])
const revenueBySale = ref([])
const conversionBySale = ref([])
const aging = ref([])
const topSale = ref(null)
const myRank = ref(null)

const tableData = ref({
  data: [],
  current_page: 1,
  last_page: 1,
  total: 0,
})

const baseParams = computed(() => ({
  date_from: filters.date_from || undefined,
  date_to: filters.date_to || undefined,
  sale_id: isPrivileged.value ? (filters.sale_id || undefined) : undefined,
  customer_group: filters.customer_group || undefined,
}))

const statusMap = computed(() => {
  const map = {}
  for (const row of pipeline.value) {
    map[row.status] = Number(row.total || 0)
  }
  return map
})

const pipelineCards = computed(() => [
  { key: 'new', label: 'New', value: statusMap.value.new || 0, action: () => goCustomers({ status: 'new' }) },
  { key: 'consulting', label: 'Consulting', value: statusMap.value.consulting || 0, action: () => goCustomers({ status: 'consulting' }) },
  { key: 'viewing', label: 'Viewing', value: statusMap.value.viewing || 0, action: () => goCustomers({ status: 'viewing' }) },
  { key: 'negotiating', label: 'Negotiating', value: statusMap.value.negotiating || 0, action: () => goCustomers({ status: 'negotiating' }) },
  { key: 'deposit', label: 'Deposit', value: statusMap.value.deposit || 0, action: () => goCustomers({ status: 'deposit' }) },
  { key: 'contracted', label: 'Contracted', value: statusMap.value.contracted || 0, action: () => goCustomers({ status: 'contracted' }) },
  { key: 'lost', label: 'Lost', value: statusMap.value.lost || 0, action: () => goCustomers({ status: 'lost' }) },
])

const assignedCurrentMax = computed(() =>
  Math.max(...assignedCurrentRows.value.map((x) => Number(x.total_customers || 0)), 0)
)

const assignedInPeriodMax = computed(() =>
  Math.max(...assignedInPeriodRows.value.map((x) => Number(x.assigned_in_period || 0)), 0)
)

const revenueSaleMax = computed(() =>
  Math.max(...revenueBySale.value.map((x) => Number(x.revenue || 0)), 0)
)

const conversionMax = computed(() =>
  Math.max(...conversionBySale.value.map((x) => Number(x.conversion_rate || 0)), 0)
)

const barWidth = (value, max) => {
  const numeric = Number(value || 0)
  const maxValue = Number(max || 0)
  if (!maxValue || !numeric) return '0%'
  return `${Math.max(8, (numeric / maxValue) * 100)}%`
}

const linePoints = computed(() => {
  const rows = revenueDaily.value
  if (!rows.length) return ''

  const width = 760
  const height = 240
  const padding = 24
  const maxValue = Math.max(...rows.map((item) => Number(item.revenue || 0)), 0) || 1

  return rows
    .map((item, index) => {
      const x =
        rows.length === 1
          ? width / 2
          : padding + (index * (width - padding * 2)) / (rows.length - 1)

      const y =
        height - padding - ((Number(item.revenue || 0) / maxValue) * (height - padding * 2))

      return `${x},${y}`
    })
    .join(' ')
})

const dealsVsLostTotal = computed(() => {
  const won = Number(summary.value.month_won_customers || 0)
  const lost = Number(summary.value.month_lost_customers || 0)
  return won + lost
})

const dealsVsLostStyle = computed(() => {
  const won = Number(summary.value.month_won_customers || 0)
  const lost = Number(summary.value.month_lost_customers || 0)
  const total = won + lost

  if (!total) return { background: 'conic-gradient(#e2e8f0 0 100%)' }

  const wonDeg = (won / total) * 360
  return {
    background: `conic-gradient(#22c55e 0deg ${wonDeg}deg, #ef4444 ${wonDeg}deg 360deg)`,
  }
})

const warningMiniRows = computed(() => [
  {
    label: 'Yellow Warning',
    value: warning.value.yellow_warnings,
    action: () => goCustomers({ warning_level: 'yellow' }),
  },
  {
    label: 'Red Warning',
    value: warning.value.red_warnings,
    action: () => goCustomers({ warning_level: 'red' }),
  },
  {
    label: 'Due Today',
    value: warning.value.due_today,
    action: () => goCustomers({ due_today: 1 }),
  },
])

const splitKpis = computed(() => [
  {
    label: 'Khách phụ trách',
    total: summary.value.current_assigned_customers,
    selfFound: summary.value.current_assigned_self_found,
    companyLead: summary.value.current_assigned_company_lead,
    action: () => goCustomers(),
    gradient: 'from-violet-600 to-indigo-600',
  },
  {
    label: 'Khách tạo mới',
    total: summary.value.assigned_in_period,
    selfFound: summary.value.assigned_in_period_self_found,
    companyLead: summary.value.assigned_in_period_company_lead,
    action: () => goCustomers({ assigned_in_period: 1 }),
    gradient: 'from-cyan-500 to-sky-500',
  },
  {
    label: 'Đang xử lý',
    total: summary.value.processing_customers,
    selfFound: summary.value.processing_self_found,
    companyLead: summary.value.processing_company_lead,
    action: () => goCustomers({ open_only: 1 }),
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    label: 'Chốt trong kỳ',
    total: summary.value.month_won_customers,
    selfFound: summary.value.month_won_self_found,
    companyLead: summary.value.month_won_company_lead,
    action: () => goDeals(),
    gradient: 'from-orange-400 to-orange-500',
  },
  {
    label: 'Doanh thu trong kỳ',
    total: formatCompactMoney(summary.value.month_revenue),
    selfFound: formatCompactMoney(summary.value.month_revenue_self_found),
    companyLead: formatCompactMoney(summary.value.month_revenue_company_lead),
    action: () => goRevenueAnalytics(),
    gradient: 'from-amber-400 to-yellow-500',
  },
  {
    label: 'Khách hàng mất',
    total: summary.value.month_lost_customers,
    selfFound: summary.value.month_lost_self_found,
    companyLead: summary.value.month_lost_company_lead,
    action: () => goLosses(),
    gradient: 'from-rose-500 to-red-500',
  },
])

const formatCompactMoney = (value) => {
  const number = Number(value || 0)
  if (number >= 1000000000) return `${(number / 1000000000).toFixed(1)}B`
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`
  return `${number}`
}

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`

const goCustomers = (extra = {}) => {
  router.push({
    path: '/customers',
    query: {
      ...baseParams.value,
      ...extra,
    },
  })
}

const goDeals = (extra = {}) => {
  router.push({
    path: '/customer-deals',
    query: {
      ...baseParams.value,
      ...extra,
    },
  })
}

const goLosses = (extra = {}) => {
  router.push({
    path: '/customer-losses',
    query: {
      ...baseParams.value,
      ...extra,
    },
  })
}

const goRevenueAnalytics = (extra = {}) => {
  router.push({
    path: '/analytics/revenue',
    query: {
      ...baseParams.value,
      ...extra,
    },
  })
}

const exportDashboard = () => {
  const headers = ['Tab', 'Company', 'Contact', 'Phone', 'Sale', 'Info']
  const rows = (tableData.value.data || []).map((row) => [
    activeTab.value,
    row.company_name || '',
    row.contact_name || '',
    row.phone || '',
    row.sale_name || '',
    row.warning_level || row.reason || row.revenue || row.assigned_at || row.deposit_date || row.lost_at || row.status || '',
  ])

  const csv = [headers, ...rows]
    .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `dashboard-${activeTab.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const fetchSaleOptions = async () => {
  if (!isPrivileged.value) return
  try {
    const { data } = await getUsersApi({ per_page: 200 })
    saleOptions.value = data.data || data || []
  } catch {
    saleOptions.value = []
  }
}

const fetchTable = async () => {
  tableLoading.value = true
  try {
    const { data } = await getCustomerReportTabDataApi({
      ...baseParams.value,
      tab: activeTab.value,
      page: tablePage.value,
    })
    tableData.value = data
  } finally {
    tableLoading.value = false
  }
}

const fetchAll = async () => {
  loading.value = true
  try {
    const [
      summaryRes,
      revenueDailyRes,
      revenueBySaleRes,
      pipelineRes,
      warningRes,
      assignedCurrentRes,
      assignedInPeriodRes,
      conversionRes,
      agingRes,
      topSaleRes,
      myRankRes,
    ] = await Promise.all([
      getDashboardSummaryApi(baseParams.value),
      getDashboardRevenueDailyApi(baseParams.value),
      getDashboardRevenueBySaleApi(baseParams.value),
      getCustomerReportPipelineApi(baseParams.value),
      getCustomerReportWarningApi(baseParams.value),
      getDashboardAssignedCurrentApi(baseParams.value),
      getDashboardAssignedInPeriodApi(baseParams.value),
      getCustomerReportConversionBySaleApi(baseParams.value),
      getCustomerReportAgingApi(baseParams.value),
      getDashboardTopSaleApi(baseParams.value),
      getDashboardMyRankApi(baseParams.value),
    ])

    summary.value = summaryRes.data
    revenueDaily.value = revenueDailyRes.data.data || []
    revenueBySale.value = revenueBySaleRes.data.data || []
    pipeline.value = pipelineRes.data.data || []
    warning.value = warningRes.data || { yellow_warnings: 0, red_warnings: 0, due_today: 0 }
    assignedCurrentRows.value = assignedCurrentRes.data.data || []
    assignedInPeriodRows.value = assignedInPeriodRes.data.data || []
    conversionBySale.value = conversionRes.data.data || []
    aging.value = agingRes.data.data || []
    topSale.value = topSaleRes.data.data || null
    myRank.value = myRankRes.data.data || null

    await fetchTable()
  } catch (error) {
    alert(error?.response?.data?.message || 'Không tải được dashboard.')
  } finally {
    loading.value = false
  }
}

watch(activeTab, async () => {
  tablePage.value = 1
  await fetchTable()
})

onMounted(async () => {
  await fetchSaleOptions()
  await fetchAll()
})
</script>

<template>
  <MainLayout>
    <div class="space-y-5">
      <section class="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div class="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              <span class="h-2 w-2 rounded-full bg-sky-500"></span>
              Dashboard
            </div>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">CRM Sales Performance & Pipeline</h1>
            <p class="mt-2 text-sm text-slate-500">
              Tổng hợp khách hàng, pipeline, warning, conversion và doanh thu theo ngày đặt cọc.
            </p>
          </div>

          <div
            class="grid gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-3"
            :class="isPrivileged ? 'sm:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]' : 'sm:grid-cols-[1fr_1fr_1fr_auto_auto]'"
          >
            <input v-model="filters.date_from" type="date" class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" />
            <input v-model="filters.date_to" type="date" class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" />

            <select v-model="filters.customer_group" class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none">
              <option value="">Tất cả nhóm khách</option>
              <option value="self_found">Khách tự tìm</option>
              <option value="company_lead">Khách công ty / MKT</option>
            </select>

            <select
              v-if="isPrivileged"
              v-model="filters.sale_id"
              class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
            >
              <option value="">Tất cả sale</option>
              <option v-for="user in saleOptions" :key="user.id" :value="user.id">{{ user.name }}</option>
            </select>

            <button class="h-11 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800" @click="fetchAll">
              Apply
            </button>
            <button class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="exportDashboard">
              Export
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <button
          v-for="item in splitKpis"
          :key="item.label"
          class="rounded-[22px] bg-gradient-to-r p-5 text-left text-white shadow-sm"
          :class="item.gradient"
          @click="item.action"
        >
          <div class="text-xs uppercase tracking-wide text-white/80">{{ item.label }}</div>
          <div class="mt-3 text-4xl font-semibold">{{ item.total }}</div>
          <div class="mt-3 flex items-center gap-4 text-xs text-white/85">
            <span>Tự tìm: {{ item.selfFound }}</span>
            <span>Công ty: {{ item.companyLead }}</span>
          </div>
        </button>
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Pipeline Overview</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goCustomers()">Chi tiết</button>
          </div>

          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <button
              v-for="card in pipelineCards"
              :key="card.key"
              class="rounded-2xl bg-slate-50 px-4 py-4 text-left hover:bg-slate-100"
              @click="card.action"
            >
              <div class="text-sm text-slate-500">{{ card.label }}</div>
              <div class="mt-2 text-3xl font-semibold text-slate-900">{{ card.value }}</div>
            </button>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Warning Center</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goCustomers({ warning: 1 })">Chi tiết</button>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <button class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left hover:bg-amber-100" @click="goCustomers({ warning_level: 'yellow' })">
              <div class="text-sm text-amber-600">Yellow Warning</div>
              <div class="mt-2 text-3xl font-semibold text-amber-700">{{ warning.yellow_warnings }}</div>
            </button>
            <button class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-left hover:bg-rose-100" @click="goCustomers({ warning_level: 'red' })">
              <div class="text-sm text-rose-600">Red Warning</div>
              <div class="mt-2 text-3xl font-semibold text-rose-700">{{ warning.red_warnings }}</div>
            </button>
          </div>

          <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">Alert</th>
                  <th class="px-4 py-3 font-medium">Count</th>
                  <th class="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in warningMiniRows" :key="row.label" class="border-t border-slate-100">
                  <td class="px-4 py-3 font-medium text-slate-900">{{ row.label }}</td>
                  <td class="px-4 py-3">{{ row.value }}</td>
                  <td class="px-4 py-3 text-right">
                    <button class="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50" @click="row.action">
                      Xem
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Revenue Trend</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goRevenueAnalytics()">Chi tiết</button>
          </div>

          <div v-if="loading" class="h-[260px] animate-pulse rounded-2xl bg-slate-100"></div>

          <div v-else-if="revenueDaily.length">
            <svg viewBox="0 0 760 240" class="h-[260px] w-full">
              <polyline fill="none" stroke="#cbd5e1" stroke-width="2" :points="'24,214 736,214'" />
              <polyline fill="none" stroke="#5973f3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" :points="linePoints" />
              <circle
                v-for="(item, index) in revenueDaily"
                :key="index"
                :cx="linePoints.split(' ')[index]?.split(',')[0]"
                :cy="linePoints.split(' ')[index]?.split(',')[1]"
                r="4"
                fill="#5973f3"
              />
            </svg>
          </div>

          <div v-else class="rounded-2xl bg-slate-50 px-4 py-10 text-sm text-slate-500">
            Không có dữ liệu doanh thu.
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Deals vs Lost</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goDeals()">Chi tiết</button>
          </div>

          <div class="grid gap-4 lg:grid-cols-[220px_1fr] items-center">
            <div class="flex flex-col items-center">
              <div class="relative h-44 w-44 rounded-full" :style="dealsVsLostStyle">
                <div class="absolute inset-5 flex items-center justify-center rounded-full bg-white text-center">
                  <div>
                    <div class="text-xs uppercase tracking-wide text-slate-400">Total</div>
                    <div class="mt-1 text-2xl font-semibold text-slate-900">{{ dealsVsLostTotal }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid gap-3">
              <button class="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50" @click="goDeals()">
                <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-green-600"></span>Deals</span>
                <span class="font-semibold">{{ summary.month_won_customers }}</span>
              </button>
              <button class="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50" @click="goLosses()">
                <span class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-red-600"></span>Lost</span>
                <span class="font-semibold">{{ summary.month_lost_customers }}</span>
              </button>

              <div class="grid grid-cols-2 gap-3 pt-2">
                <button class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100" @click="goDeals({ customer_group: 'self_found' })">
                  <div class="text-xs text-slate-400">Deal tự tìm</div>
                  <div class="mt-1 text-xl font-semibold text-slate-900">{{ summary.month_won_self_found }}</div>
                </button>
                <button class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100" @click="goDeals({ customer_group: 'company_lead' })">
                  <div class="text-xs text-slate-400">Deal công ty</div>
                  <div class="mt-1 text-xl font-semibold text-slate-900">{{ summary.month_won_company_lead }}</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Revenue by Sale</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goRevenueAnalytics()">Chi tiết</button>
          </div>

          <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="item in revenueBySale"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="goDeals({ sale_id: item.user_id })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ formatCompactMoney(item.revenue) }}</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-sky-500" :style="{ width: barWidth(item.revenue, revenueSaleMax) }"></div>
              </div>
            </button>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Customers by Sale</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goCustomers()">Chi tiết</button>
          </div>

          <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="h-20 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="item in assignedCurrentRows"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="goCustomers({ sale_id: item.user_id })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ item.total_customers }} khách</span>
              </div>

              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-indigo-500" :style="{ width: barWidth(item.total_customers, assignedCurrentMax) }"></div>
              </div>

              <div class="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100 flex">
                <div
                  class="h-full bg-violet-500"
                  :style="{
                    width: item.total_customers
                      ? `${(Number(item.self_found_customers || 0) / Number(item.total_customers)) * 100}%`
                      : '0%'
                  }"
                ></div>
                <div
                  class="h-full bg-cyan-500"
                  :style="{
                    width: item.total_customers
                      ? `${(Number(item.company_lead_customers || 0) / Number(item.total_customers)) * 100}%`
                      : '0%'
                  }"
                ></div>
              </div>

              <div class="mt-2 flex items-center gap-4 text-xs text-slate-500">
                <span class="flex items-center gap-1">
                  <span class="h-2.5 w-2.5 rounded-full bg-violet-500"></span>
                  Tự tìm: {{ item.self_found_customers || 0 }}
                </span>
                <span class="flex items-center gap-1">
                  <span class="h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
                  Công ty / MKT: {{ item.company_lead_customers || 0 }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Assignments In Period</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goCustomers({ assigned_in_period: 1 })">Chi tiết</button>
          </div>

          <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="item in assignedInPeriodRows"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="goCustomers({ sale_id: item.user_id, assigned_in_period: 1 })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ item.assigned_in_period }} khách</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-cyan-500" :style="{ width: barWidth(item.assigned_in_period, assignedInPeriodMax) }"></div>
              </div>
            </button>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Conversion by Sale</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goCustomers({ assigned_in_period: 1 })">Chi tiết</button>
          </div>

          <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="item in conversionBySale"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="goCustomers({ sale_id: item.user_id, assigned_in_period: 1 })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ formatPercent(item.conversion_rate) }}</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-violet-500" :style="{ width: barWidth(item.conversion_rate, conversionMax) }"></div>
              </div>
              <div class="mt-2 text-xs text-slate-400">
                {{ item.won_count }} won / {{ item.assigned_count }} assigned
              </div>
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Customer Group Insights</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goCustomers()">Chi tiết</button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <button class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100" @click="goCustomers({ customer_group: 'self_found' })">
              <div class="text-sm text-slate-500">Khách tự tìm</div>
              <div class="mt-2 text-3xl font-semibold text-slate-900">{{ summary.current_assigned_self_found }}</div>
              <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>New: {{ summary.assigned_in_period_self_found }}</div>
                <div>Won: {{ summary.month_won_self_found }}</div>
                <div>Lost: {{ summary.month_lost_self_found }}</div>
                <div>Revenue: {{ formatCompactMoney(summary.month_revenue_self_found) }}</div>
              </div>
            </button>

            <button class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100" @click="goCustomers({ customer_group: 'company_lead' })">
              <div class="text-sm text-slate-500">Khách công ty / MKT</div>
              <div class="mt-2 text-3xl font-semibold text-slate-900">{{ summary.current_assigned_company_lead }}</div>
              <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>New: {{ summary.assigned_in_period_company_lead }}</div>
                <div>Won: {{ summary.month_won_company_lead }}</div>
                <div>Lost: {{ summary.month_lost_company_lead }}</div>
                <div>Revenue: {{ formatCompactMoney(summary.month_revenue_company_lead) }}</div>
              </div>
            </button>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Aging Pipeline</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goCustomers({ open_only: 1 })">Chi tiết</button>
          </div>

          <div class="overflow-hidden rounded-2xl border border-slate-200">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">Status</th>
                  <th class="px-4 py-3 font-medium">0-7</th>
                  <th class="px-4 py-3 font-medium">8-14</th>
                  <th class="px-4 py-3 font-medium">15-30</th>
                  <th class="px-4 py-3 font-medium">30+</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in aging" :key="row.status" class="border-t border-slate-100">
                  <td class="px-4 py-3 font-medium text-slate-900">{{ row.status }}</td>
                  <td class="px-4 py-3">{{ row.d7 }}</td>
                  <td class="px-4 py-3">{{ row.d14 }}</td>
                  <td class="px-4 py-3">{{ row.d30 }}</td>
                  <td class="px-4 py-3">{{ row.d30plus }}</td>
                </tr>
                <tr v-if="!aging.length">
                  <td colspan="5" class="px-4 py-10 text-center text-sm text-slate-500">Không có dữ liệu.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Data Center</h2>
            <div class="mt-1 text-sm text-slate-500">
              {{ topSale?.user_name ? `Top sale: ${topSale.user_name}` : '' }}
              <span v-if="myRank?.rank" class="ml-4">My rank: #{{ myRank.rank }}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="rounded-2xl px-4 py-2 text-sm font-medium transition"
            :class="activeTab === tab.key ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-left text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">Company</th>
                <th class="px-4 py-3 font-medium">Contact</th>
                <th class="px-4 py-3 font-medium">Phone</th>
                <th class="px-4 py-3 font-medium">Sale</th>
                <th class="px-4 py-3 font-medium">Info</th>
              </tr>
            </thead>

            <tbody v-if="tableLoading">
              <tr v-for="i in 8" :key="i" class="border-t border-slate-100">
                <td class="px-4 py-4"><div class="h-4 w-32 animate-pulse rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-4 w-24 animate-pulse rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-4 w-20 animate-pulse rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-4 w-20 animate-pulse rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-4 w-28 animate-pulse rounded bg-slate-200"></div></td>
              </tr>
            </tbody>

            <tbody v-else>
              <tr v-for="row in tableData.data" :key="row.id" class="border-t border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-3 font-medium text-slate-900">{{ row.company_name || '-' }}</td>
                <td class="px-4 py-3">{{ row.contact_name || '-' }}</td>
                <td class="px-4 py-3">{{ row.phone || '-' }}</td>
                <td class="px-4 py-3">{{ row.sale_name || '-' }}</td>
                <td class="px-4 py-3">
                  {{ row.warning_level || row.reason || row.revenue || row.assigned_at || row.deposit_date || row.lost_at || row.status || '-' }}
                </td>
              </tr>

              <tr v-if="!tableData.data?.length">
                <td colspan="5" class="px-4 py-10 text-center text-sm text-slate-500">Không có dữ liệu.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <div class="text-sm text-slate-500">Total: {{ tableData.total || 0 }}</div>

          <div class="flex items-center gap-2">
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              :disabled="tableData.current_page <= 1"
              @click="tablePage--; fetchTable()"
            >
              Prev
            </button>
            <div class="text-sm text-slate-500">{{ tableData.current_page || 1 }} / {{ tableData.last_page || 1 }}</div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              :disabled="tableData.current_page >= tableData.last_page"
              @click="tablePage++; fetchTable()"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  </MainLayout>
</template>