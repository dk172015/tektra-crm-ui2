<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MainLayout from '../../layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { getUsersApi } from '../../api/users'
import { getPerformanceScoreApi } from '../../api/performance-score'

const auth = useAuthStore()
const isPrivileged = computed(() => ['admin', 'leader'].includes(auth.user?.role))

const loading = ref(false)
const rows = ref([])
const saleOptions = ref([])

const currentMonth = new Date().toISOString().slice(0, 7)

const filters = reactive({
  month: currentMonth,
  sale_id: '',
  w_self_found: 3,
  w_company_assigned: 1,
  w_main: 4,
  w_support: 1,
  w_deal: 8,
  w_revenue: 0.000001,
  w_sales_volume: 0.0000005,
  w_transferred_out_penalty: 1,
})

const weights = ref({})

const topThree = computed(() => rows.value.slice(0, 3))
const others = computed(() => rows.value.slice(3))
const scoreMax = computed(() => Math.max(...rows.value.map(r => Number(r.total_score || 0)), 0))

const scoreWidth = (value) => {
  const max = Number(scoreMax.value || 0)
  const n = Number(value || 0)
  if (!max || !n) return '0%'
  return `${Math.max(8, (n / max) * 100)}%`
}

const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0))

const fetchSales = async () => {
  if (!isPrivileged.value) return
  try {
    const { data } = await getUsersApi({ per_page: 200 })
    saleOptions.value = data.data || data || []
  } catch {
    saleOptions.value = []
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const { data } = await getPerformanceScoreApi({
      month: filters.month,
      sale_id: isPrivileged.value ? (filters.sale_id || undefined) : undefined,
      w_self_found: filters.w_self_found,
      w_company_assigned: filters.w_company_assigned,
      w_main: filters.w_main,
      w_support: filters.w_support,
      w_deal: filters.w_deal,
      w_revenue: filters.w_revenue,
      w_sales_volume: filters.w_sales_volume,
      w_transferred_out_penalty: filters.w_transferred_out_penalty,
    })
    rows.value = data.data || []
    weights.value = data.weights || {}
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchSales()
  await fetchData()
})
</script>

