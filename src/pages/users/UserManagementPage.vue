<template>
  <MainLayout>
    <div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold">Quản lý sale</h1>
          <p class="mt-1 text-sm text-slate-500">Tạo, sửa, khóa tài khoản sale</p>
        </div>

        <button
          class="rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white"
          @click="openCreate"
        >
          + Tạo sale
        </button>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-200">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50">
              <tr class="text-left">
                <th class="px-4 py-4">Tên</th>
                <th class="px-4 py-4">Email</th>
                <th class="px-4 py-4">Vai trò</th>
                <th class="px-4 py-4">Trạng thái</th>
                <th class="px-4 py-4">Thao tác</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="item in users" :key="item.id">
                <td class="px-4 py-4">{{ item.name }}</td>
                <td class="px-4 py-4">{{ item.email }}</td>
                <td class="px-4 py-4">{{ item.role }}</td>
                <td class="px-4 py-4">
                  <span
                    class="rounded-full px-3 py-1 text-xs font-medium"
                    :class="item.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                  >
                    {{ item.is_active ? 'Đang hoạt động' : 'Đã khóa' }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex flex-wrap gap-2">
                    <button class="rounded-xl border px-3 py-2" @click="openEdit(item)">Sửa</button>
                    <button class="rounded-xl border px-3 py-2" @click="toggleStatus(item)">
                      {{ item.is_active ? 'Khóa' : 'Mở' }}
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="!users.length">
                <td colspan="5" class="px-4 py-10 text-center text-slate-500">
                  Chưa có dữ liệu user
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
        <div class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
          <h2 class="mb-4 text-xl font-bold">
            {{ form.id ? 'Cập nhật user' : 'Tạo user mới' }}
          </h2>

          <div class="grid grid-cols-1 gap-4">
            <input v-model="form.name" class="rounded-2xl border px-4 py-3" placeholder="Tên" />
            <input v-model="form.email" class="rounded-2xl border px-4 py-3" placeholder="Email" />
            <input v-model="form.password" type="password" class="rounded-2xl border px-4 py-3" placeholder="Mật khẩu" />

            <select v-model="form.role" class="rounded-2xl border px-4 py-3">
              <option value="sale">sale</option>
              <option value="admin">admin</option>
            </select>

            <select v-model="form.is_active" class="rounded-2xl border px-4 py-3">
              <option :value="true">Hoạt động</option>
              <option :value="false">Khóa</option>
            </select>
          </div>

          <div v-if="errorMessage" class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {{ errorMessage }}
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button class="rounded-2xl border px-4 py-3" @click="closeModal">Hủy</button>
            <button class="rounded-2xl bg-slate-900 px-4 py-3 text-white" @click="saveUser">
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import MainLayout from '../../layouts/MainLayout.vue'
import { createUserApi, getUsersApi, toggleUserStatusApi, updateUserApi } from '../../api/users'

const users = ref([])
const showModal = ref(false)
const errorMessage = ref('')

const form = reactive({
  id: null,
  name: '',
  email: '',
  password: '',
  role: 'sale',
  is_active: true,
})

const fetchUsers = async () => {
  const { data } = await getUsersApi({ per_page: 200 })
  users.value = data.data
}

const openCreate = () => {
  errorMessage.value = ''
  form.id = null
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = 'sale'
  form.is_active = true
  showModal.value = true
}

const openEdit = (item) => {
  errorMessage.value = ''
  form.id = item.id
  form.name = item.name
  form.email = item.email
  form.password = ''
  form.role = item.role
  form.is_active = item.is_active
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveUser = async () => {
  errorMessage.value = ''

  try {
    if (form.id) {
      await updateUserApi(form.id, form)
    } else {
      await createUserApi(form)
    }

    showModal.value = false
    await fetchUsers()
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu user'
  }
}

const toggleStatus = async (item) => {
  await toggleUserStatusApi(item.id)
  await fetchUsers()
}

onMounted(fetchUsers)
</script>