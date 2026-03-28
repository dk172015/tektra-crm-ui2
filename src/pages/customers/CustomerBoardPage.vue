<template>
  <MainLayout>
    <div class="flex h-full min-w-0 flex-col">
      <!-- Toolbar -->
      <div class="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h1 class="text-lg font-bold text-slate-900">Quản lý khách hàng</h1>
            <p class="text-sm text-slate-500">Pipeline chăm sóc khách thuê văn phòng</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <router-link
              to="/customers/create"
              class="crm-top-action crm-top-action-primary"
            >
              + Thêm khách hàng
            </router-link>

            <router-link
              v-if="auth.isAdmin"
              to="/users"
              class="crm-top-action crm-top-action-secondary"
            >
              Quản lý sale
            </router-link>
          </div>
        </div>

        <div class="crm-filter-grid">
          <input
            v-model="filters.keyword"
            class="crm-filter-input"
            placeholder="Tìm tên, SĐT, email..."
            @keyup.enter="fetchCustomers"
          />

          <select
            v-model="filters.lead_source_id"
            class="crm-filter-input"
          >
            <option value="">Tất cả nguồn</option>
            <option v-for="item in leadSources" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>

          <select
            v-model="filters.status"
            class="crm-filter-input"
          >
            <option value="">Tất cả trạng thái</option>
            <option v-for="item in stages" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>

          <select
            v-if="auth.isAdmin"
            v-model="filters.sale_user_id"
            class="crm-filter-input"
          >
            <option value="">Tất cả sale</option>
            <option v-for="item in sales" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>

          <input
            v-model="filters.date_from"
            type="date"
            class="crm-filter-input"
          />

          <input
            v-model="filters.date_to"
            type="date"
            class="crm-filter-input"
          />

          <button class="crm-filter-btn crm-filter-btn-primary" @click="fetchCustomers">
            Lọc
          </button>

          <button class="crm-filter-btn crm-filter-btn-secondary" @click="resetFilters">
            Xóa
          </button>
        </div>
      </div>

      <!-- Board -->
      <div class="crm-board-scroll min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div class="flex h-full min-w-max pr-2">
          <div
            v-for="(stage, index) in stages"
            :key="stage.value"
            class="kanban-column relative flex h-full w-[280px] shrink-0 flex-col bg-slate-50 transition-colors duration-150 xl:w-[295px] 2xl:w-[310px]"
            :class="[
              index === 0 ? 'rounded-l-2xl border-l border-slate-200' : '-ml-[14px]',
              index === stages.length - 1 ? 'rounded-r-2xl border-r border-slate-200' : '',
              dragOverStatus === stage.value ? 'bg-slate-100/80' : '',
            ]"
          >
            <div
              class="relative h-[64px] border-b border-slate-200"
              :class="[
                index === 0 ? 'rounded-tl-2xl' : '',
                index === stages.length - 1 ? 'rounded-tr-2xl overflow-hidden' : '',
              ]"
            >
              <div
                class="relative z-10 h-full px-4 py-3"
                :class="[
                  stage.headerClass,
                  index !== 0 ? 'pl-8' : '',
                  dragOverStatus === stage.value ? stage.headerActiveClass : '',
                ]"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="truncate text-[12px] font-semibold uppercase tracking-[0.08em]">
                      {{ stage.label }}
                    </div>
                    <div class="mt-1 text-[11px] opacity-80">
                      {{ board[stage.value]?.length || 0 }} khách hàng
                    </div>
                  </div>

                  <span
                    class="rounded-full px-2 py-1 text-[10px] font-semibold"
                    :class="stage.counterClass"
                  >
                    {{ board[stage.value]?.length || 0 }}
                  </span>
                </div>
              </div>

              <div
                v-if="index !== stages.length - 1"
                class="absolute right-[-14px] top-0 z-20 h-full w-[28px]"
                :class="dragOverStatus === stage.value ? stage.rightChevronActiveClass : stage.rightChevronClass"
              ></div>
            </div>

            <div class="min-h-0 flex-1 border-b border-slate-200 p-2">
              <draggable
                v-model="board[stage.value]"
                group="customers"
                item-key="id"
                class="kanban-dropzone h-full min-h-[320px] space-y-2 rounded-xl"
                ghost-class="kanban-ghost"
                chosen-class="kanban-chosen"
                drag-class="kanban-drag"
                :animation="140"
                :empty-insert-threshold="160"
                :fallback-on-body="true"
                :swap-threshold="0.55"
                :move="(evt) => handleMove(evt, stage.value)"
                @start="onDragStart(stage.value)"
                @end="onDragEnd"
                @add="(evt) => onCardAdded(evt, stage.value)"
              >
                <template #item="{ element }">
                  <div
                    class="cursor-pointer rounded-xl border p-3 shadow-sm transition duration-150 hover:-translate-y-[1px] hover:shadow-md"
                    :class="[warningCardClass(element), priorityCardClass(element)]"
                    @click="goDetail(element.id)"
                  >
                    <div class="mb-2 flex items-start justify-between gap-2">
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-[13px] font-semibold leading-5 text-slate-900">
                          {{ element.company_name || element.contact_name }}
                        </div>
                        <div class="truncate text-[11px] leading-4 text-slate-500">
                          {{ element.contact_name }}
                        </div>
                      </div>

                      <div class="flex shrink-0 items-center gap-1.5">
                        <button
                          class="inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] transition"
                          :class="element.is_priority
                            ? 'border-amber-300 bg-amber-100 text-amber-700'
                            : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'"
                          @click.stop="handleTogglePriority(element)"
                          :title="element.is_priority ? 'Bỏ đánh dấu ưu tiên' : 'Đánh dấu ưu tiên'"
                        >
                          ⚑
                        </button>

                        <span
                          class="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200"
                        >
                          {{ element.id }}
                        </span>
                      </div>
                    </div>

                    <div v-if="element.is_priority" class="mb-2">
                      <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Ưu tiên theo dõi
                      </span>
                    </div>

                    <div
                      v-if="element.warning_level"
                      class="mb-2 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold"
                      :class="warningBadgeClass(element.warning_level)"
                    >
                      {{ warningText(element) }}
                    </div>

                    <div class="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] leading-4">
                      <div class="crm-meta-item">
                        <span class="crm-meta-label">ĐT</span>
                        <span class="truncate">{{ element.phone || '-' }}</span>
                      </div>

                      <div class="crm-meta-item">
                        <span class="crm-meta-label">Nguồn</span>
                        <span class="truncate">{{ element.lead_source?.name || '-' }}</span>
                      </div>

                      <div class="crm-meta-item">
                        <span class="crm-meta-label">KV</span>
                        <span class="truncate">{{ element.requirement?.preferred_location || '-' }}</span>
                      </div>

                      <div class="crm-meta-item">
                        <span class="crm-meta-label">DT</span>
                        <span class="truncate">
                          {{ element.requirement?.area_min || '-' }} - {{ element.requirement?.area_max || '-' }}m²
                        </span>
                      </div>

                      <div class="crm-meta-item col-span-2">
                        <span class="crm-meta-label">NS</span>
                        <span class="truncate">
                          {{ formatBudget(element.requirement?.budget_min) }} - {{ formatBudget(element.requirement?.budget_max) }}
                        </span>
                      </div>
                    </div>

                    <div class="mt-2 flex flex-wrap gap-1">
                      <span
                        v-for="(user, idx) in element.assigned_users || []"
                        :key="user.id"
                        class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        :class="idx === 0
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700'"
                      >
                        {{ user.name }}
                      </span>
                    </div>

                    <div
                      class="mt-2 rounded-lg px-2.5 py-2 text-[11px] leading-4"
                      :class="element.warning_level
                        ? noteWarningClass(element.warning_level)
                        : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80'"
                      :title="element.latest_activity?.content || 'Chưa có ghi chú'"
                    >
                      {{ element.latest_activity?.content || 'Chưa có ghi chú' }}
                    </div>

                    <div class="mt-1 flex items-center justify-between gap-2 text-[10px] leading-4 text-slate-400">
                      <div class="truncate">
                        <span v-if="element.latest_activity?.user?.name">
                          {{ element.latest_activity.user.name }}
                        </span>
                        <span v-if="element.latest_activity?.activity_time">
                          - {{ formatDate(element.latest_activity.activity_time) }}
                        </span>
                      </div>

                      <span v-if="savingIds.has(element.id)" class="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                        Đang lưu
                      </span>
                    </div>

                    <div class="mt-2 border-t border-slate-200 pt-2">
                      <div class="mb-2 text-[10px] text-slate-400">
                        {{ formatDate(element.created_at) }}
                      </div>

                      <div class="flex flex-wrap items-center gap-1.5">
                        <button
                          class="crm-action-btn crm-action-primary"
                          @click.stop="goDetail(element.id)"
                        >
                          Chi tiết
                        </button>

                        <button
                          class="crm-action-btn crm-action-success"
                          @click.stop="openQuickNoteModal(element)"
                        >
                          Ghi chú
                        </button>

                        <button
                          v-if="auth.isAdmin"
                          class="crm-action-btn crm-action-neutral"
                          @click.stop="openAssignModal(element)"
                        >
                          Sale
                        </button>
                      </div>
                    </div>
                  </div>
                </template>

                <template #footer>
                  <div
                    v-if="!board[stage.value]?.length"
                    class="flex h-full min-h-[140px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Kéo khách vào đây
                  </div>
                </template>
              </draggable>
            </div>
          </div>
        </div>
      </div>

      <AssignSalesModal
        v-model="showAssignModal"
        :customer="selectedCustomer"
        @saved="handleAssignSaved"
      />

      <QuickNoteModal
        v-model="showQuickNoteModal"
        :customer="selectedCustomer"
        @saved="handleQuickNoteSaved"
      />

      <div
        v-if="moveConfirm.open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      >
        <div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-slate-900">Xác nhận chuyển giai đoạn</h3>
            <p class="mt-1 text-sm text-slate-500">
              Vui lòng xác nhận trước khi cập nhật trạng thái khách hàng.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="mb-2 text-sm font-medium text-slate-800">
              {{ moveConfirm.customerName || 'Khách hàng' }}
            </div>
            <div class="text-sm text-slate-600">
              Từ <span class="font-medium text-slate-900">{{ moveConfirm.fromLabel }}</span>
              sang
              <span class="font-medium text-slate-900">{{ moveConfirm.toLabel }}</span>
            </div>
          </div>

          <div class="mt-5 flex justify-end gap-3">
            <button
              class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              @click="cancelMoveConfirm"
            >
              Hủy
            </button>

            <button
              class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              :disabled="moveConfirm.loading"
              @click="confirmMoveStage"
            >
              {{ moveConfirm.loading ? 'Đang cập nhật...' : 'Xác nhận chuyển' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import draggable from 'vuedraggable'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../layouts/MainLayout.vue'
import AssignSalesModal from '../../components/customers/AssignSalesModal.vue'
import QuickNoteModal from '../../components/customers/QuickNoteModal.vue'
import { getCustomersApi, updateCustomerStatusApi, togglePriorityApi } from '../../api/customers'
import { getLeadSourcesApi } from '../../api/leadSources'
import { getUsersApi } from '../../api/users'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const leadSources = ref([])
const sales = ref([])
const savingIds = ref(new Set())
const showAssignModal = ref(false)
const showQuickNoteModal = ref(false)
const selectedCustomer = ref(null)
const dragOverStatus = ref('')
const draggingFromStatus = ref('')

const stageOrder = ['new', 'consulting', 'viewing', 'negotiating', 'deposit', 'contracted', 'lost']

const moveConfirm = reactive({
  open: false,
  loading: false,
  customerId: null,
  customerName: '',
  fromStatus: '',
  toStatus: '',
  fromLabel: '',
  toLabel: '',
})

const filters = reactive({
  keyword: '',
  lead_source_id: '',
  status: '',
  sale_user_id: '',
  date_from: '',
  date_to: '',
})

const stages = [
  {
    value: 'new',
    label: 'Xác định khách hàng',
    headerClass: 'bg-slate-100 text-slate-700',
    headerActiveClass: 'bg-slate-200 text-slate-800',
    rightChevronClass: 'chevron-slate',
    rightChevronActiveClass: 'chevron-slate-active',
    counterClass: 'bg-white text-slate-700',
  },
  {
    value: 'consulting',
    label: 'Tiếp cận khách hàng',
    headerClass: 'bg-blue-700 text-white',
    headerActiveClass: 'bg-blue-800 text-white',
    rightChevronClass: 'chevron-blue',
    rightChevronActiveClass: 'chevron-blue-active',
    counterClass: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'viewing',
    label: 'Dẫn đi xem',
    headerClass: 'bg-cyan-700 text-white',
    headerActiveClass: 'bg-cyan-800 text-white',
    rightChevronClass: 'chevron-cyan',
    rightChevronActiveClass: 'chevron-cyan-active',
    counterClass: 'bg-cyan-100 text-cyan-700',
  },
  {
    value: 'negotiating',
    label: 'Đàm phán',
    headerClass: 'bg-amber-600 text-white',
    headerActiveClass: 'bg-amber-700 text-white',
    rightChevronClass: 'chevron-amber',
    rightChevronActiveClass: 'chevron-amber-active',
    counterClass: 'bg-amber-100 text-amber-700',
  },
  {
    value: 'deposit',
    label: 'Đặt cọc',
    headerClass: 'bg-orange-600 text-white',
    headerActiveClass: 'bg-orange-700 text-white',
    rightChevronClass: 'chevron-orange',
    rightChevronActiveClass: 'chevron-orange-active',
    counterClass: 'bg-orange-100 text-orange-700',
  },
  {
    value: 'contracted',
    label: 'Ký hợp đồng',
    headerClass: 'bg-green-700 text-white',
    headerActiveClass: 'bg-green-800 text-white',
    rightChevronClass: 'chevron-green',
    rightChevronActiveClass: 'chevron-green-active',
    counterClass: 'bg-green-100 text-green-700',
  },
  {
    value: 'lost',
    label: 'Không thành công',
    headerClass: 'bg-rose-700 text-white',
    headerActiveClass: 'bg-rose-800 text-white',
    rightChevronClass: 'chevron-rose',
    rightChevronActiveClass: 'chevron-rose-active',
    counterClass: 'bg-rose-100 text-rose-700',
  },
]

const board = reactive({
  new: [],
  consulting: [],
  viewing: [],
  negotiating: [],
  deposit: [],
  contracted: [],
  lost: [],
})

const clearBoard = () => {
  Object.keys(board).forEach((key) => {
    board[key] = []
  })
}

const fillBoard = (items) => {
  clearBoard()

  items.forEach((item) => {
    const status = item.status || 'new'
    if (!board[status]) board[status] = []
    board[status].push(item)
  })
}

const getStageIndex = (status) => stageOrder.indexOf(status)

const canMoveToStage = (fromStatus, toStatus) => {
  if (auth.isAdmin) return true

  const fromIndex = getStageIndex(fromStatus)
  const toIndex = getStageIndex(toStatus)

  if (fromIndex === -1 || toIndex === -1) return false

  return toIndex >= fromIndex
}

const getStageLabel = (status) => stages.find((x) => x.value === status)?.label || status

const fetchCustomers = async () => {
  const params = {
    keyword: filters.keyword || undefined,
    lead_source_id: filters.lead_source_id || undefined,
    status: filters.status || undefined,
    sale_user_id: auth.isAdmin ? (filters.sale_user_id || undefined) : undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
    per_page: 500,
  }

  const { data } = await getCustomersApi(params)
  fillBoard(data.data || [])
}

const fetchLeadSources = async () => {
  const { data } = await getLeadSourcesApi()
  leadSources.value = data
}

const fetchSales = async () => {
  const { data } = await getUsersApi({ role: 'sale', active: 1, per_page: 200 })
  sales.value = data.data || []
}

const onDragStart = (status) => {
  draggingFromStatus.value = status
}

const onDragEnd = () => {
  dragOverStatus.value = ''
  draggingFromStatus.value = ''
}

const handleMove = (evt, targetStatus) => {
  const draggedItem = evt?.draggedContext?.element
  if (!draggedItem) return true

  if (auth.isAdmin) return true

  return canMoveToStage(draggedItem.status, targetStatus)
}

const openMoveConfirm = (customer, fromStatus, toStatus) => {
  moveConfirm.open = true
  moveConfirm.loading = false
  moveConfirm.customerId = customer.id
  moveConfirm.customerName = customer.company_name || customer.contact_name || `Khách #${customer.id}`
  moveConfirm.fromStatus = fromStatus
  moveConfirm.toStatus = toStatus
  moveConfirm.fromLabel = getStageLabel(fromStatus)
  moveConfirm.toLabel = getStageLabel(toStatus)
}

const cancelMoveConfirm = async () => {
  moveConfirm.open = false
  moveConfirm.loading = false
  moveConfirm.customerId = null
  moveConfirm.customerName = ''
  moveConfirm.fromStatus = ''
  moveConfirm.toStatus = ''
  moveConfirm.fromLabel = ''
  moveConfirm.toLabel = ''
  await fetchCustomers()
}

const confirmMoveStage = async () => {
  if (!moveConfirm.customerId || !moveConfirm.toStatus) return

  moveConfirm.loading = true
  savingIds.value.add(moveConfirm.customerId)

  try {
    await updateCustomerStatusApi(moveConfirm.customerId, { status: moveConfirm.toStatus })
    await fetchCustomers()
    moveConfirm.open = false
    moveConfirm.loading = false
    moveConfirm.customerId = null
    moveConfirm.customerName = ''
    moveConfirm.fromStatus = ''
    moveConfirm.toStatus = ''
    moveConfirm.fromLabel = ''
    moveConfirm.toLabel = ''
  } catch (error) {
    await fetchCustomers()
    moveConfirm.loading = false
  } finally {
    savingIds.value.delete(moveConfirm.customerId)
    dragOverStatus.value = ''
    draggingFromStatus.value = ''
  }
}

const onCardAdded = async (evt, newStatus) => {
  dragOverStatus.value = newStatus

  const movedItem = evt?.item?._underlying_vm_ || board[newStatus]?.[evt.newIndex]

  if (!movedItem) {
    dragOverStatus.value = ''
    draggingFromStatus.value = ''
    return
  }

  const oldStatus = movedItem.status

  if (oldStatus === newStatus) {
    dragOverStatus.value = ''
    draggingFromStatus.value = ''
    return
  }

  if (!canMoveToStage(oldStatus, newStatus)) {
    await fetchCustomers()
    dragOverStatus.value = ''
    draggingFromStatus.value = ''
    window.alert('Bạn không có quyền chuyển khách hàng ngược về giai đoạn trước.')
    return
  }

  openMoveConfirm(movedItem, oldStatus, newStatus)
}

const handleTogglePriority = async (customer) => {
  const oldValue = customer.is_priority
  customer.is_priority = !oldValue

  try {
    await togglePriorityApi(customer.id)
    await fetchCustomers()
  } catch (error) {
    customer.is_priority = oldValue
  }
}

const goDetail = (id) => {
  router.push(`/customers/${id}`)
}

const openAssignModal = (customer) => {
  selectedCustomer.value = customer
  showAssignModal.value = true
}

const openQuickNoteModal = (customer) => {
  selectedCustomer.value = customer
  showQuickNoteModal.value = true
}

const handleAssignSaved = async () => {
  await fetchCustomers()
}

const handleQuickNoteSaved = async () => {
  await fetchCustomers()
}

const resetFilters = async () => {
  filters.keyword = ''
  filters.lead_source_id = ''
  filters.status = ''
  filters.sale_user_id = ''
  filters.date_from = ''
  filters.date_to = ''
  await fetchCustomers()
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('vi-VN')
}

const formatBudget = (value) => {
  if (!value) return '-'
  return new Intl.NumberFormat('vi-VN').format(value)
}

const warningCardClass = (item) => {
  if (item.warning_level === 'red') {
    return 'border-red-200 bg-red-50/75 ring-1 ring-red-100 hover:border-red-300'
  }

  if (item.warning_level === 'yellow') {
    return 'border-amber-200 bg-amber-50/75 ring-1 ring-amber-100 hover:border-amber-300'
  }

  return 'border-slate-200 bg-white hover:border-slate-300'
}

const priorityCardClass = (item) => {
  if (item.is_priority) {
    return 'ring-2 ring-amber-200 border-amber-300'
  }
  return ''
}

const warningBadgeClass = (level) => {
  if (level === 'red') {
    return 'bg-red-100 text-red-700'
  }

  if (level === 'yellow') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-slate-100 text-slate-700'
}

const noteWarningClass = (level) => {
  if (level === 'red') {
    return 'bg-red-100/70 text-red-800 ring-1 ring-red-200'
  }

  if (level === 'yellow') {
    return 'bg-amber-100/70 text-amber-800 ring-1 ring-amber-200'
  }

  return 'bg-slate-50 text-slate-600'
}

const warningText = (item) => {
  const days = item.warning_days || 0

  if (item.warning_level === 'red') {
    return `${days} ngày chưa cập nhật trạng thái / ghi chú`
  }

  if (item.warning_level === 'yellow') {
    return `${days} ngày cần theo dõi khách`
  }

  return ''
}

onMounted(async () => {
  await Promise.all([fetchCustomers(), fetchLeadSources(), ...(auth.isAdmin ? [fetchSales()] : [])])
})
</script>

<style scoped>
.crm-filter-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 10px;
}

.crm-filter-input {
  height: 40px;
  border-radius: 14px;
  border: 1px solid #d7e0ea;
  background: #fff;
  padding: 0 14px;
  font-size: 14px;
  color: #0f172a;
  outline: none;
  transition: all 0.18s ease;
}

.crm-filter-input:focus {
  border-color: #94a3b8;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.12);
}

.crm-filter-btn,
.crm-top-action {
  height: 40px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  padding: 0 16px;
  transition: all 0.18s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.crm-filter-btn-primary,
.crm-top-action-primary {
  background: #0f172a;
  color: white;
  border: 1px solid #0f172a;
}

.crm-filter-btn-primary:hover,
.crm-top-action-primary:hover {
  background: #1e293b;
}

.crm-filter-btn-secondary,
.crm-top-action-secondary {
  background: #fff;
  color: #334155;
  border: 1px solid #d7e0ea;
}

.crm-filter-btn-secondary:hover,
.crm-top-action-secondary:hover {
  background: #f8fafc;
}

.crm-board-scroll {
  scroll-behavior: smooth;
}

.crm-board-scroll::-webkit-scrollbar {
  height: 10px;
}

.crm-board-scroll::-webkit-scrollbar-track {
  background: #e2e8f0;
  border-radius: 999px;
}

.crm-board-scroll::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 999px;
}

.kanban-column:hover {
  background-color: #f8fafc;
}

.kanban-dropzone {
  transition: background-color 0.18s ease;
}

.kanban-dropzone:hover {
  background-color: rgba(255, 255, 255, 0.22);
}

:deep(.kanban-ghost) {
  opacity: 0.45;
  transform: rotate(1deg);
}

:deep(.kanban-chosen) {
  cursor: grabbing !important;
}

:deep(.kanban-drag) {
  transform: scale(1.01);
}

.crm-meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 0.375rem;
  background: rgb(248 250 252);
  padding: 0.25rem 0.5rem;
  color: rgb(51 65 85);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.35);
  min-width: 0;
}

