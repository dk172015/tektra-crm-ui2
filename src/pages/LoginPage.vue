<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
    <div class="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
      <div class="hidden bg-slate-900 p-10 text-white lg:block">
        <div class="mb-6 text-sm uppercase tracking-[0.2em] text-slate-400">
          TektraHomes
        </div>
        <h1 class="text-4xl font-bold leading-tight">
          CRM quản lý khách thuê văn phòng
        </h1>
        <p class="mt-4 max-w-md text-slate-300">
          Theo dõi lead, phân công sale, cập nhật nhu cầu thuê, lịch đi xem và tình trạng chốt khách trong một hệ thống duy nhất.
        </p>

        <div class="mt-10 grid grid-cols-2 gap-4">
          <div class="rounded-2xl bg-slate-800/80 p-4">
            <div class="text-2xl font-bold">CRM</div>
            <div class="mt-2 text-sm text-slate-300">Quản lý khách hàng tập trung</div>
          </div>
          <div class="rounded-2xl bg-slate-800/80 p-4">
            <div class="text-2xl font-bold">Sales</div>
            <div class="mt-2 text-sm text-slate-300">Phân quyền theo admin và sale</div>
          </div>
        </div>
      </div>

      <div class="p-6 sm:p-10">
        <div class="mx-auto w-full max-w-md">
          <div class="mb-8">
            <h2 class="text-3xl font-bold text-slate-900">Đăng nhập</h2>
            <p class="mt-2 text-sm text-slate-500">
              Truy cập hệ thống Tektra CRM
            </p>
          </div>

          <form class="space-y-5" @submit.prevent="handleLogin">
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                v-model="form.email"
                type="email"
                class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                placeholder="admin@tektra.local"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">Mật khẩu</label>
              <input
                v-model="form.password"
                type="password"
                class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                placeholder="12345678"
              />
            </div>

            <div v-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {{ errorMessage }}
            </div>

            <button
              type="submit"
              class="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              :disabled="auth.loading"
            >
              {{ auth.loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
            </button>
          </form>

          <div class="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Demo:
            <div class="mt-2"><b>Admin:</b> admin@tektra.local / 12345678</div>
            <div><b>Sale:</b> sale1@tektra.local / 12345678</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const errorMessage = ref('')
const form = reactive({
  email: 'admin@tektra.local',
  password: '12345678',
})

const handleLogin = async () => {
  errorMessage.value = ''

  try {
    await auth.login(form)
    router.push('/dashboard')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      error.response?.data?.errors?.email?.[0] ||
      'Đăng nhập thất bại'
  }
}
</script>