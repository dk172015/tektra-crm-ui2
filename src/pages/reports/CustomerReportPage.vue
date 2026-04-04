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

const loading = ref(false)
const tableLoading = ref(false)
const saleOptions = ref([])

const isPrivileged = computed(() => ['admin', 'leader'].includes(auth.user?.role))

const filters = reactive({
  date_from: '',
  date_to: '',
  sale_id: '',
})

const activeTab = ref('new_assignments')

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

const tablePage = ref(1)

const tabs = [
  { key: 'new_assignments', label: 'New Assignments' },
  { key: 'warning', label: 'Warning' },
  { key: 'viewing', label: 'Viewing' },
  { key: 'deals', label: 'Deals' },
  { key: 'lost', label: 'Lost' },
]

const baseParams = computed(() => ({
  date_from: filters.date_from || undefined,
  date_to: filters.date_to || undefined,
  sale_id: isPrivileged.value ? (filters.sale_id || undefined) : undefined,
}))

const statusMap = computed(() => {
  const map = {}
  for (const row of pipeline.value) {
    map[row.status] = Number(row.total || 0)
  }
  return map
})

const assignedSaleMax = computed(() => Math.max(...bySale.value.map(x => Number(x.total_customers || 0)), 0))
const inflowSaleMax = computed(() => Math.max(...assignedInPeriod.value.map(x => Number(x.total_assigned || 0)), 0))
const conversionMax = computed(() => Math.max(...conversionBySale.value.map(x => Number(x.conversion_rate || 0)), 0))

const barWidth = (value, max) => {
  const numeric = Number(value || 0)
  const maxValue = Number(max || 0)
  if (!maxValue || !numeric) return '0%'
  return `${Math.max(8, (numeric / maxValue) * 100)}%`
}

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

