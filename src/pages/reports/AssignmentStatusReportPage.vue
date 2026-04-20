<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MainLayout from '../../layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { getUsersApi } from '../../api/users'
import {
  getAssignmentStatusSummaryApi,
  getAssignmentStatusDetailApi,
} from '../../api/assignment-status-report'

const auth = useAuthStore()
const isPrivileged = computed(() => ['admin', 'leader'].includes(auth.user?.role))

const loading = ref(false)
const detailLoading = ref(false)
const saleOptions = ref([])

const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

const filters = reactive({
  sale_id: '',
  keyword: '',
  type: 'current_main',
  customer_group: '',
  per_page: 20,

  month: currentMonth, // ✅ thêm dòng này
})

const rows = ref([])
const totals = ref({
  self_found_total: 0,
  company_assigned_total: 0,
  current_main_total: 0,
  current_support_total: 0,
  transferred_out_total: 0,
  ever_assigned_total: 0,
})

const detailRows = ref({
  data: [],
  current_page: 1,
  last_page: 1,
  total: 0,
})

const page = ref(1)

const selectedTypeLabel = computed(() => {
  const map = {
    current_main: 'Khách đang đứng chính',
    current_support: 'Khách đang support',
    transferred_out: 'Khách đã bị điều chuyển',
    ever_assigned: 'Khách đã từng được phân',
  }
  return map[filters.type] || ''
})

const typeOptions = [
  { value: 'current_main', label: 'Đang đứng chính' },
  { value: 'current_support', label: 'Đang support' },
  { value: 'transferred_out', label: 'Đã bị điều chuyển' },
  { value: 'ever_assigned', label: 'Đã từng được phân' },
]

const summaryCards = computed(() => [
  {
    key: 'self_found_total',
    label: 'Khách tự tìm',
    value: totals.value.self_found_total,
    tone: 'from-violet-600 to-indigo-600',
    sub: 'Tổng khách tự khai thác',
  },
  {
    key: 'company_assigned_total',
    label: 'Khách công ty phân',
    value: totals.value.company_assigned_total,
    tone: 'from-sky-500 to-cyan-500',
    sub: 'Lead công ty / MKT giao xuống',
  },
  {
    key: 'current_main_total',
    label: 'Đang đứng chính',
    value: totals.value.current_main_total,
    tone: 'from-emerald-500 to-green-600',
    sub: 'Khách đang phụ trách chính',
  },
  {
    key: 'current_support_total',
    label: 'Đang support',
    value: totals.value.current_support_total,
    tone: 'from-amber-400 to-orange-500',
    sub: 'Khách đang phối hợp xử lý',
  },
  {
    key: 'transferred_out_total',
    label: 'Đã bị điều chuyển',
    value: totals.value.transferred_out_total,
    tone: 'from-rose-500 to-red-500',
    sub: 'Khách từng phụ trách nhưng đã chuyển',
  },
  {
    key: 'ever_assigned_total',
    label: 'Đã từng được phân',
    value: totals.value.ever_assigned_total,
    tone: 'from-slate-700 to-slate-900',
    sub: 'Tổng footprint phân khách',
  },
])

const maxValues = computed(() => ({
  self_found_total: Math.max(...rows.value.map(r => Number(r.self_found_total || 0)), 0),
  company_assigned_total: Math.max(...rows.value.map(r => Number(r.company_assigned_total || 0)), 0),
  current_main_total: Math.max(...rows.value.map(r => Number(r.current_main_total || 0)), 0),
  current_support_total: Math.max(...rows.value.map(r => Number(r.current_support_total || 0)), 0),
  transferred_out_total: Math.max(...rows.value.map(r => Number(r.transferred_out_total || 0)), 0),
  ever_assigned_total: Math.max(...rows.value.map(r => Number(r.ever_assigned_total || 0)), 0),
}))

const activeMetric = computed(() => {
  if (filters.type === 'current_main') return 'current_main_total'
  if (filters.type === 'current_support') return 'current_support_total'
  if (filters.type === 'transferred_out') return 'transferred_out_total'
  return 'ever_assigned_total'
})

