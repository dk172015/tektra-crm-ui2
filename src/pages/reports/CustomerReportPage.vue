<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { getUsersApi } from '../../api/users'
import {
  getCustomerReportSummaryApi,
  getCustomerReportPipelineApi,
  getCustomerReportBySaleApi,
  getCustomerReportAssignedInPeriodApi,
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
  assigned_in_period: 0,
  processing_customers: 0,
  won_in_period: 0,
  lost_in_period: 0,
  yellow_warnings: 0,
  red_warnings: 0,
  conversion_rate: 0,
})

const selfFoundSummary = ref({
  current_assigned_customers: 0,
  assigned_in_period: 0,
  processing_customers: 0,
  won_in_period: 0,
  lost_in_period: 0,
  yellow_warnings: 0,
  red_warnings: 0,
  conversion_rate: 0,
})

const companyLeadSummary = ref({
  current_assigned_customers: 0,
  assigned_in_period: 0,
  processing_customers: 0,
  won_in_period: 0,
  lost_in_period: 0,
  yellow_warnings: 0,
  red_warnings: 0,
  conversion_rate: 0,
})

const pipeline = ref([])
const bySale = ref([])
const assignedInPeriod = ref([])
const conversionBySale = ref([])
const warning = ref({
  yellow_warnings: 0,
  red_warnings: 0,
  due_today: 0,
})
const aging = ref([])

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

const assignedSaleMax = computed(() => Math.max(...bySale.value.map(x => Number(x.total_customers || 0)), 0))
const inflowSaleMax = computed(() => Math.max(...assignedInPeriod.value.map(x => Number(x.total_assigned || x.assigned_in_period || 0)), 0))
const conversionMax = computed(() => Math.max(...conversionBySale.value.map(x => Number(x.conversion_rate || 0)), 0))

const barWidth = (value, max) => {
  const numeric = Number(value || 0)
  const maxValue = Number(max || 0)
  if (!maxValue || !numeric) return '0%'
  return `${Math.max(8, (numeric / maxValue) * 100)}%`
}

