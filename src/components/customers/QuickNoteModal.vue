<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
  >
    <div class="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-800">Thêm ghi chú nhanh</h2>
          <p class="mt-1 text-sm text-slate-500">
            {{ customer?.company_name || customer?.contact_name || 'Khách hàng' }}
          </p>
        </div>

        <button
          type="button"
          class="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          @click="$emit('update:modelValue', false)"
        >
          Đóng
        </button>
      </div>

      <div
        v-if="customer?.warning_level"
        class="mb-4 rounded-2xl px-4 py-3 text-sm font-medium"
        :class="customer.warning_level === 'red' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'"
      >
        {{ warningText }}
      </div>

      <div class="space-y-3">
        <textarea
          v-model="form.content"
          rows="6"
          class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          placeholder="Nhập ghi chú mới về khách hàng..."
        />

        <div
          v-if="errorMessage"
          class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ errorMessage }}
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="$emit('update:modelValue', false)"
          >
            Hủy
          </button>

          <button
            type="button"
            class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            :disabled="loading"
            @click="submit"
          >
            {{ loading ? 'Đang lưu...' : 'Lưu ghi chú' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { addActivityApi } from '../../api/customers'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  customer: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  content: '',
})

const warningText = computed(() => {
  const days = props.customer?.warning_days || 0
  if (props.customer?.warning_level === 'red') {
    return `${days} ngày chưa cập nhật trạng thái / ghi chú`
  }
  if (props.customer?.warning_level === 'yellow') {
    return `${days} ngày cần theo dõi khách`
  }
  return ''
})

const resetForm = () => {
  form.content = ''
  errorMessage.value = ''
}

const submit = async () => {
  errorMessage.value = ''

  if (!form.content.trim()) {
    errorMessage.value = 'Vui lòng nhập nội dung ghi chú.'
    return
  }

  loading.value = true

  try {
    await addActivityApi(props.customer.id, {
      type: 'note',
      content: form.content,
    })

    resetForm()
    emit('saved')
    emit('update:modelValue', false)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu ghi chú'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) resetForm()
  }
)
</script>