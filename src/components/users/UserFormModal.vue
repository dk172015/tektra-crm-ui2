<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
    <div class="w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold text-slate-900">
            {{ form.id ? 'Cập nhật người dùng' : 'Tạo người dùng mới' }}
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            Quản lý hồ sơ nhân sự trong CRM
          </p>
        </div>

        <button class="crm-icon-close" @click="$emit('update:modelValue', false)">×</button>
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div class="xl:col-span-4">
          <div class="crm-form-panel">
            <div class="mb-4 text-sm font-semibold text-slate-900">Ảnh đại diện</div>

            <div class="flex flex-col items-center gap-4">
              <div class="crm-avatar-preview">
                <img
                  v-if="previewUrl"
                  :src="previewUrl"
                  alt="avatar"
                  class="h-full w-full rounded-[22px] object-cover"
                />
                <span v-else>{{ previewInitials }}</span>
              </div>

              <input
                ref="avatarInputRef"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                class="hidden"
                @change="handleAvatarChange"
              />

              <div class="flex flex-wrap justify-center gap-2">
                <button class="crm-btn crm-btn-secondary" @click="avatarInputRef?.click()">
                  Chọn ảnh
                </button>

                <button
                  v-if="previewUrl"
                  class="crm-btn crm-btn-danger"
                  @click="removeAvatar"
                >
                  Xóa ảnh
                </button>
              </div>

              <div class="w-full rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa 4MB.
              </div>
            </div>
          </div>
        </div>

        <div class="xl:col-span-8">
          <div class="crm-form-panel">
            <div class="mb-4 text-sm font-semibold text-slate-900">Thông tin tài khoản và hồ sơ</div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input v-model="form.name" class="crm-input" placeholder="Họ tên" />
              <input v-model="form.email" class="crm-input" placeholder="Email" />

              <input v-model="form.phone" class="crm-input" placeholder="Số điện thoại" />
              <input v-model="form.employee_code" class="crm-input" placeholder="Mã nhân viên" />

              <input v-model="form.job_title" class="crm-input" placeholder="Chức danh" />
              <input v-model="form.department" class="crm-input" placeholder="Phòng ban" />

              <select v-model="form.role" class="crm-input">
                <option value="sale">Sale</option>
                <option value="leader">Leader</option>
                <option value="accountant">Kế toán</option>
                <option value="admin">Admin</option>
              </select>

              <select v-model="form.gender" class="crm-input">
                <option value="">Giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>

              <input v-model="form.date_of_birth" type="date" class="crm-input" />
              <select v-model="form.is_active" class="crm-input">
                <option :value="true">Đang hoạt động</option>
                <option :value="false">Ngừng hoạt động</option>
              </select>

              <input
                v-model="form.password"
                type="password"
                class="crm-input md:col-span-2"
                :placeholder="form.id ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu đăng nhập'"
              />

              <input v-model="form.address" class="crm-input md:col-span-2" placeholder="Địa chỉ" />
            </div>

            <div v-if="errorMessage" class="crm-form-error mt-4">
              {{ errorMessage }}
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button class="crm-btn crm-btn-secondary" @click="$emit('update:modelValue', false)">
                Hủy
              </button>

              <button class="crm-btn crm-btn-primary" :disabled="loading" @click="submit">
                {{ loading ? 'Đang lưu...' : (form.id ? 'Cập nhật' : 'Tạo người dùng') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { createUserApi, updateUserApi } from '../../api/users'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const errorMessage = ref('')
const avatarInputRef = ref(null)
const avatarFile = ref(null)
const previewUrl = ref('')
const removeAvatarFlag = ref(false)

const form = reactive({
  id: null,
  name: '',
  email: '',
  password: '',
  phone: '',
  employee_code: '',
  job_title: '',
  department: '',
  gender: '',
  date_of_birth: '',
  address: '',
  role: 'sale',
  is_active: true,
})

const previewInitials = computed(() => {
  return (form.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join('')
})

const resetForm = () => {
  form.id = null
  form.name = ''
  form.email = ''
  form.password = ''
  form.phone = ''
  form.employee_code = ''
  form.job_title = ''
  form.department = ''
  form.gender = ''
  form.date_of_birth = ''
  form.address = ''
  form.role = 'sale'
  form.is_active = true
  errorMessage.value = ''
  avatarFile.value = null
  previewUrl.value = ''
  removeAvatarFlag.value = false
}

const fillForm = (user) => {
  form.id = user?.id || null
  form.name = user?.name || ''
  form.email = user?.email || ''
  form.password = ''
  form.phone = user?.phone || ''
  form.employee_code = user?.employee_code || ''
  form.job_title = user?.job_title || ''
  form.department = user?.department || ''
  form.gender = user?.gender || ''
  form.date_of_birth = user?.date_of_birth || ''
  form.address = user?.address || ''
  form.role = user?.role || 'sale'
  form.is_active = user?.is_active ?? true
  errorMessage.value = ''
  avatarFile.value = null
  previewUrl.value = user?.avatar || ''
  removeAvatarFlag.value = false
}

watch(
  () => props.modelValue,
  (val) => {
    if (!val) return
    if (props.user) fillForm(props.user)
    else resetForm()
  }
)

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

const buildPayload = () => {
  const payload = new FormData()
  payload.append('name', form.name)
  payload.append('email', form.email)
  if (form.password) payload.append('password', form.password)
  if (form.phone) payload.append('phone', form.phone)
  if (form.employee_code) payload.append('employee_code', form.employee_code)
  if (form.job_title) payload.append('job_title', form.job_title)
  if (form.department) payload.append('department', form.department)
  if (form.gender) payload.append('gender', form.gender)
  if (form.date_of_birth) payload.append('date_of_birth', form.date_of_birth)
  if (form.address) payload.append('address', form.address)
  payload.append('role', form.role)
  payload.append('is_active', form.is_active ? '1' : '0')
  if (avatarFile.value) payload.append('avatar_file', avatarFile.value)
  if (removeAvatarFlag.value) payload.append('remove_avatar', '1')
  return payload
}

const submit = async () => {
  errorMessage.value = ''

  if (!form.name.trim()) {
    errorMessage.value = 'Vui lòng nhập họ tên.'
    return
  }

  if (!form.email.trim()) {
    errorMessage.value = 'Vui lòng nhập email.'
    return
  }

  if (!form.id && !form.password.trim()) {
    errorMessage.value = 'Vui lòng nhập mật khẩu.'
    return
  }

  loading.value = true

  try {
    const payload = buildPayload()
    if (form.id) await updateUserApi(form.id, payload)
    else await createUserApi(payload)

    emit('saved')
    emit('update:modelValue', false)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu người dùng'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.crm-form-panel {
  border-radius: 22px;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 18px;
}

.crm-avatar-preview {
  width: 132px;
  height: 132px;
  border-radius: 22px;
  background: linear-gradient(180deg, #0f172a, #1e293b);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  overflow: hidden;
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

.crm-icon-close {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: white;
  font-size: 24px;
  line-height: 1;
}
</style>