const splitKpis = computed(() => [
  {
    label: 'Khách phụ trách',
    total: summary.value.current_assigned_customers,
    selfFound: selfFoundSummary.value.current_assigned_customers,
    companyLead: companyLeadSummary.value.current_assigned_customers,
    action: () => goCustomers(),
  },
  {
    label: 'Khách tạo mới',
    total: summary.value.assigned_in_period,
    selfFound: selfFoundSummary.value.assigned_in_period,
    companyLead: companyLeadSummary.value.assigned_in_period,
    action: () => goCustomers({ assigned_in_period: 1 }),
  },
  {
    label: 'Đang xử lý',
    total: summary.value.processing_customers,
    selfFound: selfFoundSummary.value.processing_customers,
    companyLead: companyLeadSummary.value.processing_customers,
    action: () => goCustomers({ open_only: 1 }),
  },
  {
    label: 'Chốt trong kỳ',
    total: summary.value.won_in_period,
    selfFound: selfFoundSummary.value.won_in_period,
    companyLead: companyLeadSummary.value.won_in_period,
    action: () => goDeals(),
  },
  {
    label: 'Mất trong kỳ',
    total: summary.value.lost_in_period,
    selfFound: selfFoundSummary.value.lost_in_period,
    companyLead: companyLeadSummary.value.lost_in_period,
    action: () => goLosses(),
  },
  {
    label: 'Warning',
    total: Number(summary.value.yellow_warnings || 0) + Number(summary.value.red_warnings || 0),
    selfFound: Number(selfFoundSummary.value.yellow_warnings || 0) + Number(selfFoundSummary.value.red_warnings || 0),
    companyLead: Number(companyLeadSummary.value.yellow_warnings || 0) + Number(companyLeadSummary.value.red_warnings || 0),
    action: () => goCustomers({ warning: 1 }),
  },
])

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`

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

const goCustomersByGroup = (group) => {
  router.push({
    path: '/customers',
    query: {
      ...baseParams.value,
      customer_group: group,
    },
  })
}

const exportCsv = () => {
  const headers = ['Tab', 'Company', 'Contact', 'Phone', 'Sale', 'Extra']
  const rows = (tableData.value.data || []).map((row) => [
    activeTab.value,
    row.company_name || '',
    row.contact_name || '',
    row.phone || '',
    row.sale_name || '',
    row.warning_level || row.reason || row.revenue || row.assigned_at || '',
  ])

  const csv = [headers, ...rows]
    .map(line => line.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `customer-report-${activeTab.value}.csv`)
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

const fetchSummaryByGroup = async (group) => {
  const { data } = await getCustomerReportSummaryApi({
    ...baseParams.value,
    customer_group: group,
  })
  return data
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
      pipelineRes,
      bySaleRes,
      assignedInPeriodRes,
      conversionRes,
      warningRes,
      agingRes,
      selfSummaryRes,
      companySummaryRes,
    ] = await Promise.all([
      getCustomerReportSummaryApi(baseParams.value),
      getCustomerReportPipelineApi(baseParams.value),
      getCustomerReportBySaleApi(baseParams.value),
      getCustomerReportAssignedInPeriodApi(baseParams.value),
      getCustomerReportConversionBySaleApi(baseParams.value),
      getCustomerReportWarningApi(baseParams.value),
      getCustomerReportAgingApi(baseParams.value),
      fetchSummaryByGroup('self_found'),
      fetchSummaryByGroup('company_lead'),
    ])

    summary.value = summaryRes.data
    pipeline.value = pipelineRes.data.data || []
    bySale.value = bySaleRes.data.data || []
    assignedInPeriod.value = assignedInPeriodRes.data.data || []
    conversionBySale.value = conversionRes.data.data || []
    warning.value = warningRes.data
    aging.value = agingRes.data.data || []
    selfFoundSummary.value = selfSummaryRes
    companyLeadSummary.value = companySummaryRes

    await fetchTable()
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
    <div class="space-y-6">
      <section class="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div class="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              <span class="h-2 w-2 rounded-full bg-slate-900"></span>
              Customer Intelligence Center
            </div>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Customer Report</h1>
            <p class="mt-2 text-sm text-slate-500">
              Báo cáo tổng hợp khách hàng theo workload, inflow, pipeline, warning, conversion và split theo khách tự tìm / khách công ty.
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
              <option v-for="user in saleOptions" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>

            <button class="h-11 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800" @click="fetchAll">
              Apply
            </button>
            <button class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="exportCsv">
              Export
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <button
          v-for="item in splitKpis"
          :key="item.label"
          class="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md"
          @click="item.action"
        >
          <div class="text-xs uppercase tracking-wide text-slate-400">{{ item.label }}</div>
          <div class="mt-3 text-3xl font-semibold text-slate-900">{{ item.total }}</div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-xl bg-slate-50 px-3 py-2">
              <div class="text-slate-400">Tự tìm</div>
              <div class="mt-1 font-semibold text-slate-900">{{ item.selfFound }}</div>
            </div>
            <div class="rounded-xl bg-slate-50 px-3 py-2">
              <div class="text-slate-400">Công ty</div>
              <div class="mt-1 font-semibold text-slate-900">{{ item.companyLead }}</div>
            </div>
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
            <h2 class="text-xl font-semibold text-slate-900">Customers by Sale</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goCustomers()">Chi tiết</button>
          </div>

          <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="item in bySale"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="goCustomers({ sale_id: item.user_id })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ item.total_customers }} khách</span>
              </div>

              <div class="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  class="h-full rounded-full bg-slate-900"
                  :style="{ width: barWidth(item.total_customers, assignedSaleMax) }"
                ></div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div class="rounded-xl bg-slate-50 px-3 py-3">
                  <div class="text-slate-400 text-xs">Tự tìm</div>
                  <div class="mt-1 font-semibold text-slate-900">
                    {{ item.self_found_customers || 0 }} khách
                  </div>
                </div>

                <div class="rounded-xl bg-slate-50 px-3 py-3">
                  <div class="text-slate-400 text-xs">Công ty / MKT</div>
                  <div class="mt-1 font-semibold text-slate-900">
                    {{ item.company_lead_customers || 0 }} khách
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

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
              v-for="item in assignedInPeriod"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="goCustomers({ sale_id: item.user_id, assigned_in_period: 1 })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ item.total_assigned }} khách</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-cyan-500" :style="{ width: barWidth(item.total_assigned, inflowSaleMax) }"></div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
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
                <div class="h-full rounded-full bg-indigo-600" :style="{ width: barWidth(item.conversion_rate, conversionMax) }"></div>
              </div>
              <div class="mt-2 text-xs text-slate-400">{{ item.won_count }} won / {{ item.assigned_count }} assigned</div>
            </button>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-900">Customer Group Insights</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="goCustomers()">Chi tiết</button>
          </div>

          <div class="grid gap-4">
            <button class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100" @click="goCustomersByGroup('self_found')">
              <div class="text-sm text-slate-500">Khách tự tìm</div>
              <div class="mt-2 text-3xl font-semibold text-slate-900">{{ selfFoundSummary.current_assigned_customers }}</div>
              <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>New: {{ selfFoundSummary.assigned_in_period }}</div>
                <div>Won: {{ selfFoundSummary.won_in_period }}</div>
                <div>Lost: {{ selfFoundSummary.lost_in_period }}</div>
                <div>Conversion: {{ formatPercent(selfFoundSummary.conversion_rate) }}</div>
              </div>
            </button>

            <button class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100" @click="goCustomersByGroup('company_lead')">
              <div class="text-sm text-slate-500">Khách công ty / MKT</div>
              <div class="mt-2 text-3xl font-semibold text-slate-900">{{ companyLeadSummary.current_assigned_customers }}</div>
              <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>New: {{ companyLeadSummary.assigned_in_period }}</div>
                <div>Won: {{ companyLeadSummary.won_in_period }}</div>
                <div>Lost: {{ companyLeadSummary.lost_in_period }}</div>
                <div>Conversion: {{ formatPercent(companyLeadSummary.conversion_rate) }}</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
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
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-slate-900">Data Center</h2>
          <div class="text-sm text-slate-500">Detail data center</div>
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