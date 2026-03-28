<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
  >
    <div class="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-800">Phân công sale</h2>
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

      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium text-slate-700">
          Tìm sale theo tên hoặc email
        </label>
        <input
          v-model="keyword"
          class="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          placeholder="Ví dụ: Hùng, sale1@tektra.local..."
        />
      </div>

      <div
        v-if="filteredSales.length"
        class="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-3"
      >
        <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Kết quả tìm kiếm
        </div>

        <div class="space-y-2">
          <div
            v-for="sale in filteredSales"
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

      <div>
        <div class="mb-2 text-sm font-medium text-slate-700">Sale đang phụ trách</div>

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
                :class="Number(primaryUserId) === Number(sale.id)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                @click="setPrimary(sale.id)"
              >
                {{ Number(primaryUserId) === Number(sale.id) ? 'Sale chính' : 'Chọn chính' }}
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
          Chưa có sale phụ trách
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ errorMessage }}
      </div>

      <div class="mt-6 flex justify-end gap-3">
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
          @click="save"
        >
          {{ loading ? 'Đang lưu...' : 'Lưu phân công' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getUsersApi } from '../../api/users'
import { assignCustomerApi } from '../../api/customers'

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

const sales = ref([])
const selectedUserIds = ref([])
const primaryUserId = ref('')
const keyword = ref('')
const loading = ref(false)
const errorMessage = ref('')

const selectedSales = computed(() => {
  return sales.value.filter((x) => selectedUserIds.value.includes(x.id))
})

const filteredSales = computed(() => {
  const kw = keyword.value.trim().toLowerCase()

  return sales.value
    .filter((sale) => !selectedUserIds.value.includes(sale.id))
    .filter((sale) => {
      if (!kw) return true
      return (
        sale.name?.toLowerCase().includes(kw) ||
        sale.email?.toLowerCase().includes(kw)
      )
    })
    .slice(0, 8)
})

const loadSales = async () => {
  const { data } = await getUsersApi({ role: 'sale', active: 1, per_page: 200 })
  sales.value = data.data || []
}

const syncFromCustomer = () => {
  const assigned = props.customer?.assigned_users || []
  selectedUserIds.value = assigned.map((x) => x.id)

  const currentPrimary = assigned[0]?.id || ''
  primaryUserId.value = currentPrimary

  keyword.value = ''
  errorMessage.value = ''
}

const detectPrimaryFromCustomer = () => {
  const assigned = props.customer?.assigned_users || []
  if (!assigned.length) return ''

  return assigned[0].id
}

const addSale = (sale) => {
  if (!selectedUserIds.value.includes(sale.id)) {
    selectedUserIds.value.push(sale.id)
  }

  if (!primaryUserId.value) {
    primaryUserId.value = sale.id
  }

  keyword.value = ''
}

const removeSale = (saleId) => {
  selectedUserIds.value = selectedUserIds.value.filter((id) => id !== saleId)

  if (Number(primaryUserId.value) === Number(saleId)) {
    primaryUserId.value = selectedUserIds.value.length ? selectedUserIds.value[0] : ''
  }
}

const setPrimary = (saleId) => {
  primaryUserId.value = saleId
}

const save = async () => {
  errorMessage.value = ''

  if (!selectedUserIds.value.length) {
    errorMessage.value = 'Bạn cần chọn ít nhất 1 sale.'
    return
  }

  if (!primaryUserId.value) {
    errorMessage.value = 'Bạn cần chọn sale chính.'
    return
  }

  loading.value = true

  try {
    await assignCustomerApi(props.customer.id, {
      assigned_users: selectedUserIds.value,
      primary_user_id: primaryUserId.value,
    })

    emit('saved')
    emit('update:modelValue', false)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu phân công sale'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      await loadSales()
      syncFromCustomer()
      const primary = detectPrimaryFromCustomer()
      if (primary) primaryUserId.value = primary
    }
  }
)
</script>