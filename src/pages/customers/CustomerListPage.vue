<template>
  <MainLayout>
    <div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold">Khách hàng</h1>
          <p class="mt-1 text-sm text-slate-500">
            Danh sách khách thuê văn phòng trong hệ thống
          </p>
        </div>

        <router-link
          to="/customers/create"
          class="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
        >
          + Tạo khách mới
        </router-link>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          v-model="filters.keyword"
          type="text"
          class="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          placeholder="Tìm theo tên, SĐT, email"
        />

        <select
          v-model="filters.status"
          class="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="new">Mới</option>
          <option value="consulting">Tư vấn</option>
          <option value="viewing">Đi xem</option>
          <option value="negotiating">Đàm phán</option>
          <option value="deposit">Đặt cọc</option>
          <option value="contracted">Đã ký HĐ</option>
          <option value="lost">Mất</option>
        </select>

        <button
          class="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium transition hover:bg-slate-50"
          @click="fetchCustomers"
        >
          Lọc dữ liệu
        </button>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50">
              <tr class="text-left text-slate-600">
                <th class="px-4 py-4 font-semibold">Khách hàng</th>
                <th class="px-4 py-4 font-semibold">Liên hệ</th>
                <th class="px-4 py-4 font-semibold">Nguồn</th>
                <th class="px-4 py-4 font-semibold">Trạng thái</th>
                <th class="px-4 py-4 font-semibold">Người phụ trách</th>
                <th class="px-4 py-4 font-semibold">Ngày tạo</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100 bg-white">
              <tr
                v-for="item in items"
                :key="item.id"
                class="cursor-pointer transition hover:bg-slate-50"
                @click="goDetail(item.id)"
              >
                <td class="px-4 py-4">
                  <div class="font-semibold text-slate-900">
                    {{ item.company_name || item.contact_name }}
                  </div>
                  <div class="mt-1 text-slate-500">{{ item.contact_name }}</div>
                </td>

                <td class="px-4 py-4">
                  <div>{{ item.phone || '-' }}</div>
                  <div class="mt-1 text-slate-500">{{ item.email || '-' }}</div>
                </td>

                <td class="px-4 py-4">
                  {{ item.lead_source?.name || '-' }}
                </td>

                <td class="px-4 py-4">
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {{ item.status }}
                  </span>
                </td>

                <td class="px-4 py-4">
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="user in item.assigned_users"
                      :key="user.id"
                      class="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {{ user.name }}
                    </span>
                  </div>
                </td>

                <td class="px-4 py-4 text-slate-500">
                  {{ formatDate(item.created_at) }}
                </td>
              </tr>

              <tr v-if="!items.length">
                <td colspan="6" class="px-4 py-10 text-center text-slate-500">
                  Chưa có dữ liệu khách hàng
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../layouts/MainLayout.vue'
import { getCustomersApi } from '../../api/customers'

const router = useRouter()
const items = ref([])
const filters = reactive({
  keyword: '',
  status: '',
})

const fetchCustomers = async () => {
  const { data } = await getCustomersApi(filters)
  items.value = data.data
}

const goDetail = (id) => {
  router.push(`/customers/${id}`)
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN')
}

onMounted(fetchCustomers)
</script>