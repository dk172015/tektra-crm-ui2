<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../layouts/MainLayout.vue'
import {
  getRevenueAnalyticsSummaryApi,
  getRevenueAnalyticsTrendApi,
  getRevenueAnalyticsBySaleApi,
  getRevenueAnalyticsByBuildingApi,
  getRevenueAnalyticsBySourceApi,
  getRevenueAnalyticsTopDealsApi,
} from '../../api/revenue-analytics'

const router = useRouter()

const loading = ref(false)

const filters = reactive({
  date_from: '',
  date_to: '',
})

const summary = ref({
  total_revenue: 0,
  total_deals: 0,
  avg_revenue: 0,
  top_deal: null,
})

const trendRows = ref([])
const saleRows = ref([])
const buildingRows = ref([])
const sourceRows = ref([])
const topDeals = ref([])

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

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

const saleMax = computed(() => Math.max(...saleRows.value.map((item) => Number(item.revenue || 0)), 0))
const buildingMax = computed(() => Math.max(...buildingRows.value.map((item) => Number(item.revenue || 0)), 0))
const sourceMax = computed(() => Math.max(...sourceRows.value.map((item) => Number(item.revenue || 0)), 0))

const barWidth = (value, max) => {
  const numeric = Number(value || 0)
  const maxValue = Number(max || 0)
  if (!maxValue || !numeric) return '0%'
  return `${Math.max(8, (numeric / maxValue) * 100)}%`
}

const linePoints = computed(() => {
  const rows = trendRows.value
  if (!rows.length) return ''

  const width = 860
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

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    }

    const [summaryRes, trendRes, saleRes, buildingRes, sourceRes, topRes] = await Promise.all([
      getRevenueAnalyticsSummaryApi(params),
      getRevenueAnalyticsTrendApi(params),
      getRevenueAnalyticsBySaleApi(params),
      getRevenueAnalyticsByBuildingApi(params),
      getRevenueAnalyticsBySourceApi(params),
      getRevenueAnalyticsTopDealsApi(params),
    ])

    summary.value = summaryRes.data
    trendRows.value = trendRes.data.data || []
    saleRows.value = saleRes.data.data || []
    buildingRows.value = buildingRes.data.data || []
    sourceRows.value = sourceRes.data.data || []
    topDeals.value = topRes.data.data || []
  } catch (error) {
    alert(error?.response?.data?.message || 'Không tải được phân tích doanh thu.')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <MainLayout>
    <div class="space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900">Phân tích doanh thu</h1>
          <p class="mt-1 text-sm text-slate-500">
            Tất cả số liệu doanh thu đều tính theo ngày đặt cọc.
          </p>
        </div>

        <div class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <input
            v-model="filters.date_from"
            type="date"
            class="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none"
          />
          <input
            v-model="filters.date_to"
            type="date"
            class="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none"
          />
          <button
            class="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            @click="fetchData"
          >
            Lọc
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="text-xs uppercase tracking-wide text-slate-400">Tổng doanh thu</div>
          <div class="mt-2 text-3xl font-semibold text-emerald-700">
            {{ formatCompactMoney(summary.total_revenue) }}
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="text-xs uppercase tracking-wide text-slate-400">Số hợp đồng</div>
          <div class="mt-2 text-3xl font-semibold text-slate-900">
            {{ summary.total_deals }}
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="text-xs uppercase tracking-wide text-slate-400">Doanh thu trung bình</div>
          <div class="mt-2 text-3xl font-semibold text-indigo-700">
            {{ formatCompactMoney(summary.avg_revenue) }}
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="text-xs uppercase tracking-wide text-slate-400">Deal lớn nhất</div>
          <div class="mt-2 text-lg font-semibold text-slate-900">
            {{ summary.top_deal?.building_name || '-' }}
          </div>
          <div class="mt-1 text-sm text-slate-500">
            {{ summary.top_deal ? formatCompactMoney(summary.top_deal.revenue) : '-' }}
          </div>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Xu hướng doanh thu</h2>
              <p class="mt-1 text-xs text-slate-500">Theo ngày đặt cọc</p>
            </div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="router.push('/customer-deals')"
            >
              Mở danh sách chốt
            </button>
          </div>

          <div v-if="loading" class="mt-5 h-[280px] animate-pulse rounded-2xl bg-slate-100"></div>

          <div v-else-if="trendRows.length" class="mt-5">
            <svg viewBox="0 0 860 240" class="h-[280px] w-full">
              <polyline
                fill="none"
                stroke="#cbd5e1"
                stroke-width="2"
                :points="'24,216 836,216'"
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
                v-for="(item, index) in trendRows"
                :key="index"
                :cx="linePoints.split(' ')[index]?.split(',')[0]"
                :cy="linePoints.split(' ')[index]?.split(',')[1]"
                r="4"
                fill="#0f172a"
              />
            </svg>
          </div>

          <div v-else class="mt-5 rounded-2xl bg-slate-50 px-4 py-10 text-sm text-slate-500">
            Không có dữ liệu doanh thu.
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Top deal doanh thu</h2>
            <p class="mt-1 text-xs text-slate-500">10 deal cao nhất trong kỳ</p>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="mt-5 space-y-3">
            <button
              v-for="deal in topDeals"
              :key="deal.id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="router.push('/customer-deals')"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="font-medium text-slate-900">{{ deal.company_name }}</div>
                  <div class="mt-1 text-xs text-slate-400">
                    {{ deal.building_name }} • {{ deal.closer_name }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-semibold text-emerald-700">{{ formatCompactMoney(deal.revenue) }}</div>
                  <div class="mt-1 text-xs text-slate-400">{{ formatDate(deal.deposit_date) }}</div>
                </div>
              </div>
            </button>

            <div v-if="!topDeals.length" class="rounded-2xl bg-slate-50 px-4 py-10 text-sm text-slate-500">
              Không có dữ liệu.
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-base font-semibold text-slate-900">Doanh thu theo sale</h2>
          <div class="mt-5 space-y-3">
            <button
              v-for="item in saleRows"
              :key="item.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="router.push('/customer-deals')"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ item.user_name }}</span>
                <span class="text-slate-500">{{ formatCompactMoney(item.revenue) }}</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-emerald-600"
                  :style="{ width: barWidth(item.revenue, saleMax) }"
                ></div>
              </div>
              <div class="mt-2 text-xs text-slate-400">{{ item.total_deals }} hợp đồng</div>
            </button>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-base font-semibold text-slate-900">Doanh thu theo tòa nhà</h2>
          <div class="mt-5 space-y-3">
            <div
              v-for="item in buildingRows"
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

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-base font-semibold text-slate-900">Doanh thu theo nguồn</h2>
          <div class="mt-5 space-y-3">
            <div
              v-for="item in sourceRows"
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
      </div>
    </div>
  </MainLayout>
</template>