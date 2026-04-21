<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MainLayout from '../../layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { getUsersApi } from '../../api/users'
import { getAssignmentStatusSummaryApi } from '../../api/assignment-status-report'

const auth = useAuthStore()
const isPrivileged = computed(() => ['admin', 'leader'].includes(auth.user?.role))

const saleOptions = ref([])
const rows = ref([])
const loading = ref(false)

const currentMonth = new Date().toISOString().slice(0, 7)

const filters = reactive({
  sale_id: '',
  keyword: '',
  type: '',
  customer_group: '',
  month: currentMonth,
})

const apiTotals = ref({
  self_found_total: 0,
  company_assigned_total: 0,
  current_main_total: 0,
  current_main_self_found: 0,
  current_main_company: 0,
  current_support_total: 0,
  transferred_out_total: 0,
  ever_assigned_total: 0,
})

const getMetricValue = (row, type) => {
  if (type === 'current_main') return Number(row.current_main_total || 0)
  if (type === 'current_support') return Number(row.current_support_total || 0)
  if (type === 'transferred_out') return Number(row.transferred_out_total || 0)
  return Number(row.ever_assigned_total || 0)
}

const getSourceValue = (row, source) => {
  if (source === 'self_found') return Number(row.self_found_total || 0)
  if (source === 'company_lead') return Number(row.company_assigned_total || 0)
  return Number(row.ever_assigned_total || 0)
}

const filteredRows = computed(() => {
  let data = [...rows.value]

  if (filters.sale_id) {
    data = data.filter(row => String(row.user_id) === String(filters.sale_id))
  }

  if (filters.keyword?.trim()) {
    const keyword = filters.keyword.trim().toLowerCase()
    data = data.filter(row => String(row.user_name || '').toLowerCase().includes(keyword))
  }

  if (filters.customer_group) {
    data = data.filter(row => getSourceValue(row, filters.customer_group) > 0)
  }

  if (filters.type) {
    data = data.filter(row => getMetricValue(row, filters.type) > 0)
  }

  return data
})

const totals = computed(() => ({
  self_found_total: filteredRows.value.reduce((sum, row) => sum + Number(row.self_found_total || 0), 0),
  company_assigned_total: filteredRows.value.reduce((sum, row) => sum + Number(row.company_assigned_total || 0), 0),
  current_main_total: filteredRows.value.reduce((sum, row) => sum + Number(row.current_main_total || 0), 0),
  current_main_self_found: filteredRows.value.reduce((sum, row) => sum + Number(row.current_main_self_found || 0), 0),
  current_main_company: filteredRows.value.reduce((sum, row) => sum + Number(row.current_main_company || 0), 0),
  current_support_total: filteredRows.value.reduce((sum, row) => sum + Number(row.current_support_total || 0), 0),
  transferred_out_total: filteredRows.value.reduce((sum, row) => sum + Number(row.transferred_out_total || 0), 0),
  ever_assigned_total: filteredRows.value.reduce((sum, row) => sum + Number(row.ever_assigned_total || 0), 0),
}))

const fetchSales = async () => {
  if (!isPrivileged.value) return
  const { data } = await getUsersApi({ per_page: 200 })
  saleOptions.value = data.data || data || []
}

const fetchData = async () => {
  loading.value = true
  try {
    const { data } = await getAssignmentStatusSummaryApi({
      sale_id: isPrivileged.value ? (filters.sale_id || undefined) : undefined,
      month: filters.month || undefined,
    })

    rows.value = data.data || []
    apiTotals.value = data.totals || apiTotals.value
  } finally {
    loading.value = false
  }
}

const applyFilters = async () => {
  await fetchData()
}

onMounted(async () => {
  await fetchSales()
  await fetchData()
})
</script>