const activeMetricLabel = computed(() => {
  const map = {
    current_main_total: 'Main',
    current_support_total: 'Support',
    transferred_out_total: 'Điều chuyển',
    ever_assigned_total: 'Ever assigned',
  }
  return map[activeMetric.value]
})

const toneClass = (key) => {
  const map = {
    self_found_total: 'bg-violet-500',
    company_assigned_total: 'bg-cyan-500',
    current_main_total: 'bg-green-500',
    current_support_total: 'bg-orange-500',
    transferred_out_total: 'bg-red-500',
    ever_assigned_total: 'bg-slate-700',
  }
  return map[key] || 'bg-slate-500'
}

const progressWidth = (value, max) => {
  const n = Number(value || 0)
  const m = Number(max || 0)
  if (!m || !n) return '0%'
  return `${Math.max(6, (n / m) * 100)}%`
}

const activeRowCount = computed(() =>
  rows.value.reduce((sum, row) => sum + Number(row[activeMetric.value] || 0), 0)
)

const fetchSales = async () => {
  if (!isPrivileged.value) return
  try {
    const { data } = await getUsersApi({ per_page: 200 })
    saleOptions.value = data.data || data || []
  } catch {
    saleOptions.value = []
  }
}

const fetchSummary = async () => {
  loading.value = true
  try {
    const { data } = await getAssignmentStatusSummaryApi({
      sale_id: isPrivileged.value ? (filters.sale_id || undefined) : undefined, month: filters.month,
    })
    rows.value = data.data || []
    totals.value = data.totals || totals.value
  } finally {
    loading.value = false
  }
}

const fetchDetail = async () => {
  detailLoading.value = true
  try {
    const { data } = await getAssignmentStatusDetailApi({
      sale_id: isPrivileged.value ? (filters.sale_id || undefined) : undefined,
      keyword: filters.keyword || undefined,
      type: filters.type,
      customer_group: filters.customer_group || undefined,
      page: page.value,
      per_page: filters.per_page,
      month: filters.month,
    })
    detailRows.value = data
  } finally {
    detailLoading.value = false
  }
}

const applyFilters = async () => {
  page.value = 1
  await Promise.all([fetchSummary(), fetchDetail()])
}

