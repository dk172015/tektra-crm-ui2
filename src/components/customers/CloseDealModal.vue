<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
    <div class="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-slate-900">Chốt hợp đồng</h3>
        <p class="mt-1 text-sm text-slate-500">
          Nhập thông tin doanh thu mặt bằng đã chốt trước khi chuyển sang tab Ký hợp đồng.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input v-model="form.contract_code" class="crm-input" placeholder="Mã hợp đồng (nếu có)" />
        <input v-model="form.building_name" class="crm-input" placeholder="Tên tòa nhà / mặt bằng" />
        <input v-model="form.address" class="crm-input md:col-span-2" placeholder="Địa chỉ mặt bằng" />
        <input v-model="form.area" type="number" class="crm-input" placeholder="Diện tích chốt" />
        <input v-model="form.monthly_revenue" type="number" class="crm-input" placeholder="Doanh thu / tháng" />
        <input v-model="form.lease_term_months" type="number" class="crm-input" placeholder="Số tháng thuê" />
        <input v-model="form.signed_date" type="date" class="crm-input" />
        <input v-model="form.start_date" type="date" class="crm-input" />
      </div>

      <textarea
        v-model="form.note"
        rows="4"
        class="crm-input mt-3 h-auto py-3"
        placeholder="Ghi chú chốt hợp đồng..."
      />

      <div v-if="errorMessage" class="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <div class="mt-5 flex justify-end gap-3">
        <button class="crm-btn crm-btn-secondary" @click="$emit('update:modelValue', false)">
          Hủy
        </button>

        <button class="crm-btn crm-btn-primary" :disabled="loading" @click="submit">
          {{ loading ? 'Đang lưu...' : 'Xác nhận chốt hợp đồng' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { closeDealApi } from '../../api/customers'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  customerId: { type: [String, Number], default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  contract_code: '',
  building_name: '',
  address: '',
  area: '',
  monthly_revenue: '',
  lease_term_months: '',
  signed_date: '',
  start_date: '',
  note: '',
})

const resetForm = () => {
  form.contract_code = ''
  form.building_name = ''
  form.address = ''
  form.area = ''
  form.monthly_revenue = ''
  form.lease_term_months = ''
  form.signed_date = ''
  form.start_date = ''
  form.note = ''
  errorMessage.value = ''
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) resetForm()
  }
)

const submit = async () => {
  errorMessage.value = ''

  if (!form.building_name.trim()) {
    errorMessage.value = 'Vui lòng nhập tên mặt bằng.'
    return
  }

  if (!form.monthly_revenue) {
    errorMessage.value = 'Vui lòng nhập doanh thu.'
    return
  }

  loading.value = true

  try {
    await closeDealApi(props.customerId, {
      contract_code: form.contract_code || null,
      building_name: form.building_name,
      address: form.address || null,
      area: form.area || null,
      monthly_revenue: form.monthly_revenue,
      lease_term_months: form.lease_term_months || null,
      signed_date: form.signed_date || null,
      start_date: form.start_date || null,
      note: form.note || null,
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