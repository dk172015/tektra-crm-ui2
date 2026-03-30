<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl">
      <section class="crm-profile-hero">
        <div class="crm-profile-hero-left">
          <div class="crm-profile-avatar">
            <img
              v-if="previewUrl || profile.avatar"
              :src="previewUrl || profile.avatar"
              alt="avatar"
              class="h-full w-full rounded-[26px] object-cover"
            />
            <span v-else>{{ initials }}</span>
          </div>

          <div class="min-w-0">
            <h1 class="truncate text-2xl font-bold text-slate-900">
              {{ profile.name || 'Hồ sơ cá nhân' }}
            </h1>
            <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>{{ profile.email || '-' }}</span>
              <span>{{ profile.phone || '-' }}</span>
              <span>{{ roleLabel(profile.role) }}</span>
              <span>{{ profile.department || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="crm-profile-hero-right">
          <button class="crm-btn crm-btn-secondary" @click="avatarInputRef?.click()">
            Đổi ảnh
          </button>
          <button v-if="previewUrl || profile.avatar" class="crm-btn crm-btn-danger" @click="removeAvatar">
            Xóa ảnh
          </button>
        </div>
      </section>

      <input
        ref="avatarInputRef"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        class="hidden"
        @change="handleAvatarChange"
      />

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div class="xl:col-span-7">
          <section class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Thông tin cá nhân</h2>
                <p class="crm-panel-subtitle">Cập nhật hồ sơ nhân viên</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input v-model="form.name" class="crm-input" placeholder="Họ tên" />
              <input :value="profile.email || ''" class="crm-input bg-slate-50" disabled />

              <input v-model="form.phone" class="crm-input" placeholder="Số điện thoại" />
              <input :value="profile.employee_code || ''" class="crm-input bg-slate-50" disabled />

              <input v-model="form.job_title" class="crm-input" placeholder="Chức danh" />
              <input v-model="form.department" class="crm-input" placeholder="Phòng ban" />

              <select v-model="form.gender" class="crm-input">
                <option value="">Giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>

              <input v-model="form.date_of_birth" type="date" class="crm-input" />

              <input v-model="form.address" class="crm-input md:col-span-2" placeholder="Địa chỉ" />
            </div>

            <div v-if="profileError" class="crm-form-error mt-4">
              {{ profileError }}
            </div>

            <div class="mt-6 flex justify-end">
              <button class="crm-btn crm-btn-primary" :disabled="profileLoading" @click="saveProfile">
                {{ profileLoading ? 'Đang lưu...' : 'Lưu hồ sơ' }}
              </button>
            </div>
          </section>
        </div>

        <div class="xl:col-span-5">
          <section class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Đổi mật khẩu</h2>
                <p class="crm-panel-subtitle">Bảo mật tài khoản của bạn</p>
              </div>
            </div>

            <div class="space-y-4">
              <input
                v-model="passwordForm.current_password"
                type="password"
                class="crm-input"
                placeholder="Mật khẩu hiện tại"
              />

              <input
                v-model="passwordForm.new_password"
                type="password"
                class="crm-input"
                placeholder="Mật khẩu mới"
              />

              <input
                v-model="passwordForm.new_password_confirmation"
                type="password"
                class="crm-input"
                placeholder="Xác nhận mật khẩu mới"
              />
            </div>

            <div v-if="passwordError" class="crm-form-error mt-4">
              {{ passwordError }}
            </div>

            <div class="mt-6 flex justify-end">
              <button class="crm-btn crm-btn-secondary" :disabled="passwordLoading" @click="changePassword">
                {{ passwordLoading ? 'Đang đổi...' : 'Đổi mật khẩu' }}
              </button>
            </div>
          </section>

          <section class="crm-panel mt-4">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Thông tin hệ thống</h2>
                <p class="crm-panel-subtitle">Thông tin tài khoản nội bộ</p>
              </div>
            </div>

            <div class="crm-info-list">
              <div class="crm-info-row">
                <span class="crm-info-label">Vai trò</span>
                <span class="crm-info-value">{{ roleLabel(profile.role) }}</span>
              </div>

              <div class="crm-info-row">
                <span class="crm-info-label">Trạng thái</span>
                <span class="crm-info-value">
                  {{ profile.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động' }}
                </span>
              </div>

              <div class="crm-info-row">
                <span class="crm-info-label">Email</span>
                <span class="crm-info-value">{{ profile.email || '-' }}</span>
              </div>

              <div class="crm-info-row">
                <span class="crm-info-label">Mã nhân viên</span>
                <span class="crm-info-value">{{ profile.employee_code || '-' }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MainLayout from '../../layouts/MainLayout.vue'
import { getProfileApi, updateProfileApi } from '../../api/users'

const profile = ref({})
const avatarInputRef = ref(null)
const avatarFile = ref(null)
const previewUrl = ref('')
const removeAvatarFlag = ref(false)

const profileLoading = ref(false)
const passwordLoading = ref(false)
const profileError = ref('')
const passwordError = ref('')

const form = reactive({
  name: '',
  phone: '',
  job_title: '',
  department: '',
  gender: '',
  date_of_birth: '',
  address: '',
})

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
})

const initials = computed(() => {
  return (form.name || profile.value.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join('')
})

const roleLabel = (role) => {
  const map = {
    admin: 'Admin',
    leader: 'Leader',
    sale: 'Sale',
    accountant: 'Kế toán',
  }
  return map[role] || role || '-'
}

const fillForm = (data) => {
  form.name = data.name || ''
  form.phone = data.phone || ''
  form.job_title = data.job_title || ''
  form.department = data.department || ''
  form.gender = data.gender || ''
  form.date_of_birth = data.date_of_birth || ''
  form.address = data.address || ''
}

const fetchProfile = async () => {
  const { data } = await getProfileApi()
  profile.value = data
  fillForm(data)
  previewUrl.value = ''
  avatarFile.value = null
  removeAvatarFlag.value = false
}

const handleAvatarChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  avatarFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  removeAvatarFlag.value = false
}

const removeAvatar = () => {
  avatarFile.value = null
  previewUrl.value = ''
  removeAvatarFlag.value = true
  if (avatarInputRef.value) avatarInputRef.value.value = ''
}

const buildProfilePayload = (includePassword = false) => {
  const payload = new FormData()
  payload.append('name', form.name)
  if (form.phone) payload.append('phone', form.phone)
  if (form.job_title) payload.append('job_title', form.job_title)
  if (form.department) payload.append('department', form.department)
  if (form.gender) payload.append('gender', form.gender)
  if (form.date_of_birth) payload.append('date_of_birth', form.date_of_birth)
  if (form.address) payload.append('address', form.address)
  if (avatarFile.value) payload.append('avatar_file', avatarFile.value)
  if (removeAvatarFlag.value) payload.append('remove_avatar', '1')

  if (includePassword) {
    payload.append('current_password', passwordForm.current_password)
    payload.append('new_password', passwordForm.new_password)
    payload.append('new_password_confirmation', passwordForm.new_password_confirmation)
  }

  return payload
}

const saveProfile = async () => {
  profileError.value = ''
  profileLoading.value = true

  try {
    await updateProfileApi(buildProfilePayload(false))
    await fetchProfile()
  } catch (error) {
    profileError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu hồ sơ'
  } finally {
    profileLoading.value = false
  }
}

const changePassword = async () => {
  passwordError.value = ''

  if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.new_password_confirmation) {
    passwordError.value = 'Vui lòng nhập đầy đủ thông tin đổi mật khẩu.'
    return
  }

  passwordLoading.value = true

  try {
    await updateProfileApi(buildProfilePayload(true))
    passwordForm.current_password = ''
    passwordForm.new_password = ''
    passwordForm.new_password_confirmation = ''
  } catch (error) {
    passwordError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể đổi mật khẩu'
  } finally {
    passwordLoading.value = false
  }
}

onMounted(fetchProfile)
</script>

<style scoped>
.crm-profile-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 22px;
  margin-bottom: 16px;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.crm-profile-hero-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.crm-profile-avatar {
  width: 96px;
  height: 96px;
  border-radius: 26px;
  background: linear-gradient(180deg, #0f172a, #1e293b);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}

.crm-profile-hero-right {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
}

.crm-panel {
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: white;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
}

.crm-panel-header {
  margin-bottom: 16px;
}

.crm-panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.crm-panel-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-top: 2px;
}

.crm-input {
  width: 100%;
  height: 46px;
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

.crm-btn-danger {
  background: #fff;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.crm-form-error {
  border-radius: 14px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  padding: 12px 14px;
  font-size: 14px;
  color: #b91c1c;
}

.crm-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.crm-info-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.crm-info-label {
  font-size: 14px;
  color: #64748b;
}

.crm-info-value {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
  text-align: right;
}

@media (max-width: 900px) {
  .crm-profile-hero {
    flex-direction: column;
  }

  .crm-profile-hero-left {
    align-items: flex-start;
  }

  .crm-info-row {
    flex-direction: column;
  }

  .crm-info-value {
    text-align: left;
  }
}
</style>