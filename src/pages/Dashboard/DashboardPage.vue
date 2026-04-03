<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import {
  getDashboardSummaryApi,
  getDashboardRevenueDailyApi,
  getDashboardRevenueBySaleApi,
  getDashboardCustomersBySaleApi,
  getDashboardPipelineResultApi,
  getDashboardTopSaleApi,
  getDashboardMyRankApi,
  getDashboardConversionBySaleApi,
  getDashboardSourcePerformanceApi,
  getDashboardBuildingPerformanceApi,
  getDashboardRecycleLeadsApi,
  getDashboardAgingPipelineApi,
  getDashboardAssignedCurrentApi,
  getDashboardAssignedInPeriodApi,
} from '../../api/dashboard'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)

const filters = reactive({
  date_from: '',
  date_to: '',
})

const summary = ref({
  current_assigned_customers: 0,
  assigned_in_period: 0,
  processing_customers: 0,
  month_revenue: 0,
  team_month_revenue: null,
  month_won_customers: 0,
  month_lost_customers: 0,
  yellow_warnings: 0,
  red_warnings: 0,
  date_from: '',
  date_to: '',
})

const revenueDaily = ref([])
const revenueBySale = ref([])
const customersBySale = ref([])
const pipelineResult = ref({
  open_customers: 0,
  won_customers: 0,
  lost_customers: 0,
})
const topSale = ref(null)
const myRank = ref(null)
const conversionBySale = ref([])
const sourcePerformance = ref([])
const buildingPerformance = ref([])
const recycleLeads = ref([])
const agingPipeline = ref([])
const assignedCurrentRows = ref([])
const assignedInPeriodRows = ref([])

const isPrivileged = computed(() => ['admin', 'leader'].includes(auth.user?.role))

const currentRange = computed(() => ({
  date_from: summary.value.date_from || filters.date_from || undefined,
  date_to: summary.value.date_to || filters.date_to || undefined,
}))

const formatMoney = (value) => {
  const number = Number(value || 0)
  return new Intl.NumberFormat('vi-VN').format(number)
}

