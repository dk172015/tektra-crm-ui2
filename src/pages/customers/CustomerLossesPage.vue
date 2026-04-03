<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MainLayout from '../../layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import {
  getCustomerLossesListApi,
  getCustomerLossDetailByLossIdApi,
  createNewCustomerFromLossApi,
} from '../../api/customers'

const auth = useAuthStore()

const loading = ref(false)
const detailLoading = ref(false)
const actionLoadingId = ref(null)

const rows = ref([])
const selected = ref(null)

const meta = ref({
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
})

const filters = reactive({
  keyword: '',
  date_from: '',
  date_to: '',
  recreated: '',
  per_page: 20,
  page: 1,
})

const safeText = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return value
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const number = Number(value)
  if (Number.isNaN(number)) return value
  return new Intl.NumberFormat('vi-VN').format(number)
}

const selectedLossReason = computed(() => safeText(selected.value?.reason))
const selectedCompetitor = computed(() => safeText(selected.value?.competitor_name))

const fetchRows = async () => {
  loading.value = true
  try {
    const { data } = await getCustomerLossesListApi({
      keyword: filters.keyword || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      recreated: filters.recreated || undefined,
      per_page: filters.per_page,
      page: filters.page,
    })

    rows.value = data.data || []
    meta.value = {
      current_page: data.current_page || 1,
      last_page: data.last_page || 1,
      per_page: data.per_page || filters.per_page,
      total: data.total || 0,
    }

    if (selected.value) {
      const existed = rows.value.find((item) => item.id === selected.value.id)
      if (!existed) selected.value = null
    }
  } catch (error) {
    rows.value = []
    meta.value = {
      current_page: 1,
      last_page: 1,
      per_page: filters.per_page,
      total: 0,
    }
    alert(error?.response?.data?.message || 'Không tải được danh sách khách đã mất.')
  } finally {
    loading.value = false
  }
}

const openDetail = async (row) => {
  detailLoading.value = true
  try {
    const { data } = await getCustomerLossDetailByLossIdApi(row.id)
    selected.value = data.data || null
  } catch (error) {
    selected.value = null
    alert(error?.response?.data?.message || 'Không tải được chi tiết mất khách.')
  } finally {
    detailLoading.value = false
  }
}

const applyFilters = async () => {
  filters.page = 1
  await fetchRows()
}

const resetFilters = async () => {
  filters.keyword = ''
  filters.date_from = ''
  filters.date_to = ''
  filters.recreated = ''
  filters.per_page = 20
  filters.page = 1
  selected.value = null
  await fetchRows()
}

const changePage = async (page) => {
  if (page < 1 || page > meta.value.last_page || page === meta.value.current_page) return
  filters.page = page
  await fetchRows()
}

const handlePerPageChange = async () => {
  filters.page = 1
  await fetchRows()
}

const handleCreateNewCustomer = async (row) => {
  if (!auth.isAdmin) return
  const confirmed = window.confirm('Tạo khách hàng mới từ bản ghi mất khách này?')
  if (!confirmed) return

  actionLoadingId.value = row.id
  try {
    await createNewCustomerFromLossApi(row.id)
    await fetchRows()

    if (selected.value?.id === row.id) {
      await openDetail(row)
    }

    alert('Đã tạo khách hàng mới thành công.')
  } catch (error) {
    alert(error?.response?.data?.message || 'Không thể tạo khách hàng mới.')
  } finally {
    actionLoadingId.value = null
  }
}