<template>
  <MainLayout>
    <div class="space-y-5">
      <section class="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div class="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              <span class="h-2 w-2 rounded-full bg-violet-500"></span>
              Performance Scoring System
            </div>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Chấm điểm hiệu suất sale</h1>
            <p class="mt-2 text-sm text-slate-500">
              Xếp hạng sale theo khách tự tìm, khách công ty, main, support, deal, doanh thu, doanh số và khách bị điều chuyển.
            </p>
          </div>

          <div
            class="grid gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-3"
            :class="isPrivileged ? 'sm:grid-cols-[1fr_1fr_auto]' : 'sm:grid-cols-[1fr_auto]'"
          >
            <input
              v-model="filters.month"
              type="month"
              class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
            />

            <select
              v-if="isPrivileged"
              v-model="filters.sale_id"
              class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
            >
              <option value="">Tất cả sale</option>
              <option v-for="u in saleOptions" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>

            <button
              class="h-11 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
              @click="fetchData"
            >
              Apply
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-slate-900">Trọng số chấm điểm</h2>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label class="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div class="mb-2 text-slate-500">Khách tự tìm</div>
            <input v-model="filters.w_self_found" type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none" />
          </label>

          <label class="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div class="mb-2 text-slate-500">Khách công ty</div>
            <input v-model="filters.w_company_assigned" type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none" />
          </label>

          <label class="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div class="mb-2 text-slate-500">Main</div>
            <input v-model="filters.w_main" type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none" />
          </label>

          <label class="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div class="mb-2 text-slate-500">Support</div>
            <input v-model="filters.w_support" type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none" />
          </label>

          <label class="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div class="mb-2 text-slate-500">Deal</div>
            <input v-model="filters.w_deal" type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none" />
          </label>

          <label class="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div class="mb-2 text-slate-500">Doanh thu</div>
            <input v-model="filters.w_revenue" type="number" step="0.0000001" class="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none" />
          </label>

          <label class="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div class="mb-2 text-slate-500">Doanh số</div>
            <input v-model="filters.w_sales_volume" type="number" step="0.0000001" class="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none" />
          </label>

          <label class="rounded-2xl border border-slate-200 bg-rose-50 p-3 text-sm">
            <div class="mb-2 text-rose-600">Phạt điều chuyển</div>
            <input v-model="filters.w_transferred_out_penalty" type="number" step="0.01" class="w-full rounded-xl border border-rose-300 px-3 py-2 outline-none" />
          </label>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-3">
        <div
          v-for="row in topThree"
          :key="row.user_id"
          class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              #{{ row.rank }}
            </span>
            <span class="text-sm text-slate-400">Top Performer</span>
          </div>

          <div class="mt-4 text-xl font-semibold text-slate-900">{{ row.user_name }}</div>
          <div class="mt-2 text-3xl font-semibold text-violet-600">{{ row.total_score }}</div>

          <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div class="rounded-xl bg-slate-50 px-3 py-2">
              <div class="text-slate-400">Deals</div>
              <div class="mt-1 font-semibold text-slate-900">{{ row.deal_total }}</div>
            </div>
            <div class="rounded-xl bg-slate-50 px-3 py-2">
              <div class="text-slate-400">Main</div>
              <div class="mt-1 font-semibold text-slate-900">{{ row.main_total }}</div>
            </div>
            <div class="rounded-xl bg-slate-50 px-3 py-2">
              <div class="text-slate-400">Revenue</div>
              <div class="mt-1 font-semibold text-slate-900">{{ formatMoney(row.revenue_total) }}</div>
            </div>
            <div class="rounded-xl bg-slate-50 px-3 py-2">
              <div class="text-slate-400">Sales Volume</div>
              <div class="mt-1 font-semibold text-slate-900">{{ formatMoney(row.sales_volume_total) }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-slate-900">Bảng xếp hạng chi tiết</h2>
        </div>

        <div v-if="loading" class="space-y-3">
          <div v-for="i in 8" :key="i" class="h-20 animate-pulse rounded-2xl bg-slate-100"></div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="row in rows"
            :key="row.user_id"
            class="rounded-2xl border border-slate-200 px-4 py-4"
          >
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    #{{ row.rank }}
                  </span>
                  <span class="text-base font-semibold text-slate-900">{{ row.user_name }}</span>
                </div>
                <div class="mt-1 text-xs text-slate-500">
                  Self: {{ row.self_found_total }} • Company: {{ row.company_assigned_total }} • Main: {{ row.main_total }} • Support: {{ row.support_total }}
                </div>
              </div>

              <div class="min-w-[120px] text-right">
                <div class="text-xs text-slate-400">Total Score</div>
                <div class="text-2xl font-semibold text-violet-600">{{ row.total_score }}</div>
              </div>
            </div>

            <div class="mt-3 h-2 rounded-full bg-slate-100">
              <div
                class="h-full rounded-full bg-violet-500"
                :style="{ width: scoreWidth(row.total_score) }"
              ></div>
            </div>

            <div class="mt-4 grid gap-2 md:grid-cols-4 xl:grid-cols-8 text-sm">
              <div class="rounded-xl bg-slate-50 px-3 py-2">
                <div class="text-slate-400">Self</div>
                <div class="mt-1 font-semibold text-slate-900">{{ row.score_breakdown.self_found }}</div>
              </div>
              <div class="rounded-xl bg-slate-50 px-3 py-2">
                <div class="text-slate-400">Company</div>
                <div class="mt-1 font-semibold text-slate-900">{{ row.score_breakdown.company_assigned }}</div>
              </div>
              <div class="rounded-xl bg-emerald-50 px-3 py-2">
                <div class="text-emerald-600">Main</div>
                <div class="mt-1 font-semibold text-emerald-700">{{ row.score_breakdown.main }}</div>
              </div>
              <div class="rounded-xl bg-amber-50 px-3 py-2">
                <div class="text-amber-600">Support</div>
                <div class="mt-1 font-semibold text-amber-700">{{ row.score_breakdown.support }}</div>
              </div>
              <div class="rounded-xl bg-sky-50 px-3 py-2">
                <div class="text-sky-600">Deal</div>
                <div class="mt-1 font-semibold text-sky-700">{{ row.score_breakdown.deal }}</div>
              </div>
              <div class="rounded-xl bg-indigo-50 px-3 py-2">
                <div class="text-indigo-600">Revenue</div>
                <div class="mt-1 font-semibold text-indigo-700">{{ row.score_breakdown.revenue }}</div>
              </div>
              <div class="rounded-xl bg-cyan-50 px-3 py-2">
                <div class="text-cyan-600">Sales Vol</div>
                <div class="mt-1 font-semibold text-cyan-700">{{ row.score_breakdown.sales_volume }}</div>
              </div>
              <div class="rounded-xl bg-rose-50 px-3 py-2">
                <div class="text-rose-600">Penalty</div>
                <div class="mt-1 font-semibold text-rose-700">-{{ row.score_breakdown.transferred_out_penalty }}</div>
              </div>
            </div>
          </div>

          <div v-if="!rows.length" class="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Không có dữ liệu.
          </div>
        </div>
      </section>
    </div>
  </MainLayout>
</template>