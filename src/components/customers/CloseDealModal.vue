<template>

  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex  overflow-y-auto justify-center items-center bg-black/35 p-4"
  > 
<div class="flex min-h-full items-start justify-center p-6  m-auto">
    <div class="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Chốt hợp đồng</h3>
          <p class="mt-1 text-sm text-slate-500">
            Nhập thông tin mặt bằng và doanh thu trước khi chuyển sang tab Ký hợp đồng.
          </p>
        </div>

        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          @click="closeModal"
        >
          ✕
        </button>
      </div>

      <!-- Customer snapshot -->
      <div class="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div class="mb-2 text-sm font-semibold text-slate-800">Thông tin khách hàng</div>
        <div class="grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <span class="font-medium text-slate-500">Công ty:</span>
            {{ customer.company_name || '-' }}
          </div>
          <div>
            <span class="font-medium text-slate-500">Người liên hệ:</span>
            {{ customer.contact_name || '-' }}
          </div>
          <div>
            <span class="font-medium text-slate-500">Điện thoại:</span>
            {{ customer.phone || '-' }}
          </div>
          <div>
            <span class="font-medium text-slate-500">Email:</span>
            {{ customer.email || '-' }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label class="crm-label">Mã dự án</label>
          <input
            v-model="form.project_code"
            class="crm-input"
            placeholder="Nhập mã dự án"
          />
        </div>

        <div>
          <label class="crm-label">Tòa nhà <span class="text-red-500">*</span></label>
          <input
            v-model="form.building_name"
            class="crm-input"
            placeholder="Nhập tên tòa nhà / mặt bằng"
          />
        </div>

        <div class="md:col-span-2">
          <label class="crm-label">Địa chỉ</label>
          <input
            v-model="form.address"
            class="crm-input"
            placeholder="Nhập địa chỉ mặt bằng"
          />
        </div>

        <div>
          <label class="crm-label">Tầng</label>
          <input
            v-model="form.floor"
            class="crm-input"
            placeholder="Ví dụ: Tầng 8"
          />
        </div>

        <div>
          <label class="crm-label">Diện tích</label>
          <input
            v-model="form.area"
            type="number"
            min="0"
            step="0.01"
            class="crm-input"
            placeholder="Ví dụ: 120"
          />
        </div>

        <div>
          <label class="crm-label">Giá thuê</label>
          <input
            v-model="form.rental_price"
            type="number"
            min="0"
            step="0.01"
            class="crm-input"
            placeholder="Nhập giá thuê"
          />
        </div>

        <div>
          <label class="crm-label">Thời hạn hợp đồng (tháng)</label>
          <input
            v-model="form.contract_term_months"
            type="number"
            min="1"
            class="crm-input"
            placeholder="Ví dụ: 24"
          />
        </div>

        <div>
          <label class="crm-label">Ngày đặt cọc</label>
          <input
            v-model="form.deposit_date"
            type="date"
            class="crm-input"
          />
        </div>

        <div>
          <label class="crm-label">Thời gian thanh toán kỳ đầu</label>
          <input
            v-model="form.first_payment_date"
            type="date"
            class="crm-input"
          />
        </div>

        <div>
          <label class="crm-label">Phí môi giới</label>
          <input
            v-model="form.brokerage_fee"
            type="number"
            min="0"
            step="0.01"
            class="crm-input"
            placeholder="Nhập phí môi giới"
          />
        </div>
        <div class="md:col-span-2">
        <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" v-model="form.has_vat" />
            Có VAT
        </label>
        </div>
        <div v-if="form.has_vat">
        <label class="crm-label">Doanh thu VAT</label>
        <input
            v-model="form.vat_revenue"
            type="number"
            min="0"
            step="0.01"
            class="crm-input"
        />
        </div>
        <div>
        <label class="crm-label">Phí back lại nguồn</label>
        <input
            v-model="form.back_fee"
            type="number"
            min="0"
            step="0.01"
            class="crm-input"
        />
        </div>

        <div v-if="auth.isAdmin">
          <label class="crm-label">Sale chốt <span class="text-red-500">*</span></label>
          <select v-model="form.closer_user_id" class="crm-input">
            <option value="">Chọn sale chốt</option>
            <option v-for="item in sales" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </div>

        <div v-else>
          <label class="crm-label">Sale chốt</label>
          <input
            :value="auth.user?.name || ''"
            class="crm-input bg-slate-50"
            disabled
          />
        </div>

        <div class="md:col-span-2">
          <label class="crm-label">Ghi chú</label>
          <textarea
            v-model="form.note"
            rows="4"
            class="crm-input h-auto py-3"
            placeholder="Nhập ghi chú chốt hợp đồng..."
          />
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ errorMessage }}
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button class="crm-btn crm-btn-secondary" @click="closeModal">
          Hủy
        </button>

        <button
          class="crm-btn crm-btn-primary"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? 'Đang lưu...' : 'Xác nhận chốt hợp đồng' }}
        </button>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { closeDealApi, getCustomerDetailApi } from '../../api/customers'
