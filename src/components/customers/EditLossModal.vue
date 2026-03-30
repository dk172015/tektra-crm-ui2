<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
  >
    <div class="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Sửa thông tin mất khách</h3>
          <p class="mt-1 text-sm text-slate-500">
            Chỉ admin được phép chỉnh sửa dữ liệu mất khách.
          </p>
        </div>

        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          @click="closeModal"
        >
          ✕
        </button>
      </div>

      <div class="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div class="mb-2 text-sm font-semibold text-slate-800">Thông tin khách hàng</div>
        <div class="grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
          <div><span class="font-medium text-slate-500">Công ty:</span> {{ customer.company_name || '-' }}</div>
          <div><span class="font-medium text-slate-500">Người liên hệ:</span> {{ customer.contact_name || '-' }}</div>
          <div><span class="font-medium text-slate-500">Điện thoại:</span> {{ customer.phone || '-' }}</div>
          <div><span class="font-medium text-slate-500">Email:</span> {{ customer.email || '-' }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div class="md:col-span-2">
          <label class="crm-label">Lý do mất khách <span class="text-red-500">*</span></label>
          <input v-model="form.reason" class="crm-input" />
        </div>

        <div>
          <label class="crm-label">Đối thủ / bên chốt</label>
          <input v-model="form.competitor_name" class="crm-input" />
        </div>

        <div>
          <label class="crm-label">Giá bên khác</label>
          <input v-model="form.lost_price" type="number" min="0" step="0.01" class="crm-input" />
        </div>

        <div>
          <label class="crm-label">Ngày mất khách</label>
          <input v-model="form.lost_at" type="date" class="crm-input" />
        </div>

        <div class="md:col-span-2">
          <label class="crm-label">Ghi chú</label>
          <textarea v-model="form.note" rows="4" class="crm-input h-auto py-3" />
        </div>
      </div>

      <div v-if="errorMessage" class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button class="crm-btn crm-btn-secondary" @click="closeModal">Hủy</button>
        <button class="crm-btn crm-btn-primary" :disabled="loading" @click="submit">
          {{ loading ? 'Đang lưu...' : 'Lưu thay đổi' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { getCustomerDetailApi, getCustomerLossApi, updateCustomerLossApi } from '../../api/customers'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  customerId: { type: [String, Number], default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const errorMessage = ref('')
const customer = ref({})

const form = reactive({
  reason: '',
  competitor_name: '',
  lost_price: '',
  lost_at: '',
  note: '',
})

const normalizeDate = (value) => {
  if (!value) return ''
  return String(value).slice(0, 10)
}

const resetForm = () => {
  form.reason = ''
  form.competitor_name = ''
  form.lost_price = ''
  form.lost_at = ''
  form.note = ''
  errorMessage.value = ''
}

const loadData = async () => {
  if (!props.customerId) return

  const [{ data: customerData }, { data: lossData }] = await Promise.all([
    getCustomerDetailApi(props.customerId),
    getCustomerLossApi(props.customerId),
  ])

  customer.value = customerData
  form.reason = lossData.reason || ''
  form.competitor_name = lossData.competitor_name || ''
  form.lost_price = lossData.lost_price || ''
  form.lost_at = normalizeDate(lossData.lost_at)
  form.note = lossData.note || ''
}

watch(
  () => props.modelValue,
  async (val) => {
    if (!val) return
    resetForm()
    await loadData()
  }
)

const closeModal = () => {
  emit('update:modelValue', false)
}

const submit = async () => {
  errorMessage.value = ''

  if (!props.customerId) {
    errorMessage.value = 'Không xác định được khách hàng.'
    return
  }

  if (!form.reason.trim()) {
    errorMessage.value = 'Vui lòng nhập lý do mất khách.'
    return
  }

  loading.value = true
  try {
    await updateCustomerLossApi(props.customerId, {
      reason: form.reason,
      competitor_name: form.competitor_name || null,
      lost_price: form.lost_price || null,
      lost_at: form.lost_at || null,
      note: form.note || null,
    })

    emit('saved')
    emit('update:modelValue', false)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể cập nhật thông tin mất khách'
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
}
.crm-btn-primary {
  background: #0f172a;
  color: #fff;
  border: 1px solid #0f172a;
}
.crm-btn-secondary {
  background: #fff;
  color: #334155;
  border: 1px solid #d7e0ea;
}
</style>