const exportCsv = () => {
  const headers = [
    'Công ty',
    'Liên hệ',
    'Điện thoại',
    'Email',
    'Lý do mất',
    'Đối thủ',
    'Giá bên khác',
    'Người xử lý',
    'Ngày mất',
    'Đã tạo khách mới',
  ]

  const dataRows = rows.value.map((row) => [
    safeText(row.customer?.company_name),
    safeText(row.customer?.contact_name),
    safeText(row.customer?.phone),
    safeText(row.customer?.email),
    safeText(row.reason),
    safeText(row.competitor_name),
    safeText(row.lost_price),
    safeText(row.creator?.name),
    formatDateTime(row.lost_at),
    row.recreated_customer_id ? 'Rồi' : 'Chưa',
  ])

  const csv = [headers, ...dataRows]
    .map((line) =>
      line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.setAttribute('download', `khach-da-mat-${date}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const exportPdf = () => {
  const htmlRows = rows.value
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${safeText(row.customer?.company_name)}</td>
          <td>${safeText(row.customer?.contact_name)}</td>
          <td>${safeText(row.reason)}</td>
          <td>${safeText(row.competitor_name)}</td>
          <td>${safeText(row.creator?.name)}</td>
          <td>${safeText(row.lost_price)}</td>
          <td>${formatDate(row.lost_at)}</td>
          <td>${row.recreated_customer_id ? 'Rồi' : 'Chưa'}</td>
        </tr>
      `
    )
    .join('')

  const printWindow = window.open('', '_blank', 'width=1200,height=800')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>Khách đã mất</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          p { margin: 0 0 16px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; text-align: left; }
          th { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>Báo cáo khách đã mất</h1>
        <p>Tổng bản ghi: ${meta.value.total}</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Công ty</th>
              <th>Liên hệ</th>
              <th>Lý do mất</th>
              <th>Đối thủ</th>
              <th>Người xử lý</th>
              <th>Giá bên khác</th>
              <th>Ngày mất</th>
              <th>Đã tạo khách mới</th>
            </tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 300)
}

onMounted(fetchRows)
</script>

<template>
  <MainLayout>
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900">Khách đã mất</h1>
          <p class="mt-1 text-sm text-slate-500">
            Danh sách khách hàng đã mất. Chọn dòng để xem nguyên nhân và chi tiết xử lý.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <div class="rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <div class="text-[11px] uppercase tracking-wide text-slate-400">Tổng bản ghi</div>
            <div class="mt-0.5 text-xl font-semibold text-slate-900">{{ meta.total }}</div>
          </div>

          <button
            class="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="exportCsv"
          >
            Xuất Excel
          </button>

          <button
            class="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="exportPdf"
          >
            Xuất PDF
          </button>
        </div>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="grid gap-2 xl:grid-cols-[2.4fr_1fr_1fr_1.2fr_0.9fr_auto_auto]">
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="Tìm công ty, liên hệ, lý do, đối thủ..."
            class="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
            @keyup.enter="applyFilters"
          />

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

          <select
            v-model="filters.recreated"
            class="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="0">Chưa tạo khách mới</option>
            <option value="1">Đã tạo khách mới</option>
          </select>

          <select
            v-model="filters.per_page"
            class="h-11 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-500"
            @change="handlePerPageChange"
          >
            <option :value="10">10 / trang</option>
            <option :value="20">20 / trang</option>
            <option :value="50">50 / trang</option>
            <option :value="100">100 / trang</option>
          </select>

          <button
            class="h-11 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            @click="applyFilters"
          >
            Lọc
          </button>

          <button
            class="h-11 rounded-2xl border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            @click="resetFilters"
          >
            Reset
          </button>
        </div>
      </div>

      <div class="grid gap-4 2xl:grid-cols-[1.7fr_1fr]">
        <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Danh sách khách đã mất</h2>
              <p class="mt-1 text-xs text-slate-500">
                {{ auth.isAdmin ? 'Admin xem toàn bộ dữ liệu.' : 'Bạn chỉ xem dữ liệu của mình.' }}
              </p>
            </div>
            <div class="text-xs text-slate-500">
              Trang {{ meta.current_page }} / {{ meta.last_page }}
            </div>
          </div>

          <div class="max-h-[70vh] overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="sticky top-0 z-10 bg-slate-50 text-left text-slate-500 shadow-sm">
                <tr>
                  <th class="px-5 py-3 font-medium">Công ty</th>
                  <th class="px-5 py-3 font-medium">Liên hệ</th>
                  <th class="px-5 py-3 font-medium">Lý do</th>
                  <th class="px-5 py-3 font-medium">Đối thủ</th>
                  <th class="px-5 py-3 font-medium">Giá khác</th>
                  <th class="px-5 py-3 font-medium">Người xử lý</th>
                  <th class="px-5 py-3 font-medium">Ngày mất</th>
                  <th class="px-5 py-3 font-medium text-center">Trạng thái</th>
                  <th class="px-5 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>

              <tbody v-if="loading">
                <tr v-for="i in 8" :key="i" class="border-t border-slate-100">
                  <td class="px-5 py-4"><div class="h-4 w-36 animate-pulse rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-4 w-24 animate-pulse rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-4 w-24 animate-pulse rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-4 w-24 animate-pulse rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-4 w-20 animate-pulse rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-4 w-24 animate-pulse rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="h-4 w-28 animate-pulse rounded bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="mx-auto h-7 w-24 animate-pulse rounded-full bg-slate-200"></div></td>
                  <td class="px-5 py-4"><div class="mx-auto h-8 w-28 animate-pulse rounded-2xl bg-slate-200"></div></td>
                </tr>
              </tbody>

              <tbody v-else-if="rows.length">
                <tr
                  v-for="row in rows"
                  :key="row.id"
                  class="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50"
                  :class="selected?.id === row.id ? 'bg-slate-50' : ''"
                  @click="openDetail(row)"
                >
                  <td class="px-5 py-4">
                    <div class="font-medium text-slate-900">
                      {{ safeText(row.customer?.company_name) }}
                    </div>
                    <div class="mt-1 text-xs text-slate-400">
                      {{ safeText(row.customer?.email) }}
                    </div>
                  </td>

                  <td class="px-5 py-4">
                    <div class="text-slate-800">{{ safeText(row.customer?.contact_name) }}</div>
                    <div class="mt-1 text-xs text-slate-400">{{ safeText(row.customer?.phone) }}</div>
                  </td>

                  <td class="px-5 py-4">
                    <span class="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                      {{ safeText(row.reason) }}
                    </span>
                  </td>

                  <td class="px-5 py-4 text-slate-700">
                    {{ safeText(row.competitor_name) }}
                  </td>

                  <td class="px-5 py-4 font-semibold text-slate-900">
                    {{ formatMoney(row.lost_price) }}
                  </td>

                  <td class="px-5 py-4 text-slate-700">
                    {{ safeText(row.creator?.name) }}
                  </td>

                  <td class="px-5 py-4 text-slate-700">
                    {{ formatDate(row.lost_at) }}
                  </td>

                  <td class="px-5 py-4 text-center">
                    <span
                      v-if="row.recreated_customer_id"
                      class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                    >
                      Đã tạo mới
                    </span>
                    <span
                      v-else
                      class="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                    >
                      Chưa tạo
                    </span>
                  </td>

                  <td class="px-5 py-4 text-center" @click.stop>
                    <button
                      v-if="auth.isAdmin"
                      class="rounded-2xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="!!row.recreated_customer_id || actionLoadingId === row.id"
                      @click="handleCreateNewCustomer(row)"
                    >
                      {{
                        row.recreated_customer_id
                          ? 'Đã tạo khách mới'
                          : actionLoadingId === row.id
                            ? 'Đang xử lý...'
                            : 'Tạo khách mới'
                      }}
                    </button>

                    <span
                      v-else
                      class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-400"
                    >
                      Chỉ xem
                    </span>
                  </td>
                </tr>
              </tbody>

              <tbody v-else>
                <tr>
                  <td colspan="9" class="px-5 py-16 text-center text-sm text-slate-500">
                    Không có dữ liệu phù hợp.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <div class="text-sm text-slate-500">Tổng {{ meta.total }} bản ghi</div>

            <div class="flex items-center gap-2">
              <button
                class="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="meta.current_page <= 1"
                @click="changePage(meta.current_page - 1)"
              >
                Trước
              </button>
              <button
                class="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="meta.current_page >= meta.last_page"
                @click="changePage(meta.current_page + 1)"
              >
                Sau
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-200 px-5 py-4">
            <h2 class="text-base font-semibold text-slate-900">Thông tin mất khách</h2>
            <p class="mt-1 text-xs text-slate-500">
              Những trường quan trọng được nhóm lại để xem nhanh.
            </p>
          </div>

          <div v-if="detailLoading" class="space-y-4 px-5 py-5">
            <div class="h-24 animate-pulse rounded-2xl bg-slate-100"></div>
            <div class="h-28 animate-pulse rounded-2xl bg-slate-100"></div>
            <div class="h-24 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div v-else-if="selected" class="space-y-4 px-5 py-5">
            <div class="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-xs uppercase tracking-wide text-slate-400">Khách hàng</div>
                  <div class="mt-2 text-lg font-semibold text-slate-900">
                    {{ safeText(selected.customer?.company_name) }}
                  </div>
                </div>
                <span class="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  {{ safeText(selected.creator?.name) }}
                </span>
              </div>

              <div class="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div><span class="font-medium text-slate-900">Người liên hệ:</span> {{ safeText(selected.customer?.contact_name) }}</div>
                <div><span class="font-medium text-slate-900">Điện thoại:</span> {{ safeText(selected.customer?.phone) }}</div>
                <div class="md:col-span-2"><span class="font-medium text-slate-900">Email:</span> {{ safeText(selected.customer?.email) }}</div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 p-4">
              <div class="text-xs uppercase tracking-wide text-slate-400">Lý do mất khách</div>
              <div class="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div class="rounded-2xl bg-rose-50 p-3">
                  <div class="text-xs text-rose-600">Lý do mất</div>
                  <div class="mt-1 text-base font-semibold text-rose-700">
                    {{ selectedLossReason }}
                  </div>
                </div>
                <div class="rounded-2xl bg-amber-50 p-3">
                  <div class="text-xs text-amber-600">Đối thủ</div>
                  <div class="mt-1 text-base font-semibold text-amber-700">
                    {{ selectedCompetitor }}
                  </div>
                </div>
                <div><span class="font-medium text-slate-900">Giá bên khác:</span> {{ formatMoney(selected.lost_price) }}</div>
                <div><span class="font-medium text-slate-900">Ngày mất:</span> {{ formatDate(selected.lost_at) }}</div>
                <div><span class="font-medium text-slate-900">Người xử lý:</span> {{ safeText(selected.creator?.name) }}</div>
                <div><span class="font-medium text-slate-900">Trạng thái tạo mới:</span> {{ selected.recreated_customer_id ? 'Đã tạo khách mới' : 'Chưa tạo' }}</div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 p-4 text-sm">
              <div class="text-xs uppercase tracking-wide text-slate-400">Ghi chú</div>
              <div class="mt-3 text-slate-700">{{ safeText(selected.note) }}</div>
            </div>
          </div>

          <div v-else class="px-5 py-16 text-sm text-slate-500">
            Chọn một dòng bên trái để xem chi tiết mất khách.
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>