const fetchSummaryBlocks = async () => {
  const [
    summaryRes,
    pipelineRes,
    bySaleRes,
    assignedInPeriodRes,
    conversionRes,
    warningRes,
    agingRes,
  ] = await Promise.all([
    getCustomerReportSummaryApi(baseParams.value),
    getCustomerReportPipelineApi(baseParams.value),
    getCustomerReportBySaleApi(baseParams.value),
    getCustomerReportAssignedInPeriodApi(baseParams.value),
    getCustomerReportConversionBySaleApi(baseParams.value),
    getCustomerReportWarningApi(baseParams.value),
    getCustomerReportAgingApi(baseParams.value),
  ])

  summary.value = summaryRes.data
  pipeline.value = pipelineRes.data.data || []
  bySale.value = bySaleRes.data.data || []
  assignedInPeriod.value = assignedInPeriodRes.data.data || []
  conversionBySale.value = conversionRes.data.data || []
  warning.value = warningRes.data
  aging.value = agingRes.data.data || []
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
    await fetchSummaryBlocks()
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
              Báo cáo tổng hợp toàn bộ chỉ số khách hàng: workload, inflow, pipeline, warning, conversion và detail data center.
            </p>
          </div>

          <div
            class="grid gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-3"
            :class="isPrivileged ? 'sm:grid-cols-[1fr_1fr_1fr_auto_auto]' : 'sm:grid-cols-[1fr_1fr_auto_auto]'"
          >
            <input v-model="filters.date_from" type="date" class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" />
            <input v-model="filters.date_to" type="date" class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none" />

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

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <button class="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md" @click="goCustomers()">
          <div class="text-xs uppercase tracking-wide text-slate-400">Current Assigned</div>
          <div class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.current_assigned_customers }}</div>
        </button>

        <button class="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md" @click="goCustomers({ assigned_in_period: 1 })">
          <div class="text-xs uppercase tracking-wide text-slate-400">Assigned In Period</div>
          <div class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.assigned_in_period }}</div>
        </button>

        <button class="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md" @click="goCustomers({ open_only: 1 })">
          <div class="text-xs uppercase tracking-wide text-slate-400">Processing</div>
          <div class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.processing_customers }}</div>
        </button>

        <button class="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md" @click="goDeals()">
          <div class="text-xs uppercase tracking-wide text-slate-400">Won In Period</div>
          <div class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.won_in_period }}</div>
        </button>

        <button class="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md" @click="goLosses()">
          <div class="text-xs uppercase tracking-wide text-slate-400">Lost In Period</div>
          <div class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.lost_in_period }}</div>
        </button>

        <button class="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-left shadow-sm hover:shadow-md" @click="goCustomers({ warning_level: 'yellow' })">
          <div class="text-xs uppercase tracking-wide text-amber-600">Yellow Warning</div>
          <div class="mt-3 text-3xl font-semibold text-amber-700">{{ summary.yellow_warnings }}</div>
        </button>

        <button class="rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-left shadow-sm hover:shadow-md" @click="goCustomers({ warning_level: 'red' })">
          <div class="text-xs uppercase tracking-wide text-rose-600">Red Warning</div>
          <div class="mt-3 text-3xl font-semibold text-rose-700">{{ summary.red_warnings }}</div>
        </button>

        <button class="rounded-[24px] border border-indigo-200 bg-indigo-50 p-5 text-left shadow-sm hover:shadow-md" @click="goCustomers({ assigned_in_period: 1 })">
          <div class="text-xs uppercase tracking-wide text-indigo-600">Conversion</div>
          <div class="mt-3 text-3xl font-semibold text-indigo-700">{{ summary.conversion_rate }}%</div>
        </button>
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">Pipeline Overview</h2>
            <button class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" @click="goCustomers()">
              Open Customers
            </button>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100" @click="goCustomers({ status: 'new' })">
              <div class="text-xs text-slate-400">New</div>
              <div class="mt-2 text-2xl font-semibold text-slate-900">{{ statusMap.new || 0 }}</div>
            </button>
            <button class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100" @click="goCustomers({ status: 'consulting' })">
              <div class="text-xs text-slate-400">Consulting</div>
              <div class="mt-2 text-2xl font-semibold text-slate-900">{{ statusMap.consulting || 0 }}</div>
            </button>
            <button class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100" @click="goCustomers({ status: 'viewing' })">
              <div class="text-xs text-slate-400">Viewing</div>
              <div class="mt-2 text-2xl font-semibold text-slate-900">{{ statusMap.viewing || 0 }}</div>
            </button>
            <button class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100" @click="goCustomers({ status: 'negotiating' })">
              <div class="text-xs text-slate-400">Negotiating</div>
              <div class="mt-2 text-2xl font-semibold text-slate-900">{{ statusMap.negotiating || 0 }}</div>
            </button>
            <button class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100" @click="goCustomers({ status: 'deposit' })">
              <div class="text-xs text-slate-400">Deposit</div>
              <div class="mt-2 text-2xl font-semibold text-slate-900">{{ statusMap.deposit || 0 }}</div>
            </button>
            <button class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100" @click="goCustomers({ status: 'contracted' })">
              <div class="text-xs text-slate-400">Contracted</div>
              <div class="mt-2 text-2xl font-semibold text-slate-900">{{ statusMap.contracted || 0 }}</div>
            </button>
            <button class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100" @click="goCustomers({ status: 'lost' })">
              <div class="text-xs text-slate-400">Lost</div>
              <div class="mt-2 text-2xl font-semibold text-slate-900">{{ statusMap.lost || 0 }}</div>
            </button>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">Warning Center</h2>
            <button class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" @click="goCustomers({ warning: 1 })">
              Open Alerts
            </button>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <button class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left hover:bg-amber-100" @click="goCustomers({ warning_level: 'yellow' })">
              <div class="text-xs text-amber-600">Yellow</div>
              <div class="mt-2 text-2xl font-semibold text-amber-700">{{ warning.yellow_warnings }}</div>
            </button>
            <button class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-left hover:bg-rose-100" @click="goCustomers({ warning_level: 'red' })">
              <div class="text-xs text-rose-600">Red</div>
              <div class="mt-2 text-2xl font-semibold text-rose-700">{{ warning.red_warnings }}</div>
            </button>
            <button class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100" @click="goCustomers({ due_today: 1 })">
              <div class="text-xs text-slate-400">Due Today</div>
              <div class="mt-2 text-2xl font-semibold text-slate-900">{{ warning.due_today }}</div>
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">Customers by Sale</h2>
            <button class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" @click="goCustomers()">
              Detail
            </button>
          </div>

          <div class="space-y-3">
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
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-slate-900" :style="{ width: barWidth(item.total_customers, assignedSaleMax) }"></div>
              </div>
            </button>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">Assignments In Period</h2>
            <button class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" @click="goCustomers({ assigned_in_period: 1 })">
              Detail
            </button>
          </div>

          <div class="space-y-3">
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
                <div class="h-full rounded-full bg-blue-600" :style="{ width: barWidth(item.total_assigned, inflowSaleMax) }"></div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">Conversion by Sale</h2>
            <button class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" @click="goDeals()">
              Won Detail
            </button>
          </div>

          <div class="space-y-3">
            <button
              v-for="item in conversionBySale"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="goCustomers({ sale_id: item.user_id, assigned_in_period: 1 })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ item.conversion_rate }}%</span>
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
            <h2 class="text-base font-semibold text-slate-900">Aging Pipeline</h2>
            <button class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" @click="goCustomers({ open_only: 1 })">
              Open List
            </button>
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
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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

          <div class="text-sm text-slate-500">
            Detail Data Center
          </div>
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
          <div class="text-sm text-slate-500">
            Total: {{ tableData.total || 0 }}
          </div>

          <div class="flex items-center gap-2">
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              :disabled="tableData.current_page <= 1"
              @click="tablePage--; fetchTable()"
            >
              Prev
            </button>
            <div class="text-sm text-slate-500">
              {{ tableData.current_page || 1 }} / {{ tableData.last_page || 1 }}
            </div>
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