import { getUsersApi } from '../../api/users'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  customerId: { type: [String, Number], default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const errorMessage = ref('')
const customer = ref({})
const sales = ref([])

const form = reactive({
  project_code: '',
  building_name: '',
  address: '',
  floor: '',
  area: '',
  rental_price: '',
  contract_term_months: '',
  deposit_date: '',
  first_payment_date: '',
  brokerage_fee: '',
  closer_user_id: '',
  note: '',
  has_vat: false,
    vat_revenue: '',
    back_fee: '',
})

const resetForm = () => {
  form.project_code = ''
  form.building_name = ''
  form.address = ''
  form.floor = ''
  form.area = ''
  form.rental_price = ''
  form.contract_term_months = ''
  form.deposit_date = ''
  form.first_payment_date = ''
  form.brokerage_fee = ''
  form.closer_user_id = ''
  form.note = ''
  errorMessage.value = ''
}

const loadCustomer = async () => {
  if (!props.customerId) return
  const { data } = await getCustomerDetailApi(props.customerId)
  customer.value = data
}

const loadSales = async () => {
  if (!auth.isAdmin) return
  const { data } = await getUsersApi({ role: 'sale', active: 1, per_page: 200 })
  sales.value = data.data || []
}

watch(
  () => props.modelValue,
  async (val) => {
    if (!val) return
    resetForm()
    await loadCustomer()
    await loadSales()

    if (!auth.isAdmin) {
      form.closer_user_id = auth.user?.id || ''
    }
  }
)

const closeModal = () => {
  emit('update:modelValue', false)
}

const submit = async () => {
  errorMessage.value = ''

  if (!form.building_name.trim()) {
    errorMessage.value = 'Vui lòng nhập tòa nhà / mặt bằng.'
    return
  }

  if (auth.isAdmin && !form.closer_user_id) {
    errorMessage.value = 'Vui lòng chọn sale chốt.'
    return
  }

  loading.value = true

  try {
    await closeDealApi(props.customerId, {
      project_code: form.project_code || null,
      building_name: form.building_name,
      address: form.address || null,
      floor: form.floor || null,
      area: form.area || null,
      rental_price: form.rental_price || null,
      contract_term_months: form.contract_term_months || null,
      deposit_date: form.deposit_date || null,
      first_payment_date: form.first_payment_date || null,
      brokerage_fee: form.brokerage_fee || null,
      closer_user_id: auth.isAdmin ? form.closer_user_id : null,
      note: form.note || null,
      has_vat: form.has_vat ? 1 : 0,
    vat_revenue: form.has_vat ? (form.vat_revenue || null) : null,
    back_fee: form.back_fee || null,
    })

    emit('saved')
    emit('update:modelValue', false)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể chốt hợp đồng'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.crm-label {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.crm-input {
  width: 100%;
  height: 44px;
  border-radius: 14px;
  border: 1px solid #d7e0ea;
  background: #fff;
  padding: 0 14px;
  font-size: 14px;
  color: #0f172a;
  outline: none;
  transition: all 0.18s ease;
}

.crm-input:focus {
  border-color: #94a3b8;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.12);
}

.crm-btn {
  height: 42px;
  border-radius: 14px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.18s ease;
}

.crm-btn-primary {
  background: #0f172a;
  color: white;
  border: 1px solid #0f172a;
}

.crm-btn-primary:hover {
  background: #1e293b;
}

.crm-btn-secondary {
  background: white;
  color: #334155;
  border: 1px solid #d7e0ea;
}

.crm-btn-secondary:hover {
  background: #f8fafc;
}
</style>