.crm-meta-label {
  flex-shrink: 0;
  font-weight: 500;
  color: rgb(100 116 139);
}

.crm-action-btn {
  display: inline-flex;
  height: 1.75rem;
  align-items: center;
  border-radius: 0.375rem;
  padding: 0 0.625rem;
  font-size: 10px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.crm-action-primary {
  border: 1px solid rgb(191 219 254);
  background: rgb(239 246 255);
  color: rgb(29 78 216);
}

.crm-action-primary:hover {
  background: rgb(219 234 254);
}

.crm-action-success {
  border: 1px solid rgb(167 243 208);
  background: rgb(236 253 245);
  color: rgb(4 120 87);
}

.crm-action-success:hover {
  background: rgb(209 250 229);
}

.crm-action-neutral {
  border: 1px solid rgb(226 232 240);
  background: rgb(248 250 252);
  color: rgb(51 65 85);
}

.crm-action-neutral:hover {
  background: rgb(241 245 249);
}

.chevron-slate,
.chevron-slate-active,
.chevron-blue,
.chevron-blue-active,
.chevron-cyan,
.chevron-cyan-active,
.chevron-amber,
.chevron-amber-active,
.chevron-orange,
.chevron-orange-active,
.chevron-green,
.chevron-green-active,
.chevron-rose,
.chevron-rose-active {
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.chevron-slate {
  background: #f1f5f9;
}
.chevron-slate-active {
  background: #e2e8f0;
}

.chevron-blue {
  background: #1d4ed8;
}
.chevron-blue-active {
  background: #1e40af;
}

.chevron-cyan {
  background: #0e7490;
}
.chevron-cyan-active {
  background: #155e75;
}

.chevron-amber {
  background: #d97706;
}
.chevron-amber-active {
  background: #b45309;
}

.chevron-orange {
  background: #ea580c;
}
.chevron-orange-active {
  background: #c2410c;
}

.chevron-green {
  background: #15803d;
}
.chevron-green-active {
  background: #166534;
}

.chevron-rose {
  background: #be123c;
}
.chevron-rose-active {
  background: #9f1239;
}

@media (max-width: 1536px) {
  .crm-filter-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .crm-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .crm-filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>