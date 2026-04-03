<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import {
  getCustomerSummaryReportApi,
  getCustomerByStatusApi,
  getCustomerBySaleApi,
} from '../../api/reports'
import { getUsersApi } from '../../api/users'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const saleOptions = ref([])

const summary = ref({
  today_customers: 0,
  month_customers: 0,
  year_customers: 0,
  total_customers: 0,
})

const statusRows = ref([])
const saleRows = ref([])

const filters = reactive({
  sale_id: '',
  date_from: '',
  date_to: '',
})

const isPrivileged = ['admin', 'leader'].includes(auth.user?.role)

const saleMax = () => {
  return Math.max(...saleRows.value.map((item) => Number(item.total_customers || 0)), 0)
}

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
      sale_id: filters.sale_id || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      ...extra,
    },
  })
}

const fetchSaleOptions = async () => {
  if (!isPrivileged) return
  try {
    const { data } = await getUsersApi({ per_page: 200 })
    saleOptions.value = data.data || data || []
  } catch (error) {
    saleOptions.value = []
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      sale_id: isPrivileged ? (filters.sale_id || undefined) : undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    }

    const [summaryRes, statusRes, saleRes] = await Promise.all([
      getCustomerSummaryReportApi(params),
      getCustomerByStatusApi(params),
      getCustomerBySaleApi(params),
    ])

    summary.value = summaryRes.data
    statusRows.value = statusRes.data.data || []
    saleRows.value = saleRes.data.data || []
  } catch (error) {
    alert(error?.response?.data?.message || 'Không tải được báo cáo khách hàng.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchSaleOptions()
  await fetchData()
})
</script>

<template>
  <MainLayout>
    <div class="space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
            <span class="h-2 w-2 rounded-full bg-slate-900"></span>
            Customer Report
          </div>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Báo cáo khách hàng</h1>
          <p class="mt-2 text-sm text-slate-500">
            {{ isPrivileged ? 'Xem số liệu khách hàng toàn hệ thống hoặc theo sale.' : 'Chỉ xem số liệu khách hàng của bạn.' }}
          </p>
        </div>

        <div
          class="grid gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"
          :class="isPrivileged ? 'sm:grid-cols-[1fr_1fr_1fr_auto]' : 'sm:grid-cols-[1fr_1fr_auto]'"
        >
          <select
            v-if="isPrivileged"
            v-model="filters.sale_id"
            class="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none"
          >
            <option value="">Tất cả sale</option>
            <option
              v-for="user in saleOptions"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name }}
            </option>
          </select>

          <input
            v-model="filters.date_from"
            type="date"
            class="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none"
          />
          <input
            v-model="filters.date_to"
            type="date"
            class="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none"
          />
          <button
            class="h-11 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800"
            @click="fetchData"
          >
            Lọc
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button
          class="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          @click="goCustomers()"
        >
          <div class="text-xs uppercase tracking-wide text-slate-400">Khách hôm nay</div>
          <div class="mt-2 text-3xl font-semibold text-slate-900">{{ summary.today_customers }}</div>
        </button>

        <button
          class="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          @click="goCustomers()"
        >
          <div class="text-xs uppercase tracking-wide text-slate-400">Khách tháng này</div>
          <div class="mt-2 text-3xl font-semibold text-slate-900">{{ summary.month_customers }}</div>
        </button>

        <button
          class="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          @click="goCustomers()"
        >
          <div class="text-xs uppercase tracking-wide text-slate-400">Khách năm nay</div>
          <div class="mt-2 text-3xl font-semibold text-slate-900">{{ summary.year_customers }}</div>
        </button>

        <button
          class="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          @click="goCustomers()"
        >
          <div class="text-xs uppercase tracking-wide text-slate-400">Tổng khách</div>
          <div class="mt-2 text-3xl font-semibold text-slate-900">{{ summary.total_customers }}</div>
        </button>
      </div>

      <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Khách hàng theo trạng thái</h2>
              <p class="mt-1 text-xs text-slate-500">
                {{ isPrivileged ? 'Có thể lọc theo sale.' : 'Số liệu của riêng bạn.' }}
              </p>
            </div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="goCustomers()"
            >
              Mở danh sách
            </button>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">Trạng thái</th>
                  <th class="px-4 py-3 font-medium">Số lượng</th>
                  <th class="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in statusRows"
                  :key="row.status"
                  class="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td class="px-4 py-3 font-medium text-slate-900">{{ row.status }}</td>
                  <td class="px-4 py-3">{{ row.total }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      class="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      @click="goCustomers({ status: row.status })"
                    >
                      Xem khách
                    </button>
                  </td>
                </tr>
                <tr v-if="!statusRows.length">
                  <td colspan="3" class="px-4 py-10 text-center text-sm text-slate-500">
                    Không có dữ liệu.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Khách hàng theo sale</h2>
              <p class="mt-1 text-xs text-slate-500">
                Hiển thị theo sale đang phụ trách hiện tại.
              </p>
            </div>
            <button
              class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="goCustomers()"
            >
              Mở danh sách
            </button>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else class="mt-5 space-y-3">
            <button
              v-for="row in saleRows"
              :key="row.user_id"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
              @click="goCustomers({ sale_id: row.user_id })"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-slate-900">{{ row.user_name }}</span>
                <span class="text-slate-500">{{ row.total_customers }} khách</span>
              </div>

              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-slate-900"
                  :style="{ width: barWidth(row.total_customers, saleMax()) }"
                ></div>
              </div>
            </button>

            <div v-if="!saleRows.length" class="rounded-2xl bg-slate-50 px-4 py-10 text-sm text-slate-500">
              Không có dữ liệu.
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>