<template>
  <MainLayout>
    <div class="page-wrap">

      <div class="page-header">
        <div>
          <h1 class="page-title">Assignment Analytics</h1>
          <p class="page-subtitle">Theo dõi tình trạng phân khách theo sale</p>
        </div>
      </div>

      <div class="filter-grid">
        <input
          type="month"
          v-model="filters.month"
          @change="applyFilters"
          class="filter"
        />

        <select
          v-model="filters.sale_id"
          @change="applyFilters"
          class="filter"
        >
          <option value="">All Sale</option>
          <option v-for="s in saleOptions" :key="s.id" :value="s.id">
            {{ s.name }}
          </option>
        </select>

        <select
          v-model="filters.type"
          @change="applyFilters"
          class="filter"
        >
          <option value="">All Type</option>
          <option value="current_main">Main</option>
          <option value="current_support">Support</option>
          <option value="transferred_out">Transfer</option>
          <option value="ever_assigned">Tổng</option>
        </select>

        <select
          v-model="filters.customer_group"
          @change="applyFilters"
          class="filter"
        >
          <option value="">All Source</option>
          <option value="self_found">Self</option>
          <option value="company_lead">Company</option>
        </select>

        <input
          v-model="filters.keyword"
          @input="null"
          @keyup.enter="applyFilters"
          placeholder="Search..."
          class="filter"
        />
      </div>

      <div class="kpi-grid">
        <div class="kpi-card kpi-company">
          <div class="kpi-label">Công ty</div>
          <div class="kpi-value">{{ totals.company_assigned_total }}</div>
        </div>

        <div class="kpi-card kpi-self">
          <div class="kpi-label">Self</div>
          <div class="kpi-value">{{ totals.self_found_total }}</div>
        </div>

        <div class="kpi-card kpi-main">
          <div class="kpi-label">Main</div>
          <div class="kpi-value">{{ totals.current_main_total }}</div>
        </div>

        <div class="kpi-card kpi-support">
          <div class="kpi-label">Support</div>
          <div class="kpi-value">{{ totals.current_support_total }}</div>
        </div>

        <div class="kpi-card kpi-transfer">
          <div class="kpi-label">Transfer</div>
          <div class="kpi-value">{{ totals.transferred_out_total }}</div>
        </div>

        <div class="kpi-card kpi-total">
          <div class="kpi-label">Tổng</div>
          <div class="kpi-value">{{ totals.ever_assigned_total }}</div>
        </div>
      </div>

      <div v-if="loading" class="loading-box">
        Đang tải dữ liệu...
      </div>

      <div v-else class="cards-list">
        <div
          v-for="row in filteredRows"
          :key="row.user_id"
          class="sale-card"
        >
          <div class="sale-name">
            {{ row.user_name }}
          </div>

          <div class="metrics-grid">
            <div class="metric-box metric-company">
              <div class="metric-label">Công ty</div>
              <div class="metric-num">{{ row.company_assigned_total }}</div>
            </div>

            <div class="metric-box metric-self">
              <div class="metric-label">Self</div>
              <div class="metric-num">{{ row.self_found_total }}</div>
            </div>

            <div class="metric-box metric-main">
              <div class="main-line">
                <span class="main-title">Main:</span>
                <span class="main-number">{{ row.current_main_total }}</span>
              </div>

              <div class="main-subline">
                <span class="main-mkt">MKT: {{ row.current_main_company }}</span>
                <span class="main-self">Tự tìm: {{ row.current_main_self_found }}</span>
              </div>
            </div>

            <div class="metric-box metric-support">
              <div class="metric-label">Support</div>
              <div class="metric-num">{{ row.current_support_total }}</div>
            </div>

            <div class="metric-box metric-transfer">
              <div class="metric-label">Transfer</div>
              <div class="metric-num">{{ row.transferred_out_total }}</div>
            </div>

            <div class="metric-box metric-total">
              <div class="metric-label">Tổng</div>
              <div class="metric-num">{{ row.ever_assigned_total }}</div>
            </div>
          </div>
        </div>

        <div v-if="!filteredRows.length" class="empty-box">
          Không có dữ liệu phù hợp với bộ lọc.
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style>
.page-wrap {
  padding: 20px;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 30px;
  line-height: 1.1;
  font-weight: 700;
  color: #0f172a;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.filter {
  background: #fff;
  border: 1px solid #dbe1ea;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  color: #0f172a;
  outline: none;
}

.filter:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.kpi-label {
  font-size: 12px;
  color: #64748b;
}

.kpi-value {
  margin-top: 6px;
  font-size: 28px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.kpi-company .kpi-value { color: #0891b2; }
.kpi-self .kpi-value { color: #7c3aed; }
.kpi-main .kpi-value { color: #059669; }
.kpi-support .kpi-value { color: #ea580c; }
.kpi-transfer .kpi-value { color: #dc2626; }
.kpi-total .kpi-value { color: #2563eb; }

.loading-box,
.empty-box {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 28px;
  text-align: center;
  color: #64748b;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sale-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: all 0.18s ease;
}

.sale-card:hover {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.sale-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 10px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.metric-box {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
}

.metric-label {
  font-size: 11px;
  color: #64748b;
}

.metric-num {
  margin-top: 4px;
  font-size: 20px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.metric-company { border-color: #bae6fd; background: #f0f9ff; }
.metric-self { border-color: #ddd6fe; background: #f5f3ff; }
.metric-main { border-color: #bbf7d0; background: #f0fdf4; }
.metric-support { border-color: #fed7aa; background: #fff7ed; }
.metric-transfer { border-color: #fecaca; background: #fef2f2; }
.metric-total { border-color: #bfdbfe; background: #eff6ff; }

.main-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.main-title {
  color: #334155;
}

.main-number {
  color: #0f172a;
}

.main-subline {
  margin-top: 5px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
}

.main-mkt {
  color: #2563eb;
  font-weight: 600;
}

.main-self {
  color: #7c3aed;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>