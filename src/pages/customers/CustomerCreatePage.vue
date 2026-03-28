<template>
  <MainLayout>
    <div class="mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Tạo khách hàng</h1>
          <p class="mt-1 text-sm text-slate-500">
            Nhập thông tin lead thuê văn phòng và phân công sale phụ trách
          </p>
        </div>

        <div class="flex gap-2">
          <router-link
            to="/customers"
            class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Quay lại
          </router-link>
        </div>
      </div>

      <form class="grid grid-cols-1 gap-4 xl:grid-cols-12" @submit.prevent="handleSubmit">
        <!-- Left -->
        <div class="space-y-4 xl:col-span-8">
          <!-- Basic info -->
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-slate-800">Thông tin khách hàng</h2>
                <p class="text-sm text-slate-500">Thông tin liên hệ và doanh nghiệp</p>
              </div>

              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Bắt buộc: Người liên hệ
              </span>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Tên công ty</label>
                <input
                  v-model="form.company_name"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Ví dụ: ABC Tech"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Người liên hệ *</label>
                <input
                  v-model="form.contact_name"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Số điện thoại</label>
                <input
                  v-model="form.phone"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="0901xxxxxx"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  v-model="form.email"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="abc@company.com"
                />
              </div>
            </div>
          </section>

          <!-- Source -->
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">Nguồn khách hàng</h2>
              <p class="text-sm text-slate-500">Theo dõi nguồn lead và chiến dịch marketing</p>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Nguồn khách</label>
                <select
                  v-model="form.lead_source_id"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="">Chọn nguồn khách</option>
                  <option v-for="item in leadSources" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Chi tiết nguồn</label>
                <input
                  v-model="form.source_detail"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Ví dụ: Search Ads / Fanpage / Zalo OA"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Chiến dịch</label>
                <input
                  v-model="form.campaign_name"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Ví dụ: Office Cầu Giấy Q2"
                />
              </div>
            </div>
          </section>

          <!-- Requirement -->
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">Nhu cầu thuê văn phòng</h2>
              <p class="text-sm text-slate-500">Dùng để lọc và tư vấn mặt bằng phù hợp</p>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div class="xl:col-span-2">
                <label class="mb-2 block text-sm font-medium text-slate-700">Khu vực mong muốn</label>
                <input
                  v-model="form.requirement.preferred_location"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Ví dụ: Cầu Giấy, Ba Đình, Nam Từ Liêm..."
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Ngày dự kiến vào thuê</label>
                <input
                  v-model="form.requirement.move_in_date"
                  type="date"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Kỳ hạn thuê (tháng)</label>
                <input
                  v-model="form.requirement.lease_term_months"
                  type="number"
                  min="1"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="12"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Diện tích tối thiểu (m²)</label>
                <input
                  v-model="form.requirement.area_min"
                  type="number"
                  min="0"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="50"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Diện tích tối đa (m²)</label>
                <input
                  v-model="form.requirement.area_max"
                  type="number"
                  min="0"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="120"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Ngân sách tối thiểu</label>
                <input
                  v-model="form.requirement.budget_min"
                  type="number"
                  min="0"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="20000000"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Ngân sách tối đa</label>
                <input
                  v-model="form.requirement.budget_max"
                  type="number"
                  min="0"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="40000000"
                />
              </div>

              <div class="md:col-span-2 xl:col-span-4">
                <label class="mb-2 block text-sm font-medium text-slate-700">Yêu cầu đặc biệt</label>
                <textarea
                  v-model="form.requirement.special_requirements"
                  rows="4"
                  class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Ví dụ: cần mặt sàn vuông, có chỗ đỗ xe, ưu tiên mặt kính, gần thang máy..."
                />
              </div>
            </div>
          </section>

          <!-- Note -->
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">Ghi chú chăm sóc</h2>
              <p class="text-sm text-slate-500">Thông tin thêm cho sale phụ trách</p>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">Ghi chú</label>
              <textarea
                v-model="form.note"
                rows="4"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                placeholder="Nhập ghi chú về tình trạng khách, nhu cầu, ưu tiên, mức độ tiềm năng..."
              />
            </div>
          </section>
        </div>

        <!-- Right -->
        <div class="space-y-4 xl:col-span-4">
          <!-- Status -->
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">Trạng thái ban đầu</h2>
              <p class="text-sm text-slate-500">Chọn giai đoạn hiện tại của khách hàng</p>
            </div>

            <div class="grid grid-cols-1 gap-2">
              <label
                v-for="item in statusOptions"
                :key="item.value"
                class="flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition"
                :class="form.status === item.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'"
              >
                <input
                  v-model="form.status"
                  :value="item.value"
                  type="radio"
                  class="h-4 w-4"
                />
                <div>
                  <div class="text-sm font-medium text-slate-800">{{ item.label }}</div>
                  <div class="text-xs text-slate-500">{{ item.desc }}</div>
                </div>
              </label>
            </div>
          </section>

          <!-- Assign sales -->
          <section
            v-if="isAdmin"
            class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">Phân công sale</h2>
              <p class="text-sm text-slate-500">
                Tìm và thêm sale phụ trách. Chỉ chọn 1 sale chính.
              </p>
            </div>

            <!-- Search -->
            <div class="mb-4">
              <label class="mb-2 block text-sm font-medium text-slate-700">
                Tìm sale theo tên hoặc email
              </label>
              <input
                v-model="saleKeyword"
                class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                placeholder="Ví dụ: Hùng, sale1@tektra.local..."
              />
            </div>

            <!-- Search results -->
            <div
              v-if="filteredSaleUsers.length"
              class="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Kết quả tìm kiếm
              </div>

              <div class="space-y-2">
                <div
                  v-for="sale in filteredSaleUsers"
                  :key="sale.id"
                  class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div class="min-w-0">
                    <div class="truncate text-sm font-medium text-slate-800">
                      {{ sale.name }}
                    </div>
                    <div class="truncate text-xs text-slate-500">
                      {{ sale.email }}
                    </div>
                  </div>

                  <button
                    type="button"
                    class="rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                    @click="addSale(sale)"
                  >
                    + Thêm
                  </button>
                </div>
              </div>
            </div>

            <!-- Selected sales -->
            <div>
              <div class="mb-2 text-sm font-medium text-slate-700">Sale đã chọn</div>

              <div v-if="selectedSales.length" class="space-y-3">
                <div
                  v-for="sale in selectedSales"
                  :key="sale.id"
                  class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-slate-800">
                      {{ sale.name }}
                    </div>
                    <div class="truncate text-xs text-slate-500">
                      {{ sale.email }}
                    </div>
                  </div>

                  <div class="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      class="rounded-xl px-3 py-2 text-xs font-medium"
                      :class="Number(form.primary_user_id) === Number(sale.id)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                      @click="setPrimarySale(sale.id)"
                    >
                      {{ Number(form.primary_user_id) === Number(sale.id) ? 'Sale chính' : 'Chọn chính' }}
                    </button>

                    <button
                      type="button"
                      class="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                      @click="removeSale(sale.id)"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400"
              >
                Chưa chọn sale nào
              </div>
            </div>
          </section>

          <!-- Summary -->
          <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">Tóm tắt nhanh</h2>
              <p class="text-sm text-slate-500">Kiểm tra trước khi lưu</p>
            </div>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Khách hàng</span>
                <span class="text-right font-medium text-slate-800">
                  {{ form.company_name || form.contact_name || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Nguồn</span>
                <span class="text-right font-medium text-slate-800">
                  {{ selectedLeadSourceName || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Trạng thái</span>
                <span class="text-right font-medium text-slate-800">
                  {{ selectedStatusLabel }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Khu vực</span>
                <span class="text-right font-medium text-slate-800">
                  {{ form.requirement.preferred_location || '-' }}
                </span>
              </div>

              <div class="flex justify-between gap-4">
                <span class="text-slate-500">Diện tích</span>
                <span class="text-right font-medium text-slate-800">
                  {{ form.requirement.area_min || '-' }} - {{ form.requirement.area_max || '-' }} m²
                </span>
              </div>

              <div v-if="isAdmin" class="flex justify-between gap-4">
                <span class="text-slate-500">Sale chính</span>
                <span class="text-right font-medium text-slate-800">
                  {{ selectedPrimarySaleName || '-' }}
                </span>
              </div>
            </div>
          </section>
        </div>

        <!-- Error -->
        <div
          v-if="errorMessage"
          class="xl:col-span-12 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ errorMessage }}
        </div>

        <!-- Sticky action -->
        <div class="xl:col-span-12">
          <div class="sticky bottom-3 z-10 flex justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow backdrop-blur">
            <router-link
              to="/customers"
              class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </router-link>

            <button
              type="submit"
              class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              :disabled="loading"
            >
              {{ loading ? 'Đang lưu...' : 'Lưu khách hàng' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../layouts/MainLayout.vue'
import { createCustomerApi } from '../../api/customers'
import { getLeadSourcesApi } from '../../api/leadSources'
import { getUsersApi } from '../../api/users'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const leadSources = ref([])
const saleUsers = ref([])
const errorMessage = ref('')
const loading = ref(false)
const saleKeyword = ref('')

const isAdmin = computed(() => auth.user?.role === 'admin')

const statusOptions = [
  { value: 'new', label: 'Khách mới', desc: 'Lead mới tạo hoặc mới tiếp nhận' },
  { value: 'consulting', label: 'Đang tư vấn', desc: 'Đã bắt đầu trao đổi với khách' },
  { value: 'viewing', label: 'Đi xem', desc: 'Đang sắp xếp hoặc đã đi xem mặt bằng' },
  { value: 'negotiating', label: 'Đàm phán', desc: 'Đang thương lượng điều kiện thuê' },
  { value: 'deposit', label: 'Đặt cọc', desc: 'Khách đã tiến tới bước đặt cọc' },
  { value: 'contracted', label: 'Đã ký hợp đồng', desc: 'Đã chốt và ký hợp đồng thuê' },
  { value: 'lost', label: 'Mất khách', desc: 'Lead không tiếp tục hoặc thất bại' },
]

const form = reactive({
  company_name: '',
  contact_name: '',
  phone: '',
  email: '',
  lead_source_id: '',
  source_detail: '',
  campaign_name: '',
  status: 'new',
  note: '',
  assigned_users: [],
  primary_user_id: '',
  requirement: {
    preferred_location: '',
    area_min: '',
    area_max: '',
    budget_min: '',
    budget_max: '',
    move_in_date: '',
    lease_term_months: '',
    special_requirements: '',
  },
})

const selectedSales = computed(() => {
  return saleUsers.value.filter((x) => form.assigned_users.includes(x.id))
})

const filteredSaleUsers = computed(() => {
  const keyword = saleKeyword.value.trim().toLowerCase()

  return saleUsers.value
    .filter((sale) => !form.assigned_users.includes(sale.id))
    .filter((sale) => {
      if (!keyword) return true
      return (
        sale.name?.toLowerCase().includes(keyword) ||
        sale.email?.toLowerCase().includes(keyword)
      )
    })
    .slice(0, 8)
})

const selectedLeadSourceName = computed(() => {
  return leadSources.value.find((x) => x.id === Number(form.lead_source_id))?.name || ''
})

const selectedStatusLabel = computed(() => {
  return statusOptions.find((x) => x.value === form.status)?.label || '-'
})

const selectedPrimarySaleName = computed(() => {
  return saleUsers.value.find((x) => Number(x.id) === Number(form.primary_user_id))?.name || ''
})

const addSale = (sale) => {
  if (!form.assigned_users.includes(sale.id)) {
    form.assigned_users.push(sale.id)
  }

  if (!form.primary_user_id) {
    form.primary_user_id = sale.id
  }

  saleKeyword.value = ''
}

const removeSale = (saleId) => {
  form.assigned_users = form.assigned_users.filter((id) => id !== saleId)

  if (Number(form.primary_user_id) === Number(saleId)) {
    form.primary_user_id = form.assigned_users.length ? form.assigned_users[0] : ''
  }
}

const setPrimarySale = (saleId) => {
  form.primary_user_id = saleId
}

const fetchLeadSources = async () => {
  const { data } = await getLeadSourcesApi()
  leadSources.value = data
}

const fetchSales = async () => {
  const { data } = await getUsersApi({ role: 'sale', active: 1, per_page: 200 })
  saleUsers.value = data.data
}

const normalizePayload = () => {
  const payload = JSON.parse(JSON.stringify(form))

  if (!payload.lead_source_id) payload.lead_source_id = null
  if (!payload.primary_user_id) payload.primary_user_id = null

  if (!isAdmin.value) {
    delete payload.assigned_users
    delete payload.primary_user_id
  }

  return payload
}

const handleSubmit = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    const payload = normalizePayload()
    const { data } = await createCustomerApi(payload)
    router.push(`/customers/${data.id}`)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể tạo khách hàng'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchLeadSources(), fetchSales()])
})
</script>