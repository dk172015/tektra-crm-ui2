<template>
  <MainLayout>
    <div class="space-y-4">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-slate-900">Quản lý người dùng</h1>
            <p class="text-sm text-slate-500">Sale, leader, kế toán và admin</p>
          </div>

          <button class="crm-btn crm-btn-primary" @click="openCreate">
            + Tạo người dùng
          </button>
        </div>

        <div class="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <input
            v-model="filters.keyword"
            class="crm-input lg:col-span-2"
            placeholder="Tìm tên, email, điện thoại, mã NV..."
            @keyup.enter="fetchUsers"
          />

          <select v-model="filters.role" class="crm-input">
            <option value="">Tất cả quyền</option>
            <option value="sale">Sale</option>
            <option value="leader">Leader</option>
            <option value="accountant">Kế toán</option>
            <option value="admin">Admin</option>
          </select>

          <select v-model="filters.active" class="crm-input">
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang hoạt động</option>
            <option value="0">Ngừng hoạt động</option>
          </select>

          <div class="flex gap-2">
            <button class="crm-btn crm-btn-primary flex-1" @click="fetchUsers">Lọc</button>
            <button class="crm-btn crm-btn-secondary flex-1" @click="resetFilters">Xóa</button>
          </div>
        </div>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          <div
            v-for="user in users"
            :key="user.id"
            class="crm-user-enterprise-card"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-center gap-3">
                <div class="crm-user-avatar">
                  <img
                    v-if="user.avatar"
                    :src="user.avatar"
                    alt="avatar"
                    class="h-full w-full rounded-[18px] object-cover"
                  />
                  <span v-else>{{ getInitials(user.name) }}</span>
                </div>

                <div class="min-w-0">
                  <div class="truncate text-sm font-bold text-slate-900">
                    {{ user.name }}
                  </div>
                  <div class="truncate text-xs text-slate-500">
                    {{ user.email }}
                  </div>
                </div>
              </div>

              <span class="crm-pill" :class="roleBadgeClass(user.role)">
                {{ roleLabel(user.role) }}
              </span>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div class="crm-meta-box">
                <span class="crm-meta-label">Mã NV</span>
                <span class="truncate">{{ user.employee_code || '-' }}</span>
              </div>

              <div class="crm-meta-box">
                <span class="crm-meta-label">SĐT</span>
                <span class="truncate">{{ user.phone || '-' }}</span>
              </div>

              <div class="crm-meta-box">
                <span class="crm-meta-label">Chức danh</span>
                <span class="truncate">{{ user.job_title || '-' }}</span>
              </div>

              <div class="crm-meta-box">
                <span class="crm-meta-label">Phòng ban</span>
                <span class="truncate">{{ user.department || '-' }}</span>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between">
              <span class="crm-pill" :class="user.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'">
                {{ user.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động' }}
              </span>

              <div class="flex gap-2">
                <button class="crm-mini-btn crm-mini-btn-secondary" @click="openEdit(user)">
                  Sửa
                </button>
                <button class="crm-mini-btn crm-mini-btn-warning" @click="toggleStatus(user)">
                  {{ user.is_active ? 'Khóa' : 'Mở' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!users.length" class="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          Chưa có người dùng
        </div>
      </section>

      <UserFormModal
        v-model="showUserModal"
        :user="selectedUser"
        @saved="fetchUsers"
      />
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import MainLayout from '../../layouts/MainLayout.vue'
import UserFormModal from '../../components/users/UserFormModal.vue'
import { getUsersApi, toggleUserStatusApi } from '../../api/users'

const users = ref([])
const showUserModal = ref(false)
const selectedUser = ref(null)
const showFilters = ref(false)

const filters = reactive({
  keyword: '',
  role: '',
  active: '',
})

const fetchUsers = async () => {
  const { data } = await getUsersApi({
    keyword: filters.keyword || undefined,
    role: filters.role || undefined,
    active: filters.active || undefined,
    per_page: 200,
  })

  users.value = data.data || []
}

const resetFilters = async () => {
  filters.keyword = ''
  filters.role = ''
  filters.active = ''
  await fetchUsers()
}

const openCreate = () => {
  selectedUser.value = null
  showUserModal.value = true
}

const openEdit = (user) => {
  selectedUser.value = { ...user }
  showUserModal.value = true
}

const toggleStatus = async (user) => {
  await toggleUserStatusApi(user.id)
  await fetchUsers()
}

const getInitials = (name) => {
  return (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join('')
}

const roleLabel = (role) => {
  const map = {
    admin: 'Admin',
    leader: 'Leader',
    sale: 'Sale',
    accountant: 'Kế toán',
  }
  return map[role] || role
}

const roleBadgeClass = (role) => {
  const map = {
    admin: 'bg-rose-100 text-rose-700',
    leader: 'bg-violet-100 text-violet-700',
    sale: 'bg-blue-100 text-blue-700',
    accountant: 'bg-emerald-100 text-emerald-700',
  }
  return map[role] || 'bg-slate-100 text-slate-700'
}

onMounted(fetchUsers)
</script>

<style scoped>
.crm-btn {
  height: 42px;
  border-radius: 14px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
}

.crm-btn-primary {
  background: #0f172a;
  color: white;
  border: 1px solid #0f172a;
}

.crm-btn-secondary {
  background: white;
  color: #334155;
  border: 1px solid #d7e0ea;
}

.crm-input {
  width: 100%;
  height: 44px;
  border-radius: 14px;
  border: 1px solid #d7e0ea;
  background: #fff;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
}

.crm-user-enterprise-card {
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: white;
  padding: 18px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.crm-user-avatar {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  background: linear-gradient(180deg, #0f172a, #1e293b);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}

.crm-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
}

.crm-meta-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 10px 12px;
  color: #0f172a;
}

.crm-meta-label {
  font-size: 12px;
  color: #64748b;
}

.crm-mini-btn {
  height: 34px;
  border-radius: 12px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
}

.crm-mini-btn-secondary {
  border: 1px solid #d7e0ea;
  background: white;
  color: #334155;
}

.crm-mini-btn-warning {
  border: 1px solid #fed7aa;
  background: #fff7ed;
  color: #c2410c;
}
</style>