const exportCsv = () => {
  const headers = [
    'Sale',
    'Khach tu tim',
    'Khach cong ty phan',
    'Dang dung chinh',
    'Dang support',
    'Da bi dieu chuyen',
    'Da tung duoc phan',
  ]
  const body = rows.value.map(row => [
    row.user_name || '',
    row.self_found_total || 0,
    row.company_assigned_total || 0,
    row.current_main_total || 0,
    row.current_support_total || 0,
    row.transferred_out_total || 0,
    row.ever_assigned_total || 0,
  ])

  const csv = [headers, ...body]
    .map(line => line.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'assignment-status-report.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  await fetchSales()
  await applyFilters()
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
              Assignment Intelligence
            </div>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Tình trạng phân khách</h1>
            <p class="mt-2 text-sm text-slate-500">
              Theo dõi footprint phân khách theo từng sale: khách tự tìm, khách công ty, khách đang main, đang support và khách đã bị điều chuyển.
            </p>
          </div>

          <div
            class="grid gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-3"
            :class="isPrivileged ? 'sm:grid-cols-[1fr_1fr_1fr_auto]' : 'sm:grid-cols-[1fr_1fr_auto]'"
          >
          <input
                type="month"
                v-model="filters.month"
                class="h-11 rounded-xl border px-3 text-sm"
                />
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

            <select
              v-model="filters.type"
              class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
            >
              <option v-for="item in typeOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>

            <select
              v-model="filters.customer_group"
              class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
            >
              <option value="">Tất cả nhóm khách</option>
              <option value="self_found">Khách tự tìm</option>
              <option value="company_lead">Khách công ty / MKT</option>
            </select>

            <div class="flex gap-2">
              <button
                class="h-11 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
                @click="applyFilters"
              >
                Apply
              </button>
              <button
                class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                @click="exportCsv"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <button
          v-for="card in summaryCards"
          :key="card.key"
          class="rounded-[22px] bg-gradient-to-r p-5 text-left text-white shadow-sm"
          :class="card.tone"
        >
          <div class="text-xs uppercase tracking-wide text-white/80">{{ card.label }}</div>
          <div class="mt-3 text-4xl font-semibold">{{ card.value }}</div>
          <div class="mt-3 text-xs text-white/85">{{ card.sub }}</div>
        </button>
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-slate-900">Bảng tổng hợp theo sale</h2>
              <p class="mt-1 text-sm text-slate-500">
                Highlight theo chỉ số hiện tại: <span class="font-medium text-slate-700">{{ activeMetricLabel }}</span>
              </p>
            </div>
          </div>

          <div v-if="loading" class="space-y-3">
            <div v-for="i in 6" :key="i" class="h-24 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="row in rows"
              :key="row.user_id"
              class="rounded-2xl border border-slate-200 px-4 py-4"
            >
              <div class="flex items-center justify-between gap-4">
                <div>
                  <div class="text-base font-semibold text-slate-900">{{ row.user_name }}</div>
                  <div class="mt-1 text-xs text-slate-500">
                    Ever assigned: {{ row.ever_assigned_total }} • Điều chuyển: {{ row.transferred_out_total }}
                  </div>
                </div>

                <div class="min-w-[110px] text-right">
                  <div class="text-xs text-slate-400">{{ activeMetricLabel }}</div>
                  <div class="text-2xl font-semibold text-slate-900">{{ row[activeMetric] || 0 }}</div>
                </div>
              </div>

              <div class="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full"
                  :class="toneClass(activeMetric)"
                  :style="{ width: progressWidth(row[activeMetric], maxValues[activeMetric]) }"
                ></div>
              </div>

              <div class="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
                <div class="rounded-xl bg-slate-50 px-3 py-2">
                  <div class="text-[11px] text-slate-400">Tự tìm</div>
                  <div class="mt-1 font-semibold text-slate-900">{{ row.self_found_total }}</div>
                </div>
                <div class="rounded-xl bg-slate-50 px-3 py-2">
                  <div class="text-[11px] text-slate-400">Công ty phân</div>
                  <div class="mt-1 font-semibold text-slate-900">{{ row.company_assigned_total }}</div>
                </div>
                <div class="rounded-xl bg-emerald-50 px-3 py-2">
                  <div class="text-[11px] text-emerald-600">Main</div>
                  <div class="mt-1 font-semibold text-emerald-700">{{ row.current_main_total }}</div>
                </div>
                <div class="rounded-xl bg-amber-50 px-3 py-2">
                  <div class="text-[11px] text-amber-600">Support</div>
                  <div class="mt-1 font-semibold text-amber-700">{{ row.current_support_total }}</div>
                </div>
                <div class="rounded-xl bg-rose-50 px-3 py-2">
                  <div class="text-[11px] text-rose-600">Điều chuyển</div>
                  <div class="mt-1 font-semibold text-rose-700">{{ row.transferred_out_total }}</div>
                </div>
                <div class="rounded-xl bg-violet-50 px-3 py-2">
                  <div class="text-[11px] text-violet-600">Ever assigned</div>
                  <div class="mt-1 font-semibold text-violet-700">{{ row.ever_assigned_total }}</div>
                </div>
              </div>
            </div>

            <div v-if="!rows.length" class="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Không có dữ liệu.
            </div>
          </div>
        </div>

        <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-slate-900">Overview</h2>
            <p class="mt-1 text-sm text-slate-500">Tổng hợp nhanh theo chỉ số đang xem.</p>
          </div>

          <div class="grid gap-3">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div class="text-sm text-slate-500">Tổng record theo chỉ số hiện tại</div>
              <div class="mt-2 text-3xl font-semibold text-slate-900">{{ activeRowCount }}</div>
            </div>

            <div class="rounded-2xl border border-slate-200 px-4 py-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Khách tự tìm</span>
                <span class="font-semibold text-slate-900">{{ totals.self_found_total }}</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-violet-500"
                  :style="{ width: progressWidth(totals.self_found_total, Math.max(totals.self_found_total, totals.company_assigned_total)) }"
                ></div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 px-4 py-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Khách công ty phân</span>
                <span class="font-semibold text-slate-900">{{ totals.company_assigned_total }}</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-cyan-500"
                  :style="{ width: progressWidth(totals.company_assigned_total, Math.max(totals.self_found_total, totals.company_assigned_total)) }"
                ></div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl border border-slate-200 bg-emerald-50 px-4 py-4">
                <div class="text-xs text-emerald-600">Main</div>
                <div class="mt-1 text-2xl font-semibold text-emerald-700">{{ totals.current_main_total }}</div>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-amber-50 px-4 py-4">
                <div class="text-xs text-amber-600">Support</div>
                <div class="mt-1 text-2xl font-semibold text-amber-700">{{ totals.current_support_total }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl border border-slate-200 bg-rose-50 px-4 py-4">
                <div class="text-xs text-rose-600">Điều chuyển</div>
                <div class="mt-1 text-2xl font-semibold text-rose-700">{{ totals.transferred_out_total }}</div>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div class="text-xs text-slate-500">Ever assigned</div>
                <div class="mt-1 text-2xl font-semibold text-slate-900">{{ totals.ever_assigned_total }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Chi tiết: {{ selectedTypeLabel }}</h2>
            <p class="mt-1 text-sm text-slate-500">Danh sách khách chi tiết theo bộ lọc hiện tại.</p>
          </div>

          <div class="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              v-model="filters.keyword"
              type="text"
              placeholder="Tìm công ty, liên hệ, điện thoại"
              class="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none"
            />
            <button
              class="h-11 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
              @click="applyFilters"
            >
              Tìm
            </button>
          </div>
        </div>

        <div class="overflow-hidden rounded-2xl border border-slate-200">
          <table class="min-w-full text-sm">
            <thead class="sticky top-0 bg-slate-50 text-left text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">Company</th>
                <th class="px-4 py-3 font-medium">Contact</th>
                <th class="px-4 py-3 font-medium">Phone</th>
                <th class="px-4 py-3 font-medium">Lead Source</th>
                <th class="px-4 py-3 font-medium">Vai trò</th>
                <th class="px-4 py-3 font-medium">Trạng thái</th>
                <th class="px-4 py-3 font-medium">Assigned At</th>
                <th class="px-4 py-3 font-medium">Ended At</th>
              </tr>
            </thead>

            <tbody v-if="detailLoading">
              <tr v-for="i in 8" :key="i" class="border-t border-slate-100">
                <td class="px-4 py-4" colspan="8">
                  <div class="h-4 w-full animate-pulse rounded bg-slate-200"></div>
                </td>
              </tr>
            </tbody>

            <tbody v-else>
              <tr
                v-for="row in detailRows.data"
                :key="row.id"
                class="border-t border-slate-100 hover:bg-slate-50"
              >
                <td class="px-4 py-3 font-medium text-slate-900">{{ row.company_name || '-' }}</td>
                <td class="px-4 py-3">{{ row.contact_name || '-' }}</td>
                <td class="px-4 py-3">{{ row.phone || '-' }}</td>
                <td class="px-4 py-3">{{ row.lead_source_code || '-' }}</td>
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="Number(row.is_primary) === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ Number(row.is_primary) === 1 ? 'Main' : 'Support' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="Number(row.is_active) === 1 ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'"
                  >
                    {{ Number(row.is_active) === 1 ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-4 py-3">{{ row.assigned_at || '-' }}</td>
                <td class="px-4 py-3">{{ row.ended_at || '-' }}</td>
              </tr>

              <tr v-if="!detailRows.data?.length">
                <td colspan="8" class="px-4 py-10 text-center text-slate-500">
                  Không có dữ liệu.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <div class="text-sm text-slate-500">Total: {{ detailRows.total || 0 }}</div>

          <div class="flex items-center gap-2">
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              :disabled="detailRows.current_page <= 1"
              @click="page--; fetchDetail()"
            >
              Prev
            </button>
            <div class="text-sm text-slate-500">
              {{ detailRows.current_page || 1 }} / {{ detailRows.last_page || 1 }}
            </div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              :disabled="detailRows.current_page >= detailRows.last_page"
              @click="page++; fetchDetail()"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  </MainLayout>
</template>