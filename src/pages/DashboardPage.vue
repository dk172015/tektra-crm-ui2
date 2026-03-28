<template>
  <MainLayout>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="text-sm text-slate-500">Tổng khách hàng</div>
        <div class="mt-3 text-3xl font-bold">CRM</div>
      </div>

      <div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="text-sm text-slate-500">Quản lý sale</div>
        <div class="mt-3 text-3xl font-bold">Admin</div>
      </div>

      <div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div class="text-sm text-slate-500">Pipeline chăm sóc</div>
        <div class="mt-3 text-3xl font-bold">Board</div>
      </div>
    </div>

    <div class="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 class="text-xl font-semibold">Tổng quan</h2>
      <p class="mt-2 text-slate-500">
        Chặng 1 đã sẵn sàng: đăng nhập, quản lý sale, board khách hàng kéo thả, tạo khách, xem chi tiết khách.
      </p>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../layouts/MainLayout.vue'
</script>