const formatCompactMoney = (value) => {
  const number = Number(value || 0)
  if (number >= 1000000000) return `${(number / 1000000000).toFixed(1)}B`
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`
  return `${number}`
}

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`

const linePoints = computed(() => {
  const rows = revenueDaily.value
  if (!rows.length) return ''

  const width = 960
  const height = 260
  const padding = 28
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

const revenueSaleMax = computed(() =>
  Math.max(...revenueBySale.value.map((item) => Number(item.revenue || 0)), 0)
)

const customerSaleMax = computed(() =>
  Math.max(...customersBySale.value.map((item) => Number(item.total_customers || 0)), 0)
)

const sourceMax = computed(() =>
  Math.max(...sourcePerformance.value.map((item) => Number(item.revenue || 0)), 0)
)

const buildingMax = computed(() =>
  Math.max(...buildingPerformance.value.map((item) => Number(item.revenue || 0)), 0)
)

const conversionMax = computed(() =>
  Math.max(...conversionBySale.value.map((item) => Number(item.conversion_rate || 0)), 0)
)

const assignedCurrentMax = computed(() =>
  Math.max(...assignedCurrentRows.value.map((item) => Number(item.total_customers || 0)), 0)
)

const assignedInPeriodMax = computed(() =>
  Math.max(...assignedInPeriodRows.value.map((item) => Number(item.assigned_in_period || 0)), 0)
)

const barWidth = (value, max) => {
  const numeric = Number(value || 0)
  const maxValue = Number(max || 0)
  if (!maxValue || !numeric) return '0%'
  return `${Math.max(8, (numeric / maxValue) * 100)}%`
}

const donutStyle = computed(() => {
  const open = Number(pipelineResult.value.open_customers || 0)
  const won = Number(pipelineResult.value.won_customers || 0)
  const lost = Number(pipelineResult.value.lost_customers || 0)
  const total = open + won + lost

  if (!total) return { background: 'conic-gradient(#e2e8f0 0 100%)' }

  const openDeg = (open / total) * 360
  const wonDeg = (won / total) * 360
  const lostDeg = (lost / total) * 360

  return {
    background: `conic-gradient(
      #0f172a 0deg ${openDeg}deg,
      #16a34a ${openDeg}deg ${openDeg + wonDeg}deg,
      #dc2626 ${openDeg + wonDeg}deg ${openDeg + wonDeg + lostDeg}deg
    )`,
  }
})

const recycledSummary = computed(() => {
  const deal = recycleLeads.value.find((item) => item.revived_from_type === 'deal')?.total || 0
  const loss = recycleLeads.value.find((item) => item.revived_from_type === 'loss')?.total || 0
  return { deal, loss }
})

const goCustomers = (extra = {}) => {
  router.push({
    path: '/customers',
    query: {
      ...currentRange.value,
      ...extra,
    },
  })
}

const goDeals = (extra = {}) => {
  router.push({
    path: '/customer-deals',
    query: {
      ...currentRange.value,
      ...extra,
    },
  })
}

const goLosses = (extra = {}) => {
  router.push({
    path: '/customer-losses',
    query: {
      ...currentRange.value,
      ...extra,
    },
  })
}

const goRevenueAnalytics = (extra = {}) => {
  router.push({
    path: '/analytics/revenue',
    query: {
      ...currentRange.value,
      ...extra,
    },
  })
}

const goRevenueReport = (extra = {}) => {
  router.push({
    path: '/reports/revenue',
    query: {
      ...currentRange.value,
      ...extra,
    },
  })
}

const goCustomerReport = (extra = {}) => {
  router.push({
    path: '/reports/customers',
    query: {
      ...currentRange.value,
      ...extra,
    },
  })
}

const fetchDashboard = async () => {
  loading.value = true
  try {
    const params = {
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    }

    const [
      summaryRes,
      revenueDailyRes,
      revenueBySaleRes,
      customersBySaleRes,
      pipelineRes,
      topSaleRes,
      myRankRes,
      conversionRes,
      sourceRes,
      buildingRes,
      recycleRes,
      agingRes,
      assignedCurrentRes,
      assignedInPeriodRes,
    ] = await Promise.all([
      getDashboardSummaryApi(params),
      getDashboardRevenueDailyApi(params),
      getDashboardRevenueBySaleApi(params),
      getDashboardCustomersBySaleApi(params),
      getDashboardPipelineResultApi(params),
      getDashboardTopSaleApi(params),
      getDashboardMyRankApi(params),
      getDashboardConversionBySaleApi(params),
      getDashboardSourcePerformanceApi(params),
      getDashboardBuildingPerformanceApi(params),
      getDashboardRecycleLeadsApi(params),
      getDashboardAgingPipelineApi(params),
      getDashboardAssignedCurrentApi(params),
      getDashboardAssignedInPeriodApi(params),
    ])

    summary.value = summaryRes.data
    revenueDaily.value = revenueDailyRes.data.data || []
    revenueBySale.value = revenueBySaleRes.data.data || []
    customersBySale.value = customersBySaleRes.data.data || []
    pipelineResult.value = pipelineRes.data
    topSale.value = topSaleRes.data.data || null
    myRank.value = myRankRes.data.data || null
    conversionBySale.value = conversionRes.data.data || []
    sourcePerformance.value = sourceRes.data.data || []
    buildingPerformance.value = buildingRes.data.data || []
    recycleLeads.value = recycleRes.data.data || []
    agingPipeline.value = agingRes.data.data || []
    assignedCurrentRows.value = assignedCurrentRes.data.data || []
    assignedInPeriodRows.value = assignedInPeriodRes.data.data || []
  } catch (error) {
    alert(error?.response?.data?.message || 'Không tải được dashboard.')
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
</script>

<template>
  <MainLayout>
    <div class="space-y-6">
      <section class="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-6 py-6 shadow-sm">
        <div class="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              Enterprise CRM Dashboard
            </div>
            <h1 class="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Điều hành sale, pipeline và doanh thu
            </h1>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Dashboard này tách rõ workload hiện tại, inflow trong kỳ, kết quả chốt/mất và doanh thu
              theo ngày đặt cọc để tránh nhầm giữa “khách đang phụ trách” và “khách được phân trong kỳ”.
            </p>
          </div>

          <div class="grid gap-2 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
            <input
              v-model="filters.date_from"
              type="date"
              class="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
            />
            <input
              v-model="filters.date_to"
              type="date"
              class="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
            />
            <button
              class="h-11 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
              @click="fetchDashboard"
            >
              Cập nhật
            </button>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Workload hiện tại</h2>
            <p class="text-xs text-slate-500">Số liệu phản ánh khách đang thuộc sale ở thời điểm hiện tại.</p>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <button
            class="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            @click="goCustomers()"
          >
            <div class="flex items-center justify-between">
              <div class="text-xs uppercase tracking-wide text-slate-400">Khách đang phụ trách</div>
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">Current</span>
            </div>
            <div class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.current_assigned_customers }}</div>
            <div class="mt-2 text-sm text-slate-500 group-hover:text-slate-700">Tổng khách hiện thuộc sale</div>
          </button>

          <button
            class="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            @click="goCustomers({ open_only: 1 })"
          >
            <div class="flex items-center justify-between">
              <div class="text-xs uppercase tracking-wide text-slate-400">Khách đang xử lý</div>
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">Open</span>
            </div>
            <div class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.processing_customers }}</div>
            <div class="mt-2 text-sm text-slate-500 group-hover:text-slate-700">Không gồm contracted và lost</div>
          </button>

          <button
            class="group rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            @click="goCustomers({ warning_level: 'yellow' })"
          >
            <div class="flex items-center justify-between">
              <div class="text-xs uppercase tracking-wide text-amber-600">Cảnh báo vàng</div>
              <span class="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] text-amber-700">Yellow</span>
            </div>
            <div class="mt-3 text-3xl font-semibold text-amber-700">{{ summary.yellow_warnings }}</div>
            <div class="mt-2 text-sm text-amber-700/80">Khách cần theo dõi sớm</div>
          </button>

          <button
            class="group rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            @click="goCustomers({ warning_level: 'red' })"
          >
            <div class="flex items-center justify-between">
              <div class="text-xs uppercase tracking-wide text-rose-600">Cảnh báo đỏ</div>
              <span class="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] text-rose-700">Red</span>
            </div>
            <div class="mt-3 text-3xl font-semibold text-rose-700">{{ summary.red_warnings }}</div>
            <div class="mt-2 text-sm text-rose-700/80">Khách cần xử lý ngay</div>
          </button>
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Phát sinh và kết quả trong kỳ</h2>
            <p class="text-xs text-slate-500">Tính theo khoảng thời gian đang lọc ở đầu dashboard.</p>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <button
            class="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            @click="goCustomers({ assigned_in_period: 1 })"
          >
            <div class="flex items-center justify-between">
              <div class="text-xs uppercase tracking-wide text-slate-400">Khách được phân trong kỳ</div>
              <span class="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700">Inflow</span>
            </div>
            <div class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.assigned_in_period }}</div>
            <div class="mt-2 text-sm text-slate-500 group-hover:text-slate-700">Assignment mới phát sinh trong kỳ</div>
          </button>

          <button
            class="group rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            @click="goDeals()"
          >
            <div class="flex items-center justify-between">
              <div class="text-xs uppercase tracking-wide text-emerald-600">Doanh thu trong kỳ</div>
              <span class="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] text-emerald-700">Deposit</span>
            </div>
            <div class="mt-3 text-3xl font-semibold text-emerald-700">{{ formatCompactMoney(summary.month_revenue) }}</div>
            <div class="mt-2 text-sm text-slate-500 group-hover:text-slate-700">Tính theo ngày đặt cọc</div>
          </button>

          <button
            v-if="isPrivileged"
            class="group rounded-[28px] border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            @click="goRevenueAnalytics()"
          >
            <div class="flex items-center justify-between">
              <div class="text-xs uppercase tracking-wide text-indigo-600">Doanh thu team trong kỳ</div>
              <span class="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] text-indigo-700">Team</span>
            </div>
            <div class="mt-3 text-3xl font-semibold text-indigo-700">{{ formatCompactMoney(summary.team_month_revenue) }}</div>
            <div class="mt-2 text-sm text-slate-500 group-hover:text-slate-700">Tổng doanh thu toàn team</div>
          </button>

          <button
            class="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            @click="goDeals()"
          >
            <div class="flex items-center justify-between">
              <div class="text-xs uppercase tracking-wide text-slate-400">Khách chốt trong kỳ</div>
              <span class="rounded-full bg-green-50 px-2.5 py-1 text-[11px] text-green-700">Won</span>
            </div>
            <div class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.month_won_customers }}</div>
            <div class="mt-2 text-sm text-slate-500 group-hover:text-slate-700">Theo ngày đặt cọc</div>
          </button>

          <button
            class="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            @click="goLosses()"
          >
            <div class="flex items-center justify-between">
              <div class="text-xs uppercase tracking-wide text-slate-400">Khách mất trong kỳ</div>
              <span class="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700">Lost</span>
            </div>
            <div class="mt-3 text-3xl font-semibold text-slate-900">{{ summary.month_lost_customers }}</div>
            <div class="mt-2 text-sm text-slate-500 group-hover:text-slate-700">Theo thời điểm mất khách</div>
          </button>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Xu hướng doanh thu theo ngày đặt cọc</h2>
              <p class="mt-1 text-xs text-slate-500">Dùng để theo dõi nhịp doanh thu trong kỳ</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                @click="goDeals()"
              >
                Khách đã chốt
              </button>
              <button
                class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                @click="goRevenueAnalytics()"
              >
                Phân tích doanh thu
              </button>
            </div>
          </div>

          <div v-if="loading" class="mt-5 h-[320px] animate-pulse rounded-2xl bg-slate-100"></div>

          <div v-else-if="revenueDaily.length" class="mt-5">
            <svg viewBox="0 0 960 260" class="h-[320px] w-full">
              <polyline
                fill="none"
                stroke="#cbd5e1"
                stroke-width="2"
                :points="'28,232 932,232'"
              />
              <polyline
                fill="none"
                stroke="#0f172a"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                :points="linePoints"
              />
              <circle
                v-for="(item, index) in revenueDaily"
                :key="index"
                :cx="linePoints.split(' ')[index]?.split(',')[0]"
                :cy="linePoints.split(' ')[index]?.split(',')[1]"
                r="4"
                fill="#0f172a"
              />
            </svg>

            <div class="mt-4 grid gap-2 md:grid-cols-4">
              <button
                v-for="item in revenueDaily.slice(0, 8)"
                :key="item.label"
                class="rounded-2xl bg-slate-50 px-3 py-2 text-left text-xs transition hover:bg-slate-100"
                @click="goDeals({ date_from: item.label, date_to: item.label })"
              >
                <div class="text-slate-400">{{ item.label }}</div>
                <div class="mt-1 font-medium text-slate-900">{{ formatCompactMoney(item.revenue) }}</div>
              </button>
            </div>
          </div>

          <div v-else class="mt-5 rounded-2xl bg-slate-50 px-4 py-10 text-sm text-slate-500">
            Không có dữ liệu doanh thu trong kỳ.
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Kết quả pipeline</h2>
              <p class="mt-1 text-xs text-slate-500">Open / Chốt / Mất</p>
            </div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="goCustomerReport()"
            >
              Báo cáo khách hàng
            </button>
          </div>

          <div v-if="loading" class="mt-5 h-[320px] animate-pulse rounded-2xl bg-slate-100"></div>

          <div v-else class="mt-5 flex flex-col items-center">
            <div
              class="relative h-48 w-48 rounded-full"
              :style="donutStyle"
            >
              <div class="absolute inset-5 flex items-center justify-center rounded-full bg-white text-center">
                <div>
                  <div class="text-xs uppercase tracking-wide text-slate-400">Tổng</div>
                  <div class="mt-1 text-2xl font-semibold text-slate-900">
                    {{
                      Number(pipelineResult.open_customers || 0) +
                      Number(pipelineResult.won_customers || 0) +
                      Number(pipelineResult.lost_customers || 0)
                    }}
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5 grid w-full gap-3">
              <button
                class="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50"
                @click="goCustomers({ open_only: 1 })"
              >
                <span class="flex items-center gap-2">
                  <span class="h-3 w-3 rounded-full bg-slate-900"></span>
                  Open
                </span>
                <span class="font-semibold">{{ pipelineResult.open_customers }}</span>
              </button>

              <button
                class="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50"
                @click="goDeals()"
              >
                <span class="flex items-center gap-2">
                  <span class="h-3 w-3 rounded-full bg-green-600"></span>
                  Chốt trong kỳ
                </span>
                <span class="font-semibold">{{ pipelineResult.won_customers }}</span>
              </button>

              <button
                class="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50"
                @click="goLosses()"
              >
                <span class="flex items-center gap-2">
                  <span class="h-3 w-3 rounded-full bg-red-600"></span>
                  Mất trong kỳ
                </span>
                <span class="font-semibold">{{ pipelineResult.lost_customers }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Khách đang phụ trách theo sale</h2>
              <p class="mt-1 text-xs text-slate-500">Workload hiện tại của từng sale</p>
            </div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="goCustomers()"
            >
              Mở danh sách
            </button>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="mt-5 space-y-3">
            <button
              v-for="item in assignedCurrentRows"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
              @click="goCustomers({ sale_id: item.user_id })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ item.total_customers }} khách</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-slate-900"
                  :style="{ width: barWidth(item.total_customers, assignedCurrentMax) }"
                ></div>
              </div>
            </button>

            <div v-if="!assignedCurrentRows.length" class="rounded-2xl bg-slate-50 px-4 py-10 text-sm text-slate-500">
              Không có dữ liệu workload.
            </div>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Khách được phân trong kỳ theo sale</h2>
              <p class="mt-1 text-xs text-slate-500">Assignment phát sinh trong khoảng thời gian đang lọc</p>
            </div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="goCustomers({ assigned_in_period: 1 })"
            >
              Mở danh sách
            </button>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="mt-5 space-y-3">
            <button
              v-for="item in assignedInPeriodRows"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
              @click="goCustomers({ sale_id: item.user_id, assigned_in_period: 1 })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ item.assigned_in_period }} khách</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-blue-600"
                  :style="{ width: barWidth(item.assigned_in_period, assignedInPeriodMax) }"
                ></div>
              </div>
            </button>

            <div v-if="!assignedInPeriodRows.length" class="rounded-2xl bg-slate-50 px-4 py-10 text-sm text-slate-500">
              Không có dữ liệu assignment trong kỳ.
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Doanh thu theo sale</h2>
              <p class="mt-1 text-xs text-slate-500">Tính theo ngày đặt cọc</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                @click="goRevenueAnalytics()"
              >
                Phân tích
              </button>
              <button
                class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                @click="goRevenueReport()"
              >
                Báo cáo
              </button>
            </div>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="mt-5 space-y-3">
            <button
              v-for="item in revenueBySale"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
              @click="goDeals({ sale_id: item.user_id })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ formatCompactMoney(item.revenue) }}</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-emerald-600"
                  :style="{ width: barWidth(item.revenue, revenueSaleMax) }"
                ></div>
              </div>
              <div class="mt-2 text-xs text-slate-400">{{ item.total_deals }} hợp đồng</div>
            </button>

            <div v-if="!revenueBySale.length" class="rounded-2xl bg-slate-50 px-4 py-10 text-sm text-slate-500">
              Không có dữ liệu doanh thu.
            </div>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Tỷ lệ chuyển đổi theo sale</h2>
              <p class="mt-1 text-xs text-slate-500">Won / khách đang phụ trách hoặc tập khách đang tính</p>
            </div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="goCustomerReport()"
            >
              Mở báo cáo
            </button>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="mt-5 space-y-3">
            <button
              v-for="item in conversionBySale"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="goCustomers({ sale_id: item.user_id })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ formatPercent(item.conversion_rate) }}</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-indigo-600"
                  :style="{ width: barWidth(item.conversion_rate, conversionMax) }"
                ></div>
              </div>
              <div class="mt-2 text-xs text-slate-400">
                {{ item.won_customers }} chốt / {{ item.assigned_customers }} khách
              </div>
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-3">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Nguồn khách hiệu quả</h2>
              <p class="mt-1 text-xs text-slate-500">Theo doanh thu</p>
            </div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="goRevenueAnalytics()"
            >
              Phân tích
            </button>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="mt-5 space-y-3">
            <div
              v-for="item in sourcePerformance.slice(0, 6)"
              :key="item.source_name"
              class="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.source_name }}</span>
                <span class="text-slate-500">{{ formatCompactMoney(item.revenue) }}</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-amber-500"
                  :style="{ width: barWidth(item.revenue, sourceMax) }"
                ></div>
              </div>
              <div class="mt-2 text-xs text-slate-400">{{ item.total_deals }} hợp đồng</div>
            </div>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Tòa nhà hiệu quả</h2>
              <p class="mt-1 text-xs text-slate-500">Top theo doanh thu</p>
            </div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="goRevenueAnalytics()"
            >
              Phân tích
            </button>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="mt-5 space-y-3">
            <div
              v-for="item in buildingPerformance.slice(0, 6)"
              :key="item.building_name"
              class="rounded-2xl border border-slate-200 px-4 py-3"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.building_name }}</span>
                <span class="text-slate-500">{{ formatCompactMoney(item.revenue) }}</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-indigo-600"
                  :style="{ width: barWidth(item.revenue, buildingMax) }"
                ></div>
              </div>
              <div class="mt-2 text-xs text-slate-400">{{ item.total_deals }} hợp đồng</div>
            </div>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="text-xs uppercase tracking-wide text-slate-400">Insight nhanh</div>

          <button
            class="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
            @click="goRevenueReport()"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-xs uppercase tracking-wide text-slate-400">Sale dẫn đầu tháng</div>
                <div class="mt-2 text-xl font-semibold text-slate-900">{{ topSale?.user_name || '-' }}</div>
                <div class="mt-2 text-sm text-slate-500">
                  {{ topSale ? `${formatCompactMoney(topSale.revenue)} • ${topSale.total_deals} hợp đồng` : 'Chưa có dữ liệu' }}
                </div>
              </div>
              <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {{ topSale ? `${topSale.contribution_percent}% team` : 'N/A' }}
              </span>
            </div>
          </button>

          <button
            class="mt-3 w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
            @click="goRevenueReport()"
          >
            <div class="text-xs uppercase tracking-wide text-slate-400">Xếp hạng của tôi</div>
            <div class="mt-2 text-xl font-semibold text-slate-900">
              {{ myRank?.rank ? `#${myRank.rank}` : 'Chưa có hạng' }}
            </div>
            <div class="mt-2 text-sm text-slate-500">
              {{ myRank ? `${formatCompactMoney(myRank.revenue)} • ${myRank.total_deals} hợp đồng` : '-' }}
            </div>
          </button>

          <button
            class="mt-3 w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
            @click="goCustomers({ is_recycled_lead: 1 })"
          >
            <div class="text-xs uppercase tracking-wide text-slate-400">Recycle lead trong kỳ</div>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-slate-50 p-3">
                <div class="text-xs text-slate-400">Từ deal</div>
                <div class="mt-1 text-xl font-semibold text-slate-900">{{ recycledSummary.deal }}</div>
              </div>
              <div class="rounded-2xl bg-slate-50 p-3">
                <div class="text-xs text-slate-400">Từ loss</div>
                <div class="mt-1 text-xl font-semibold text-slate-900">{{ recycledSummary.loss }}</div>
              </div>
            </div>
            <div class="mt-2 text-sm text-slate-500">Mở danh sách khách tái khai thác</div>
          </button>
        </div>
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Aging pipeline</h2>
            <p class="mt-1 text-xs text-slate-500">Khách tồn theo trạng thái và số ngày</p>
          </div>
          <button
            class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            @click="goCustomers({ open_only: 1 })"
          >
            Mở danh sách khách
          </button>
        </div>

        <div class="mt-5 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-left text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">Trạng thái</th>
                <th class="px-4 py-3 font-medium">0-7 ngày</th>
                <th class="px-4 py-3 font-medium">8-14 ngày</th>
                <th class="px-4 py-3 font-medium">15-30 ngày</th>
                <th class="px-4 py-3 font-medium">&gt; 30 ngày</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in agingPipeline"
                :key="row.status"
                class="border-t border-slate-100 hover:bg-slate-50"
              >
                <td class="px-4 py-3 font-medium text-slate-900">{{ row.status }}</td>
                <td class="px-4 py-3">{{ row.bucket_7 }}</td>
                <td class="px-4 py-3">{{ row.bucket_14 }}</td>
                <td class="px-4 py-3">{{ row.bucket_30 }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="Number(row.bucket_over_30) > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ row.bucket_over_30 }}
                  </span>
                </td>
              </tr>
              <tr v-if="!agingPipeline.length">
                <td colspan="5" class="px-4 py-10 text-center text-sm text-slate-500">
                  Không có dữ liệu aging pipeline.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </MainLayout>
</template>