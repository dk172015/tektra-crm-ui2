<template>
  <MainLayout>
    <div class="mx-auto max-w-7xl">
      <!-- Top summary -->
      <section class="crm-detail-hero">
        <div class="crm-detail-hero-left">
          <div class="crm-detail-breadcrumb">
            <router-link to="/customers" class="crm-detail-breadcrumb-link">
              Khách hàng
            </router-link>
            <span class="crm-detail-breadcrumb-sep">/</span>
            <span class="crm-detail-breadcrumb-current">Chi tiết khách hàng</span>
          </div>

          <div class="crm-detail-title-row">
            <div class="crm-detail-avatar">
              {{ customerInitials }}
            </div>

            <div class="min-w-0">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span
                  class="crm-pill"
                  :class="statusBadgeClass(customer.status)"
                >
                  {{ statusLabel(customer.status) }}
                </span>

                <span
                  v-if="customer.warning_level"
                  class="crm-pill"
                  :class="warningBadgeClass(customer.warning_level)"
                >
                  {{ warningText(customer) }}
                </span>

                <span
                  v-if="customer.is_priority"
                  class="crm-pill bg-amber-100 text-amber-700"
                >
                  Ưu tiên theo dõi
                </span>
              </div>

              <h1 class="truncate text-2xl font-bold text-slate-900">
                {{ customer.company_name || customer.contact_name || 'Chi tiết khách hàng' }}
              </h1>

              <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                <span>{{ customer.contact_name || '-' }}</span>
                <span>{{ customer.phone || '-' }}</span>
                <span>{{ customer.email || '-' }}</span>
                <span>{{ customer.lead_source?.name || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="crm-detail-hero-right">
          <button
            class="crm-detail-btn"
            :class="customer.is_priority
              ? 'crm-detail-btn-warning'
              : 'crm-detail-btn-secondary'"
            :disabled="priorityLoading"
            @click="handleTogglePriority"
          >
            {{ priorityLoading ? 'Đang xử lý...' : (customer.is_priority ? 'Bỏ ưu tiên' : 'Đánh dấu ưu tiên') }}
          </button>

         <button
            v-if="auth.isAdmin && !isClosedStatus"
            class="crm-detail-btn crm-detail-btn-secondary"
            @click="showAssignModal = true"
          >
            Phân công sale
          </button>
        <button
          v-if="customer.status === 'contracted' && auth.isAdmin"
          class="crm-detail-btn crm-detail-btn-secondary"
          @click="showEditDealModal = true"
        >
          Sửa hợp đồng
        </button>
        <button
          v-if="customer.status === 'lost' && auth.isAdmin"
          class="crm-detail-btn crm-detail-btn-secondary"
          @click="showEditLossModal = true"
        >
          Sửa thông tin mất khách
        </button>
        <div
          v-if="canAdminEditClosed"
          class="flex flex-wrap gap-2"
        >
          <button
            v-if="customer.status === 'contracted'"
            class="crm-detail-btn crm-detail-btn-secondary"
            :disabled="adminClosedActionLoading"
            @click="handleAdminChangeClosedStatus('negotiating')"
          >
            Mở lại đàm phán
          </button>

          <button
            v-if="customer.status === 'contracted'"
            class="crm-detail-btn crm-detail-btn-secondary"
            :disabled="adminClosedActionLoading"
            @click="handleAdminChangeClosedStatus('deposit')"
          >
            Quay về đặt cọc
          </button>

          <button
            v-if="customer.status === 'lost'"
            class="crm-detail-btn crm-detail-btn-secondary"
            :disabled="adminClosedActionLoading"
            @click="handleAdminChangeClosedStatus('consulting')"
          >
            Mở lại tư vấn
          </button>

          <button
            v-if="customer.status === 'lost'"
            class="crm-detail-btn crm-detail-btn-secondary"
            :disabled="adminClosedActionLoading"
            @click="handleAdminChangeClosedStatus('negotiating')"
          >
            Mở lại đàm phán
          </button>
        </div>
          <router-link
            to="/customers"
            class="crm-detail-btn crm-detail-btn-primary"
          >
            Quay lại board
          </router-link>
        </div>
      </section>
      <div
        v-if="statusActionError"
        class="mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ statusActionError }}
      </div>
      <div
        v-if="isReadonlyForSale"
        class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
      >
        Khách hàng đang ở trạng thái đã chốt hợp đồng hoặc mất khách. Sale chỉ được xem thông tin, không được chỉnh sửa.
      </div>
      <!-- KPI strip -->
      <section class="crm-detail-kpis">
        <div class="crm-kpi-card">
          <div class="crm-kpi-label">Nguồn khách</div>
          <div class="crm-kpi-value">{{ customer.lead_source?.name || '-' }}</div>
        </div>

        <div class="crm-kpi-card">
          <div class="crm-kpi-label">Sale phụ trách</div>
          <div class="crm-kpi-value">{{ customer.assigned_users?.length || 0 }}</div>
        </div>

        <div class="crm-kpi-card">
          <div class="crm-kpi-label">Lịch đi xem</div>
          <div class="crm-kpi-value">{{ customer.viewings?.length || 0 }}</div>
        </div>

        <div class="crm-kpi-card">
          <div class="crm-kpi-label">Hoạt động chăm sóc</div>
          <div class="crm-kpi-value">{{ customer.activities?.length || 0 }}</div>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <!-- Left column -->
        <div class="space-y-4 xl:col-span-4">
          <!-- Customer info -->
          <section class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Thông tin khách hàng</h2>
                <p class="crm-panel-subtitle">Thông tin liên hệ và nguồn lead</p>
              </div>

              <button
                v-if="canEditCustomerInfo && !showCustomerInfoEdit"
                class="crm-detail-btn crm-detail-btn-secondary"
                @click="openCustomerInfoEdit"
              >
                Sửa thông tin
              </button>
            </div>

            <template v-if="!showCustomerInfoEdit">
              <div class="crm-info-list">
                <div class="crm-info-row">
                  <span class="crm-info-label">Công ty</span>
                  <span class="crm-info-value">{{ customer.company_name || '-' }}</span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Người liên hệ</span>
                  <span class="crm-info-value">{{ customer.contact_name || '-' }}</span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Điện thoại</span>
                  <span class="crm-info-value">{{ customer.phone || '-' }}</span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Email</span>
                  <span class="crm-info-value">{{ customer.email || '-' }}</span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Nguồn khách</span>
                  <span class="crm-info-value">{{ customer.lead_source?.name || '-' }}</span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Chi tiết nguồn</span>
                  <span class="crm-info-value">{{ customer.source_detail || '-' }}</span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Campaign</span>
                  <span class="crm-info-value">{{ customer.campaign_name || '-' }}</span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Người tạo</span>
                  <span class="crm-info-value">{{ customer.creator?.name || '-' }}</span>
                </div>

                <div v-if="customer.priority_marker?.name" class="crm-info-row">
                  <span class="crm-info-label">Đánh dấu ưu tiên bởi</span>
                  <span class="crm-info-value">{{ customer.priority_marker?.name || '-' }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label class="crm-label">Công ty</label>
                  <input
                    v-model="customerInfoForm.company_name"
                    class="crm-input"
                    placeholder="Nhập tên công ty"
                  />
                </div>

                <div>
                  <label class="crm-label">Người liên hệ</label>
                  <input
                    v-model="customerInfoForm.contact_name"
                    class="crm-input"
                    placeholder="Nhập người liên hệ"
                  />
                </div>

                <div>
                  <label class="crm-label">Điện thoại</label>
                  <input
                    v-model="customerInfoForm.phone"
                    class="crm-input"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label class="crm-label">Email</label>
                  <input
                    v-model="customerInfoForm.email"
                    class="crm-input"
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label class="crm-label">Nguồn khách</label>
                  <select
                    v-model="customerInfoForm.lead_source_id"
                    class="crm-input"
                  >
                    <option value="">Chọn nguồn khách</option>
                    <option v-for="item in leadSources" :key="item.id" :value="item.id">
                      {{ item.name }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="crm-label">Chi tiết nguồn</label>
                  <input
                    v-model="customerInfoForm.source_detail"
                    class="crm-input"
                    placeholder="Nhập chi tiết nguồn"
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="crm-label">Campaign</label>
                  <input
                    v-model="customerInfoForm.campaign_name"
                    class="crm-input"
                    placeholder="Nhập campaign"
                  />
                </div>
              </div>

              <div
                v-if="customerInfoError"
                class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {{ customerInfoError }}
              </div>

              <div class="mt-4 flex justify-end gap-3">
                <button
                  class="crm-detail-btn crm-detail-btn-secondary"
                  @click="cancelCustomerInfoEdit"
                >
                  Hủy
                </button>

                <button
                  class="crm-detail-btn crm-detail-btn-primary"
                  :disabled="customerInfoLoading"
                  @click="submitCustomerInfo"
                >
                  {{ customerInfoLoading ? 'Đang lưu...' : 'Lưu thông tin' }}
                </button>
              </div>
            </template>
          </section>

          <!-- Assigned sales -->
          <section class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Sale phụ trách</h2>
                <p class="crm-panel-subtitle">Danh sách sale đang chăm sóc khách</p>
              </div>
            </div>

            <div v-if="customer.assigned_users?.length" class="space-y-3">
              <div
                v-for="(user, index) in customer.assigned_users"
                :key="user.id"
                class="crm-user-card"
              >
                <div class="crm-user-left">
                  <div class="crm-user-avatar">
                    {{ getInitials(user.name) }}
                  </div>
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold text-slate-900">
                      {{ user.name }}
                    </div>
                    <div class="truncate text-xs text-slate-500">
                      {{ user.email }}
                    </div>
                  </div>
                </div>

                <span
                  class="crm-pill"
                  :class="index === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'"
                >
                  {{ index === 0 ? 'Sale chính' : 'Phối hợp' }}
                </span>
              </div>
            </div>

            <div v-else class="crm-empty-box">
              Chưa có sale phụ trách
            </div>
          </section>

          <!-- Requirement -->
          <section class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Nhu cầu thuê</h2>
                <p class="crm-panel-subtitle">Thông tin dùng để tư vấn mặt bằng</p>
              </div>

              <button
                v-if="canEditRequirement && !showRequirementEdit"
                class="crm-detail-btn crm-detail-btn-secondary"
                @click="openRequirementEdit"
              >
                Sửa nhu cầu
              </button>
            </div>

            <template v-if="!showRequirementEdit">
              <div class="crm-info-list">
                <div class="crm-info-row">
                  <span class="crm-info-label">Khu vực</span>
                  <span class="crm-info-value">
                    {{ customer.requirement?.preferred_location || '-' }}
                  </span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Diện tích</span>
                  <span class="crm-info-value">
                    {{ customer.requirement?.area_min || '-' }} - {{ customer.requirement?.area_max || '-' }} m²
                  </span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Ngân sách</span>
                  <span class="crm-info-value">
                    {{ formatBudget(customer.requirement?.budget_min) }} - {{ formatBudget(customer.requirement?.budget_max) }}
                  </span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Ngày vào thuê</span>
                  <span class="crm-info-value">
                    {{ customer.requirement?.move_in_date || '-' }}
                  </span>
                </div>

                <div class="crm-info-row">
                  <span class="crm-info-label">Kỳ hạn thuê</span>
                  <span class="crm-info-value">
                    {{ customer.requirement?.lease_term_months || '-' }} tháng
                  </span>
                </div>
              </div>

              <div class="mt-4">
                <div class="mb-2 text-sm font-medium text-slate-600">Yêu cầu đặc biệt</div>
                <div class="crm-note-box">
                  {{ customer.requirement?.special_requirements || 'Chưa có yêu cầu đặc biệt' }}
                </div>
              </div>
            </template>
            <template v-else>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label class="crm-label">Khu vực</label>
                  <input
                    v-model="requirementForm.preferred_location"
                    class="crm-input"
                    placeholder="Nhập khu vực mong muốn"
                  />
                </div>

                <div></div>

                <div>
                  <label class="crm-label">Diện tích từ</label>
                  <input
                    v-model="requirementForm.area_min"
                    type="number"
                    min="0"
                    class="crm-input"
                    placeholder="Ví dụ: 50"
                  />
                </div>

                <div>
                  <label class="crm-label">Diện tích đến</label>
                  <input
                    v-model="requirementForm.area_max"
                    type="number"
                    min="0"
                    class="crm-input"
                    placeholder="Ví dụ: 120"
                  />
                </div>

                <div>
                  <label class="crm-label">Ngân sách từ</label>
                  <input
                    v-model="requirementForm.budget_min"
                    type="number"
                    min="0"
                    class="crm-input"
                    placeholder="Ví dụ: 10000000"
                  />
                </div>

                <div>
                  <label class="crm-label">Ngân sách đến</label>
                  <input
                    v-model="requirementForm.budget_max"
                    type="number"
                    min="0"
                    class="crm-input"
                    placeholder="Ví dụ: 30000000"
                  />
                </div>

                <div>
                  <label class="crm-label">Ngày vào thuê</label>
                  <input
                    v-model="requirementForm.move_in_date"
                    type="date"
                    class="crm-input"
                  />
                </div>

                <div>
                  <label class="crm-label">Kỳ hạn thuê (tháng)</label>
                  <input
                    v-model="requirementForm.lease_term_months"
                    type="number"
                    min="1"
                    class="crm-input"
                    placeholder="Ví dụ: 24"
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="crm-label">Yêu cầu đặc biệt</label>
                  <textarea
                    v-model="requirementForm.special_requirements"
                    rows="4"
                    class="crm-input h-auto py-3"
                    placeholder="Nhập yêu cầu đặc biệt..."
                  />
                </div>
              </div>

              <div
                v-if="requirementError"
                class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {{ requirementError }}
              </div>

              <div class="mt-4 flex justify-end gap-3">
                <button
                  class="crm-detail-btn crm-detail-btn-secondary"
                  @click="cancelRequirementEdit"
                >
                  Hủy
                </button>

                <button
                  class="crm-detail-btn crm-detail-btn-primary"
                  :disabled="requirementLoading"
                  @click="submitRequirement"
                >
                  {{ requirementLoading ? 'Đang lưu...' : 'Lưu nhu cầu' }}
                </button>
              </div>
            </template>
          </section>
        </div>

        <!-- Right column -->
        <div class="space-y-4 xl:col-span-8">
          <!-- Quick update -->
          <section v-if="!isReadonlyForSale && !isClosedStatus" class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Cập nhật nhanh</h2>
                <p class="crm-panel-subtitle">Thêm ghi chú và hoạt động chăm sóc</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <!-- Note -->
              <div class="crm-form-card">
                <div class="crm-form-card-title">Thêm ghi chú</div>

                <textarea
                  v-model="noteForm.content"
                  rows="5"
                  class="crm-input crm-textarea"
                  placeholder="Nhập ghi chú mới về khách hàng..."
                />

                <div v-if="noteError" class="crm-form-error">
                  {{ noteError }}
                </div>

                <div class="mt-3 flex justify-end">
                  <button
                    class="crm-detail-btn crm-detail-btn-primary"
                    :disabled="noteLoading"
                    @click="submitNote"
                  >
                    {{ noteLoading ? 'Đang lưu...' : 'Lưu ghi chú' }}
                  </button>
                </div>
              </div>

              <!-- Activity -->
              <div class="crm-form-card">
                <div class="crm-form-card-title">Thêm hoạt động chăm sóc</div>

                <div class="space-y-3">
                  <select
                    v-model="activityForm.type"
                    class="crm-input"
                  >
                    <option value="call">Gọi điện</option>
                    <option value="message">Nhắn tin</option>
                    <option value="meeting">Gặp mặt</option>
                    <option value="site_visit">Khảo sát / đi xem</option>
                    <option value="note">Ghi chú</option>
                  </select>

                  <textarea
                    v-model="activityForm.content"
                    rows="4"
                    class="crm-input crm-textarea"
                    placeholder="Mô tả hoạt động..."
                  />

                  <div v-if="activityError" class="crm-form-error">
                    {{ activityError }}
                  </div>

                  <div class="flex justify-end">
                    <button
                      class="crm-detail-btn crm-detail-btn-secondary"
                      :disabled="activityLoading"
                      @click="submitActivity"
                    >
                      {{ activityLoading ? 'Đang lưu...' : 'Lưu hoạt động' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Viewing -->
          <section v-if="!isClosedStatus" class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Lịch đi xem mặt bằng</h2>
                <p class="crm-panel-subtitle">Nhập tay và lưu riêng để tổng hợp báo cáo</p>
              </div>

              <button
                class="crm-detail-btn crm-detail-btn-secondary"
                @click="showViewingForm = !showViewingForm"
              >
                {{ showViewingForm ? 'Ẩn form' : 'Thêm lịch đi xem' }}
              </button>
            </div>

            <div v-if="showViewingForm" class="crm-form-box">
              <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <input
                  v-model="viewingForm.building_name"
                  class="crm-input"
                  placeholder="Tên tòa nhà / mặt bằng"
                />

                <input
                  v-model="viewingForm.address"
                  class="crm-input"
                  placeholder="Địa chỉ mặt bằng"
                />

                <input
                  v-model="viewingForm.viewing_time"
                  type="datetime-local"
                  class="crm-input"
                />

                <select
                  v-model="viewingForm.status"
                  class="crm-input"
                >
                  <option value="scheduled">Đã lên lịch</option>
                  <option value="done">Đã đi xem</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <textarea
                v-model="viewingForm.note"
                rows="4"
                class="crm-input crm-textarea mt-3"
                placeholder="Ghi chú lịch đi xem..."
              />

              <div v-if="viewingError" class="crm-form-error mt-3">
                {{ viewingError }}
              </div>

              <div class="mt-3 flex justify-end">
                <button
                  class="crm-detail-btn crm-detail-btn-primary"
                  :disabled="viewingLoading"
                  @click="submitViewing"
                >
                  {{ viewingLoading ? 'Đang lưu...' : 'Lưu lịch đi xem' }}
                </button>
              </div>
            </div>

            <div v-if="customer.viewings?.length" class="space-y-3">
              <div
                v-for="item in customer.viewings"
                :key="item.id"
                class="crm-viewing-card"
              >
                <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div class="text-sm font-semibold text-slate-900">
                      {{ item.building_name || item.property?.building_name || '-' }}
                    </div>
                    <div class="mt-1 text-sm text-slate-500">
                      {{ item.address || item.property?.address || '-' }}
                    </div>
                  </div>

                  <span class="crm-pill bg-slate-100 text-slate-700">
                    {{ viewingStatusLabel(item.status) }}
                  </span>
                </div>

                <div class="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 lg:grid-cols-2">
                  <div class="crm-meta-line">
                    <span class="crm-meta-line-label">Thời gian</span>
                    <span>{{ formatDateTime(item.viewing_time) }}</span>
                  </div>

                  <div class="crm-meta-line">
                    <span class="crm-meta-line-label">Người tạo</span>
                    <span>{{ item.creator?.name || '-' }}</span>
                  </div>
                </div>

                <div class="mt-3 crm-note-box">
                  {{ item.note || 'Không có ghi chú' }}
                </div>
              </div>
            </div>

            <div v-else class="crm-empty-box">
              Chưa có lịch đi xem
            </div>
          </section>

          <!-- Activity timeline -->
          <section class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Lịch sử chăm sóc</h2>
                <p class="crm-panel-subtitle">Timeline toàn bộ ghi chú và thao tác trên khách hàng</p>
              </div>

              <div class="text-sm text-slate-500">
                {{ paginatedActivities.length ? `${activityPageStart}-${activityPageEnd} / ${customer.activities?.length || 0}` : '0' }}
              </div>
            </div>

            <div v-if="paginatedActivities.length" class="space-y-4">
              <div
                v-for="item in paginatedActivities"
                :key="item.id"
                class="crm-timeline-item"
              >
                <div class="crm-timeline-top">
                  <div class="flex items-center gap-2">
                    <span
                      class="crm-pill"
                      :class="activityBadgeClass(item.type)"
                    >
                      {{ activityTypeLabel(item.type) }}
                    </span>

                    <span class="text-xs text-slate-400">
                      {{ item.user?.name || '-' }}
                    </span>
                  </div>

                  <div class="text-xs text-slate-400">
                    {{ formatDateTime(item.activity_time) }}
                  </div>
                </div>

                <div class="mt-3 text-sm leading-6 text-slate-700">
                  {{ item.content }}
                </div>
              </div>
            </div>

            <div v-else class="crm-empty-box">
              Chưa có hoạt động chăm sóc
            </div>

            <div
              v-if="totalActivityPages > 1"
              class="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4"
            >
              <button
                class="crm-detail-btn crm-detail-btn-secondary"
                :disabled="activityPage === 1"
                @click="activityPage--"
              >
                Trang trước
              </button>

              <div class="flex items-center gap-2">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  class="crm-page-btn"
                  :class="page === activityPage ? 'active' : ''"
                  @click="activityPage = page"
                >
                  {{ page }}
                </button>
              </div>

              <button
                class="crm-detail-btn crm-detail-btn-secondary"
                :disabled="activityPage === totalActivityPages"
                @click="activityPage++"
              >
                Trang sau
              </button>
            </div>
          </section>
        </div>
      </div>

      <AssignSalesModal
        v-model="showAssignModal"
        :customer="customer"
        @saved="reloadCustomer"
      />
    </div>
    <EditDealModal
      v-model="showEditDealModal"
      :customerId="customer.id"
      @saved="handleDealUpdated"
    />

    <EditLossModal
      v-model="showEditLossModal"
      :customerId="customer.id"
      @saved="handleLossUpdated"
    />
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '../../layouts/MainLayout.vue'
import AssignSalesModal from '../../components/customers/AssignSalesModal.vue'
import EditDealModal from '../../components/customers/EditDealModal.vue'
import EditLossModal from '../../components/customers/EditLossModal.vue'
import { getLeadSourcesApi } from '../../api/leadSources'
import {
  addActivityApi,
  addViewingApi,
  getCustomerDetailApi,
  togglePriorityApi,
  updateCustomerApi,
  updateCustomerStatusApi,
  updateCustomerRequirementApi,
} from '../../api/customers'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const auth = useAuthStore()

const customer = ref({})
const showAssignModal = ref(false)
const showViewingForm = ref(false)

const noteLoading = ref(false)
const activityLoading = ref(false)
const viewingLoading = ref(false)
const priorityLoading = ref(false)

const noteError = ref('')
const activityError = ref('')
const viewingError = ref('')

const showEditDealModal = ref(false)
const showEditLossModal = ref(false)


const isClosedStatus = computed(() =>
  ['contracted', 'lost'].includes(customer.value?.status)
)

const isReadonlyForSale = computed(() =>
  isClosedStatus.value && auth.user?.role !== 'admin'
)

const canAdminEditClosed = computed(() =>
  isClosedStatus.value && auth.user?.role === 'admin'
)
const noteForm = reactive({
  content: '',
})

const activityForm = reactive({
  type: 'call',
  content: '',
})

const viewingForm = reactive({
  building_name: '',
  address: '',
  viewing_time: '',
  status: 'scheduled',
  note: '',
})
const showCustomerInfoEdit = ref(false)
const customerInfoLoading = ref(false)
const customerInfoError = ref('')

const customerInfoForm = reactive({
  company_name: '',
  contact_name: '',
  phone: '',
  email: '',
  lead_source_id: '',
  source_detail: '',
  campaign_name: '',
})
const fillCustomerInfoForm = () => {
  customerInfoForm.company_name = customer.value.company_name || ''
  customerInfoForm.contact_name = customer.value.contact_name || ''
  customerInfoForm.phone = customer.value.phone || ''
  customerInfoForm.email = customer.value.email || ''
  customerInfoForm.lead_source_id = customer.value.lead_source_id || ''
  customerInfoForm.source_detail = customer.value.source_detail || ''
  customerInfoForm.campaign_name = customer.value.campaign_name || ''
}
const openCustomerInfoEdit = () => {
  customerInfoError.value = ''
  fillCustomerInfoForm()
  showCustomerInfoEdit.value = true
}

const cancelCustomerInfoEdit = () => {
  customerInfoError.value = ''
  showCustomerInfoEdit.value = false
}
const submitCustomerInfo = async () => {
  customerInfoError.value = ''
  customerInfoLoading.value = true

  try {
    await updateCustomerApi(route.params.id, {
      company_name: customerInfoForm.company_name || null,
      contact_name: customerInfoForm.contact_name || null,
      phone: customerInfoForm.phone || null,
      email: customerInfoForm.email || null,
      lead_source_id: customerInfoForm.lead_source_id || null,
      source_detail: customerInfoForm.source_detail || null,
      campaign_name: customerInfoForm.campaign_name || null,
    })

    showCustomerInfoEdit.value = false
    await reloadCustomer()
  } catch (error) {
    customerInfoError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat?.()[0] ||
      'Không thể cập nhật thông tin khách hàng'
  } finally {
    customerInfoLoading.value = false
  }
}
const leadSources = ref([])
const loadLeadSources = async () => {
  const { data } = await getLeadSourcesApi()
  leadSources.value = data
}

const showRequirementEdit = ref(false)
const requirementLoading = ref(false)
const requirementError = ref('')

const requirementForm = reactive({
  preferred_location: '',
  area_min: '',
  area_max: '',
  budget_min: '',
  budget_max: '',
  move_in_date: '',
  lease_term_months: '',
  special_requirements: '',
})
const fillRequirementForm = () => {
  requirementForm.preferred_location = customer.value.requirement?.preferred_location || ''
  requirementForm.area_min = customer.value.requirement?.area_min || ''
  requirementForm.area_max = customer.value.requirement?.area_max || ''
  requirementForm.budget_min = customer.value.requirement?.budget_min || ''
  requirementForm.budget_max = customer.value.requirement?.budget_max || ''
  requirementForm.move_in_date = customer.value.requirement?.move_in_date || ''
  requirementForm.lease_term_months = customer.value.requirement?.lease_term_months || ''
  requirementForm.special_requirements = customer.value.requirement?.special_requirements || ''
}
const openRequirementEdit = () => {
  requirementError.value = ''
  fillRequirementForm()
  showRequirementEdit.value = true
}

const cancelRequirementEdit = () => {
  requirementError.value = ''
  showRequirementEdit.value = false
}
const submitRequirement = async () => {
  requirementError.value = ''
  requirementLoading.value = true

  try {
    await updateCustomerRequirementApi(route.params.id, {
      preferred_location: requirementForm.preferred_location || null,
      area_min: requirementForm.area_min || null,
      area_max: requirementForm.area_max || null,
      budget_min: requirementForm.budget_min || null,
      budget_max: requirementForm.budget_max || null,
      move_in_date: requirementForm.move_in_date || null,
      lease_term_months: requirementForm.lease_term_months || null,
      special_requirements: requirementForm.special_requirements || null,
    })

    showRequirementEdit.value = false
    await reloadCustomer()
  } catch (error) {
    requirementError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat?.()[0] ||
      'Không thể cập nhật nhu cầu thuê'
  } finally {
    requirementLoading.value = false
  }
}
const canEditRequirement = computed(() => {
  if (auth.user?.role === 'admin') return true
  return !isReadonlyForSale.value
})
const canEditCustomerInfo = computed(() => auth.user?.role === 'admin')

const activityPage = ref(1)
const activityPerPage = 5

const adminClosedActionLoading = ref(false)
const statusActionError = ref('')

const customerInitials = computed(() => {
  return getInitials(customer.value.company_name || customer.value.contact_name || 'KH')
})

const totalActivityPages = computed(() => {
  const total = customer.value.activities?.length || 0
  return Math.max(1, Math.ceil(total / activityPerPage))
})

const paginatedActivities = computed(() => {
  const list = customer.value.activities || []
  const start = (activityPage.value - 1) * activityPerPage
  return list.slice(start, start + activityPerPage)
})

const activityPageStart = computed(() => {
  if (!paginatedActivities.value.length) return 0
  return (activityPage.value - 1) * activityPerPage + 1
})

const activityPageEnd = computed(() => {
  return activityPageStart.value + paginatedActivities.value.length - 1
})

const visiblePages = computed(() => {
  const total = totalActivityPages.value
  const current = activityPage.value
  const pages = []

  let start = Math.max(1, current - 1)
  let end = Math.min(total, current + 1)

  if (current === 1) end = Math.min(total, 3)
  if (current === total) start = Math.max(1, total - 2)

  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

watch(
  () => customer.value.activities?.length,
  () => {
    if (activityPage.value > totalActivityPages.value) {
      activityPage.value = totalActivityPages.value
    }
  }
)

const reloadCustomer = async () => {
  const { data } = await getCustomerDetailApi(route.params.id)
  customer.value = data
}

const handleTogglePriority = async () => {
  if (priorityLoading.value) return
  priorityLoading.value = true

  try {
    await togglePriorityApi(route.params.id)
    await reloadCustomer()
  } finally {
    priorityLoading.value = false
  }
}

const submitNote = async () => {
  noteError.value = ''

  if (!noteForm.content.trim()) {
    noteError.value = 'Vui lòng nhập nội dung ghi chú.'
    return
  }

  noteLoading.value = true

  try {
    await addActivityApi(route.params.id, {
      type: 'note',
      content: noteForm.content,
    })

    noteForm.content = ''
    await reloadCustomer()
    activityPage.value = 1
  } catch (error) {
    noteError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu ghi chú'
  } finally {
    noteLoading.value = false
  }
}

const submitActivity = async () => {
  activityError.value = ''

  if (!activityForm.content.trim()) {
    activityError.value = 'Vui lòng nhập nội dung hoạt động.'
    return
  }

  activityLoading.value = true

  try {
    await addActivityApi(route.params.id, {
      type: activityForm.type,
      content: activityForm.content,
    })

    activityForm.type = 'call'
    activityForm.content = ''
    await reloadCustomer()
    activityPage.value = 1
  } catch (error) {
    activityError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu hoạt động'
  } finally {
    activityLoading.value = false
  }
}

const submitViewing = async () => {
  viewingError.value = ''

  if (!viewingForm.building_name.trim()) {
    viewingError.value = 'Vui lòng nhập tên tòa nhà / mặt bằng.'
    return
  }

  if (!viewingForm.address.trim()) {
    viewingError.value = 'Vui lòng nhập địa chỉ mặt bằng.'
    return
  }

  if (!viewingForm.viewing_time) {
    viewingError.value = 'Vui lòng chọn thời gian đi xem.'
    return
  }

  viewingLoading.value = true

  try {
    await addViewingApi(route.params.id, {
      building_name: viewingForm.building_name,
      address: viewingForm.address,
      viewing_time: viewingForm.viewing_time,
      status: viewingForm.status,
      note: viewingForm.note,
    })

    viewingForm.building_name = ''
    viewingForm.address = ''
    viewingForm.viewing_time = ''
    viewingForm.status = 'scheduled'
    viewingForm.note = ''
    showViewingForm.value = false

    await reloadCustomer()
    activityPage.value = 1
  } catch (error) {
    viewingError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat()[0] ||
      'Không thể lưu lịch đi xem'
  } finally {
    viewingLoading.value = false
  }
}

const getInitials = (name) => {
  return (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join('')
}

const formatBudget = (value) => {
  if (!value) return '-'
  return new Intl.NumberFormat('vi-VN').format(value)
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN')
}

const viewingStatusLabel = (status) => {
  const map = {
    scheduled: 'Đã lên lịch',
    done: 'Đã đi xem',
    cancelled: 'Đã hủy',
  }
  return map[status] || status || '-'
}

const statusLabel = (status) => {
  const map = {
    new: 'Khách mới',
    consulting: 'Đang tư vấn',
    viewing: 'Đi xem',
    negotiating: 'Đàm phán',
    deposit: 'Đặt cọc',
    contracted: 'Đã ký HĐ',
    lost: 'Không thành công',
  }

  return map[status] || status || '-'
}

const statusBadgeClass = (status) => {
  const map = {
    new: 'bg-slate-100 text-slate-700',
    consulting: 'bg-blue-100 text-blue-700',
    viewing: 'bg-cyan-100 text-cyan-700',
    negotiating: 'bg-amber-100 text-amber-700',
    deposit: 'bg-orange-100 text-orange-700',
    contracted: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  }

  return map[status] || 'bg-slate-100 text-slate-700'
}

const activityTypeLabel = (type) => {
  const map = {
    note: 'Ghi chú',
    call: 'Gọi điện',
    message: 'Nhắn tin',
    meeting: 'Gặp mặt',
    site_visit: 'Đi xem / khảo sát',
    status_change: 'Đổi trạng thái',
    assignment_change: 'Đổi phân công',
    warning_resolved: 'Xử lý cảnh báo',
    priority_change: 'Ưu tiên theo dõi',
  }

  return map[type] || type
}

const activityBadgeClass = (type) => {
  const map = {
    note: 'bg-slate-100 text-slate-700',
    call: 'bg-blue-100 text-blue-700',
    message: 'bg-cyan-100 text-cyan-700',
    meeting: 'bg-purple-100 text-purple-700',
    site_visit: 'bg-emerald-100 text-emerald-700',
    status_change: 'bg-amber-100 text-amber-700',
    assignment_change: 'bg-rose-100 text-rose-700',
    warning_resolved: 'bg-lime-100 text-lime-700',
    priority_change: 'bg-amber-100 text-amber-700',
  }

  return map[type] || 'bg-slate-100 text-slate-700'
}

const warningBadgeClass = (level) => {
  if (level === 'red') return 'bg-red-50 text-red-700'
  if (level === 'yellow') return 'bg-amber-50 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

const warningText = (item) => {
  const days = item.warning_days || 0
  if (item.warning_level === 'red') return `${days} ngày chưa cập nhật`
  if (item.warning_level === 'yellow') return `${days} ngày cần theo dõi`
  return ''
}
const handleDealUpdated = async () => {
  showEditDealModal.value = false
  await reloadCustomer()
}

const handleLossUpdated = async () => {
  showEditLossModal.value = false
  await reloadCustomer()
}
onMounted(async () => {
  await Promise.all([reloadCustomer(), loadLeadSources()])
})
const handleAdminChangeClosedStatus = async (targetStatus) => {
  statusActionError.value = ''

  if (!customer.value?.id) return
  if (!auth.isAdmin) return
  if (customer.value.status === targetStatus) return

  adminClosedActionLoading.value = true

  try {
    await updateCustomerStatusApi(customer.value.id, {
      status: targetStatus,
    })

    await reloadCustomer()
  } catch (error) {
    statusActionError.value =
      error.response?.data?.message ||
      Object.values(error.response?.data?.errors || {}).flat?.()[0] ||
      'Không thể cập nhật trạng thái khách hàng'
  } finally {
    adminClosedActionLoading.value = false
  }
}
</script>

<style scoped>
.crm-detail-hero {
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

.crm-detail-hero-left {
  min-width: 0;
  flex: 1;
}

.crm-detail-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 12px;
}

.crm-detail-breadcrumb-link {
  color: #64748b;
  text-decoration: none;
}

.crm-detail-breadcrumb-link:hover {
  color: #0f172a;
}

.crm-detail-breadcrumb-sep {
  color: #cbd5e1;
}

.crm-detail-breadcrumb-current {
  color: #0f172a;
  font-weight: 600;
}

.crm-detail-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.crm-detail-avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(180deg, #0f172a, #1e293b);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.crm-detail-hero-right {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 10px;
}

.crm-detail-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.crm-kpi-card {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: white;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
}

.crm-kpi-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.crm-kpi-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.crm-panel {
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  background: white;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
}

.crm-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
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

.crm-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.crm-info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.crm-info-label {
  font-size: 14px;
  color: #64748b;
  flex-shrink: 0;
}

.crm-info-value {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
  text-align: right;
}

.crm-user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.crm-user-left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.crm-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: #f1f5f9;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.crm-empty-box {
  border-radius: 18px;
  border: 1px dashed #cbd5e1;
  background: #fafcff;
  padding: 22px;
  text-align: center;
  font-size: 14px;
  color: #94a3b8;
}

.crm-form-card,
.crm-form-box {
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #fafcff;
  padding: 16px;
}

.crm-form-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
}

.crm-input {
  width: 100%;
  height: 44px;
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

.crm-textarea {
  height: auto;
  padding-top: 12px;
  padding-bottom: 12px;
  resize: vertical;
}

.crm-form-error {
  border-radius: 14px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  padding: 12px 14px;
  font-size: 14px;
  color: #b91c1c;
}

.crm-detail-btn {
  height: 42px;
  border-radius: 14px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.18s ease;
}

.crm-detail-btn-primary {
  border: 1px solid #0f172a;
  background: #0f172a;
  color: white;
}

.crm-detail-btn-primary:hover {
  background: #1e293b;
}

.crm-detail-btn-secondary {
  border: 1px solid #d7e0ea;
  background: white;
  color: #334155;
}

.crm-detail-btn-secondary:hover {
  background: #f8fafc;
}

.crm-detail-btn-warning {
  border: 1px solid #fcd34d;
  background: #fffbeb;
  color: #b45309;
}

.crm-detail-btn-warning:hover {
  background: #fef3c7;
}

.crm-note-box {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 14px;
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
}

.crm-viewing-card {
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: white;
  padding: 16px;
}

.crm-meta-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.crm-meta-line-label {
  color: #64748b;
}

.crm-timeline-item {
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: white;
  padding: 16px;
}

.crm-timeline-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
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

.crm-page-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid #d7e0ea;
  background: white;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.18s ease;
}

.crm-page-btn:hover {
  background: #f8fafc;
}

.crm-page-btn.active {
  background: #0f172a;
  border-color: #0f172a;
  color: white;
}

@media (max-width: 1200px) {
  .crm-detail-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .crm-detail-hero {
    flex-direction: column;
  }

  .crm-detail-hero-right {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .crm-detail-kpis {
    grid-template-columns: 1fr;
  }

  .crm-info-row,
  .crm-meta-line {
    flex-direction: column;
    align-items: flex-start;
  }

  .crm-info-value {
    text-align: left;
  }

  .crm-detail-title-row {
    align-items: flex-start;
  }
}
.crm-label {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}
</style>