<template>
  <MainLayout>
    <div class="mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="min-w-0">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="statusBadgeClass(customer.status)"
              >
                {{ statusLabel(customer.status) }}
              </span>

              <span
                v-if="customer.warning_level"
                class="rounded-full px-3 py-1 text-xs font-semibold"
                :class="warningBadgeClass(customer.warning_level)"
              >
                {{ warningText(customer) }}
              </span>

              <span
                v-if="customer.is_priority"
                class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
              >
                Ưu tiên theo dõi
              </span>
            </div>

            <h1 class="truncate text-2xl font-bold text-slate-800">
              {{ customer.company_name || customer.contact_name || 'Chi tiết khách hàng' }}
            </h1>

            <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>👤 {{ customer.contact_name || '-' }}</span>
              <span>📞 {{ customer.phone || '-' }}</span>
              <span>✉️ {{ customer.email || '-' }}</span>
              <span>🧲 {{ customer.lead_source?.name || '-' }}</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              class="rounded-xl border px-4 py-2 text-sm font-medium transition"
              :class="customer.is_priority
                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              @click="handleTogglePriority"
            >
              {{ customer.is_priority ? 'Bỏ ưu tiên' : 'Đánh dấu ưu tiên' }}
            </button>

            <button
              v-if="auth.isAdmin"
              class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="showAssignModal = true"
            >
              Phân công sale
            </button>

            <router-link
              to="/customers"
              class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Quay lại board
            </router-link>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <!-- Left -->
        <div class="space-y-4 xl:col-span-4">
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">Thông tin khách hàng</h2>
              <p class="text-sm text-slate-500">Tổng quan lead và người liên hệ</p>
            </div>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Công ty</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.company_name || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Người liên hệ</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.contact_name || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Điện thoại</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.phone || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Email</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.email || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Nguồn khách</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.lead_source?.name || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Chi tiết nguồn</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.source_detail || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Campaign</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.campaign_name || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Người tạo</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.creator?.name || '-' }}
                </span>
              </div>

              <div v-if="customer.priority_marker?.name" class="flex justify-between gap-4">
                <span class="text-slate-500">Đánh dấu ưu tiên bởi</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.priority_marker.name }}
                </span>
              </div>
            </div>
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">Sale phụ trách</h2>
              <p class="text-sm text-slate-500">Danh sách sale đang chăm sóc khách</p>
            </div>

            <div v-if="customer.assigned_users?.length" class="space-y-3">
              <div
                v-for="(user, index) in customer.assigned_users"
                :key="user.id"
                class="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
              >
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium text-slate-800">
                    {{ user.name }}
                  </div>
                  <div class="truncate text-xs text-slate-500">
                    {{ user.email }}
                  </div>
                </div>

                <span
                  class="rounded-full px-3 py-1 text-xs font-medium"
                  :class="index === 0 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'"
                >
                  {{ index === 0 ? 'Sale chính' : 'Phụ trách' }}
                </span>
              </div>
            </div>

            <div
              v-else
              class="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-400"
            >
              Chưa có sale phụ trách
            </div>
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">Nhu cầu thuê</h2>
              <p class="text-sm text-slate-500">Dữ liệu để tư vấn mặt bằng phù hợp</p>
            </div>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Khu vực</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.requirement?.preferred_location || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Diện tích</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.requirement?.area_min || '-' }} - {{ customer.requirement?.area_max || '-' }} m²
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Ngân sách</span>
                <span class="text-right font-medium text-slate-800">
                  {{ formatBudget(customer.requirement?.budget_min) }} - {{ formatBudget(customer.requirement?.budget_max) }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Ngày vào thuê</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.requirement?.move_in_date || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Kỳ hạn thuê</span>
                <span class="text-right font-medium text-slate-800">
                  {{ customer.requirement?.lease_term_months || '-' }} tháng
                </span>
              </div>

              <div class="pt-2">
                <div class="mb-1 text-slate-500">Yêu cầu đặc biệt</div>
                <div class="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                  {{ customer.requirement?.special_requirements || 'Chưa có yêu cầu đặc biệt' }}
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Right -->
        <div class="space-y-4 xl:col-span-8">
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">Cập nhật nhanh</h2>
              <p class="text-sm text-slate-500">Sale có thể thêm nhiều ghi chú và hoạt động chăm sóc</p>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div class="rounded-2xl border border-slate-200 p-4">
                <div class="mb-3 text-sm font-semibold text-slate-800">Thêm ghi chú</div>

                <textarea
                  v-model="noteForm.content"
                  rows="4"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Nhập ghi chú mới về khách hàng..."
                />

                <div v-if="noteError" class="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {{ noteError }}
                </div>

                <div class="mt-3 flex justify-end">
                  <button
                    class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                    :disabled="noteLoading"
                    @click="submitNote"
                  >
                    {{ noteLoading ? 'Đang lưu...' : 'Lưu ghi chú' }}
                  </button>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200 p-4">
                <div class="mb-3 text-sm font-semibold text-slate-800">Thêm hoạt động chăm sóc</div>

                <div class="space-y-3">
                  <select
                    v-model="activityForm.type"
                    class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="call">Gọi điện</option>
                    <option value="message">Nhắn tin</option>
                    <option value="meeting">Gặp mặt</option>
                    <option value="site_visit">Khảo sát / đi xem</option>
                    <option value="note">Ghi chú</option>
                  </select>

                  <textarea
                    v-model="activityForm.content"
                    rows="3"
                    class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Mô tả hoạt động..."
                  />

                  <div v-if="activityError" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {{ activityError }}
                  </div>

                  <button
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    :disabled="activityLoading"
                    @click="submitActivity"
                  >
                    {{ activityLoading ? 'Đang lưu...' : 'Lưu hoạt động' }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-800">Lịch đi xem mặt bằng</h2>
                <p class="text-sm text-slate-500">Nhập tay thông tin lịch hẹn đi xem</p>
              </div>

              <button
                class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                @click="showViewingForm = !showViewingForm"
              >
                {{ showViewingForm ? 'Ẩn form' : 'Thêm lịch đi xem' }}
              </button>
            </div>

            <div v-if="showViewingForm" class="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <input
                  v-model="viewingForm.building_name"
                  class="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Tên tòa nhà / mặt bằng"
                />

                <input
                  v-model="viewingForm.address"
                  class="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Địa chỉ mặt bằng"
                />

                <input
                  v-model="viewingForm.viewing_time"
                  type="datetime-local"
                  class="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />

                <select
                  v-model="viewingForm.status"
                  class="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="scheduled">Đã lên lịch</option>
                  <option value="done">Đã đi xem</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <textarea
                v-model="viewingForm.note"
                rows="3"
                class="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                placeholder="Ghi chú lịch đi xem..."
              />

              <div v-if="viewingError" class="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {{ viewingError }}
              </div>

              <div class="mt-3 flex justify-end">
                <button
                  class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  :disabled="viewingLoading"
                  @click="submitViewing"
                >
                  {{ viewingLoading ? 'Đang lưu...' : 'Lưu lịch đi xem' }}
                </button>
              </div>
            </div>

            <div v-if="customer.viewings?.length" class="space-y-3">
              <div
                v-for="item in customer.viewings"
                :key="item.id"
                class="rounded-2xl border border-slate-200 px-4 py-4"
              >
                <div class="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div class="font-medium text-slate-800">
                    {{ item.building_name || item.property?.building_name || '-' }}
                  </div>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {{ viewingStatusLabel(item.status) }}
                  </span>
                </div>

                <div class="text-sm text-slate-600">
                  {{ item.address || item.property?.address || '-' }}
                </div>
                <div class="mt-1 text-sm text-slate-500">
                  {{ formatDateTime(item.viewing_time) }}
                </div>
                <div class="mt-2 text-sm text-slate-600">
                  {{ item.note || 'Không có ghi chú' }}
                </div>
              </div>
            </div>

            <div
              v-else
              class="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400"
            >
              Chưa có lịch đi xem
            </div>
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-800">Lịch sử chăm sóc</h2>
                <p class="text-sm text-slate-500">Toàn bộ ghi chú, thay đổi trạng thái và hoạt động</p>
              </div>

              <div class="text-sm text-slate-500">
                {{ paginatedActivities.length ? `${activityPageStart}-${activityPageEnd} / ${customer.activities?.length || 0}` : '0' }}
              </div>
            </div>

            <div v-if="paginatedActivities.length" class="space-y-4">
              <div
                v-for="item in paginatedActivities"
                :key="item.id"
                class="rounded-2xl border border-slate-200 px-4 py-4"
              >
                <div class="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="rounded-full px-3 py-1 text-xs font-semibold"
                      :class="activityBadgeClass(item.type)"
                    >
                      {{ activityTypeLabel(item.type) }}
                    </span>

                    <span class="text-xs text-slate-400">
                      {{ item.user?.name || '-' }}
                    </span>
                  </div>

                  <div class="text-xs text-slate-400">
                    {{ formatDateTime(item.activity_time) }}
                  </div>
                </div>

                <div class="text-sm leading-6 text-slate-700">
                  {{ item.content }}
                </div>
              </div>
            </div>

            <div
              v-else
              class="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400"
            >
              Chưa có hoạt động chăm sóc
            </div>

            <div
              v-if="totalActivityPages > 1"
              class="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4"
            >
              <button
                class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="activityPage === 1"
                @click="activityPage--"
              >
                Trang trước
              </button>

              <div class="flex items-center gap-2">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  class="h-9 min-w-[36px] rounded-xl border px-3 text-sm font-medium transition"
                  :class="page === activityPage
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
                  @click="activityPage = page"
                >
                  {{ page }}
                </button>
              </div>

              <button
                class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="activityPage === totalActivityPages"
                @click="activityPage++"
              >
                Trang sau
              </button>
            </div>
          </section>
        </div>
      </div>

      <AssignSalesModal
        v-model="showAssignModal"
        :customer="customer"
        @saved="reloadCustomer"
      />
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '../../layouts/MainLayout.vue'
import AssignSalesModal from '../../components/customers/AssignSalesModal.vue'
import {
  addActivityApi,
  addViewingApi,
  getCustomerDetailApi,
  togglePriorityApi,
} from '../../api/customers'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const auth = useAuthStore()

const customer = ref({})
const showAssignModal = ref(false)
const showViewingForm = ref(false)

const noteLoading = ref(false)
const activityLoading = ref(false)
const viewingLoading = ref(false)
const priorityLoading = ref(false)

const noteError = ref('')
const activityError = ref('')
const viewingError = ref('')

const noteForm = reactive({
  content: '',
})

const activityForm = reactive({
  type: 'call',
  content: '',
})

const viewingForm = reactive({
  building_name: '',
  address: '',
  viewing_time: '',
  status: 'scheduled',
  note: '',
})

const activityPage = ref(1)
const activityPerPage = 5

const totalActivityPages = computed(() => {
  const total = customer.value.activities?.length || 0
  return Math.max(1, Math.ceil(total / activityPerPage))
})

const paginatedActivities = computed(() => {
  const list = customer.value.activities || []
  const start = (activityPage.value - 1) * activityPerPage
  return list.slice(start, start + activityPerPage)
})

const activityPageStart = computed(() => {
  if (!paginatedActivities.value.length) return 0
  return (activityPage.value - 1) * activityPerPage + 1
})

const activityPageEnd = computed(() => {
  return activityPageStart.value + paginatedActivities.value.length - 1
})

const visiblePages = computed(() => {
  const total = totalActivityPages.value
  const current = activityPage.value
  const pages = []

  let start = Math.max(1, current - 1)
  let end = Math.min(total, current + 1)

  if (current === 1) {
    end = Math.min(total, 3)
  }

  if (current === total) {
    start = Math.max(1, total - 2)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

watch(
  () => customer.value.activities?.length,
  () => {
    if (activityPage.value > totalActivityPages.value) {
      activityPage.value = totalActivityPages.value
    }
  }
)

const reloadCustomer = async () => {
  const { data } = await getCustomerDetailApi(route.params.id)
  customer.value = data
}

const handleTogglePriority = async () => {
  if (priorityLoading.value) return
  priorityLoading.value = true

  try {
    await togglePriorityApi(route.params.id)
    await reloadCustomer()
  } finally {
    priorityLoading.value = false
  }
}

const submitNote = async () => {
  noteError.value = ''

  if (!noteForm.content.trim()) {
    noteError.value = 'Vui lòng nhập nội dung ghi chú.'
    return
  }

  noteLoading.value = true

  try {
    await addActivityApi(route.params.id, {
      type: 'note',
      content: noteForm.content,
    })

    noteForm.content = ''
    await reloadCustomer()
    activityPage.value = 1
  } catch (error) {
    noteError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu ghi chú'
  } finally {
    noteLoading.value = false
  }
}

const submitActivity = async () => {
  activityError.value = ''

  if (!activityForm.content.trim()) {
    activityError.value = 'Vui lòng nhập nội dung hoạt động.'
    return
  }

  activityLoading.value = true

  try {
    await addActivityApi(route.params.id, {
      type: activityForm.type,
      content: activityForm.content,
    })

    activityForm.type = 'call'
    activityForm.content = ''
    await reloadCustomer()
    activityPage.value = 1
  } catch (error) {
    activityError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu hoạt động'
  } finally {
    activityLoading.value = false
  }
}

const submitViewing = async () => {
  viewingError.value = ''

  if (!viewingForm.building_name.trim()) {
    viewingError.value = 'Vui lòng nhập tên tòa nhà / mặt bằng.'
    return
  }

  if (!viewingForm.address.trim()) {
    viewingError.value = 'Vui lòng nhập địa chỉ mặt bằng.'
    return
  }

  if (!viewingForm.viewing_time) {
    viewingError.value = 'Vui lòng chọn thời gian đi xem.'
    return
  }

  viewingLoading.value = true

  try {
    await addViewingApi(route.params.id, {
      building_name: viewingForm.building_name,
      address: viewingForm.address,
      viewing_time: viewingForm.viewing_time,
      status: viewingForm.status,
      note: viewingForm.note,
    })

    viewingForm.building_name = ''
    viewingForm.address = ''
    viewingForm.viewing_time = ''
    viewingForm.status = 'scheduled'
    viewingForm.note = ''
    showViewingForm.value = false

    await reloadCustomer()
    activityPage.value = 1
  } catch (error) {
    viewingError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu lịch đi xem'
  } finally {
    viewingLoading.value = false
  }
}

const formatBudget = (value) => {
  if (!value) return '-'
  return new Intl.NumberFormat('vi-VN').format(value)
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN')
}

const viewingStatusLabel = (status) => {
  const map = {
    scheduled: 'Đã lên lịch',
    done: 'Đã đi xem',
    cancelled: 'Đã hủy',
  }
  return map[status] || status || '-'
}

const statusLabel = (status) => {
  const map = {
    new: 'Khách mới',
    consulting: 'Đang tư vấn',
    viewing: 'Đi xem',
    negotiating: 'Đàm phán',
    deposit: 'Đặt cọc',
    contracted: 'Đã ký HĐ',
    lost: 'Không thành công',
  }

  return map[status] || status || '-'
}

const statusBadgeClass = (status) => {
  const map = {
    new: 'bg-slate-100 text-slate-700',
    consulting: 'bg-blue-100 text-blue-700',
    viewing: 'bg-cyan-100 text-cyan-700',
    negotiating: 'bg-amber-100 text-amber-700',
    deposit: 'bg-orange-100 text-orange-700',
    contracted: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  }

  return map[status] || 'bg-slate-100 text-slate-700'
}

const activityTypeLabel = (type) => {
  const map = {
    note: 'Ghi chú',
    call: 'Gọi điện',
    message: 'Nhắn tin',
    meeting: 'Gặp mặt',
    site_visit: 'Đi xem / khảo sát',
    status_change: 'Đổi trạng thái',
    assignment_change: 'Đổi phân công',
    warning_resolved: 'Xử lý cảnh báo',
    priority_change: 'Ưu tiên theo dõi',
  }

  return map[type] || type
}

const activityBadgeClass = (type) => {
  const map = {
    note: 'bg-slate-100 text-slate-700',
    call: 'bg-blue-100 text-blue-700',
    message: 'bg-cyan-100 text-cyan-700',
    meeting: 'bg-purple-100 text-purple-700',
    site_visit: 'bg-emerald-100 text-emerald-700',
    status_change: 'bg-amber-100 text-amber-700',
    assignment_change: 'bg-rose-100 text-rose-700',
    warning_resolved: 'bg-lime-100 text-lime-700',
    priority_change: 'bg-amber-100 text-amber-700',
  }

  return map[type] || 'bg-slate-100 text-slate-700'
}

const warningBadgeClass = (level) => {
  if (level === 'red') {
    return 'bg-red-50 text-red-700'
  }

  if (level === 'yellow') {
    return 'bg-amber-50 text-amber-700'
  }

  return 'bg-slate-100 text-slate-700'
}

const warningText = (item) => {
  const days = item.warning_days || 0

  if (item.warning_level === 'red') {
    return `${days} ngày chưa cập nhật`
  }

  if (item.warning_level === 'yellow') {
    return `${days} ngày cần theo dõi`
  }

  return ''
}

onMounted(async () => {
  await reloadCustomer()
})
</script>