<template>
  <div class="crm-shell">
    <!-- Sidebar -->
    <aside :class="['crm-sidebar', { collapsed: sidebarCollapsed }]">
      <div class="crm-sidebar-top">
        <button class="crm-icon-btn sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg viewBox="0 0 24 24" fill="none" class="crm-svg">
            <path d="M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M4 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <nav class="crm-sidebar-nav">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="crm-nav-item"
          :class="{ active: isActive(item.to) }"
          :title="item.label"
        >
          <span class="crm-nav-icon" v-html="item.icon"></span>
          <span v-if="!sidebarCollapsed" class="crm-nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="crm-sidebar-bottom">
        <button class="crm-icon-btn crm-logout-mini" @click="logout" title="Đăng xuất">
          <svg viewBox="0 0 24 24" fill="none" class="crm-svg">
            <path d="M15 17L20 12L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 19H6C4.89543 19 4 18.1046 4 17V7C4 5.89543 4.89543 5 6 5H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="crm-main">
      <!-- Top bar compact 1 line -->
      <header class="crm-topbar">
        <div class="crm-topbar-left">
          <div class="crm-breadcrumb-inline">
            <span class="crm-breadcrumb-inline-muted">CRM</span>
            <span class="crm-breadcrumb-inline-sep">/</span>
            <span class="crm-breadcrumb-inline-current">{{ currentPageTitle }}</span>
          </div>
        </div>

        <div class="crm-topbar-right">
          <RouterLink to="/profile" class="crm-profile-chip">
            <div class="crm-profile-avatar">
              {{ userInitials }}
            </div>

            <div class="crm-profile-meta">
              <div class="crm-profile-name">{{ auth.user?.name || 'User' }}</div>
              <div class="crm-profile-link">{{ auth.user?.role || 'user' }}</div>
            </div>
          </RouterLink>

          <button class="crm-topbar-btn" @click="logout">
            Đăng xuất
          </button>
        </div>
      </header>

      <!-- Content -->
      <main class="crm-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const sidebarCollapsed = ref(false)

const navigationItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" class="crm-svg">
        <path d="M4 13H10V20H4V13Z" stroke="currentColor" stroke-width="2" />
        <path d="M14 4H20V20H14V4Z" stroke="currentColor" stroke-width="2" />
        <path d="M4 4H10V9H4V4Z" stroke="currentColor" stroke-width="2" />
      </svg>
    `,
  },
  {
    label: 'Khách hàng',
    to: '/customers',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" class="crm-svg">
        <path d="M16 21V19C16 17.8954 15.1046 17 14 17H6C4.89543 17 4 17.8954 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="10" cy="9" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M20 21V19C19.9993 18.0778 19.373 17.2731 18.48 17.05" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M15 5.13C15.893 5.35 16.5193 6.15474 16.52 7.077V9.077" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
  },
  {
    label: 'Tạo khách',
    to: '/customers/create',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" class="crm-svg">
        <path d="M12 5V19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
  },
  {
    label: 'Quản lý sale',
    to: '/users',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" class="crm-svg">
        <circle cx="9" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M3 20C3.8 16.8 6.1 15 9 15C11.9 15 14.2 16.8 15 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M18 8V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M15 11H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
  },
]

const currentPageTitle = computed(() => {
  if (route.path.startsWith('/customers/create')) return 'Tạo khách hàng'
  if (route.path.startsWith('/customers/')) return 'Chi tiết khách hàng'
  if (route.path.startsWith('/customers')) return 'Quản lý khách hàng'
  if (route.path.startsWith('/users')) return 'Quản lý sale'
  if (route.path.startsWith('/profile')) return 'Thông tin tài khoản'
  return 'Dashboard'
})

const userInitials = computed(() => {
  const name = auth.user?.name || 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join('')
})

const isActive = (path) => {
  if (path === '/customers') return route.path === '/customers'
  return route.path.startsWith(path)
}

const logout = async () => {
  try {
    await auth.logout?.()
  } catch (e) {
    // ignore
  }
  router.push('/login')
}
</script>

<style scoped>
.crm-shell {
  display: flex;
  min-height: 100vh;
  background: #f3f6fb;
}

.crm-sidebar {
  width: 260px;
  background: linear-gradient(180deg, #07152d 0%, #08132a 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  transition: width 0.22s ease;
}

.crm-sidebar.collapsed {
  width: 78px;
}

.crm-sidebar-top,
.crm-sidebar-bottom {
  padding: 12px;
}

.crm-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 10px 12px;
  flex: 1;
}

.crm-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.76);
  text-decoration: none;
  transition: all 0.18s ease;
  border: 1px solid transparent;
}

.crm-nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.crm-nav-item.active {
  background: linear-gradient(180deg, rgba(43, 95, 255, 0.28), rgba(43, 95, 255, 0.18));
  color: #fff;
  border-color: rgba(96, 165, 250, 0.18);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
}

.crm-nav-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.crm-nav-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.crm-icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.06);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
}

.crm-icon-btn:hover {
  background: rgba(255,255,255,0.1);
}

.crm-logout-mini {
  color: rgba(255,255,255,0.84);
}

.crm-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.crm-topbar {
  height: 56px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #dde5ef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.crm-topbar-left {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
}

.crm-breadcrumb-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crm-breadcrumb-inline-muted {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.crm-breadcrumb-inline-sep {
  font-size: 11px;
  color: #cbd5e1;
}

.crm-breadcrumb-inline-current {
  font-size: 13px;
  color: #334155;
  font-weight: 700;
}

.crm-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.crm-profile-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 5px 10px;
  text-decoration: none;
  transition: all 0.18s ease;
}

.crm-profile-chip:hover {
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  border-color: #cbd5e1;
}

.crm-profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(180deg, #0f172a, #1e293b);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.crm-profile-meta {
  line-height: 1.05;
}

.crm-profile-name {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}

.crm-profile-link {
  font-size: 11px;
  color: #64748b;
}

.crm-topbar-btn {
  height: 36px;
  border-radius: 12px;
  border: 1px solid #dbe4ef;
  background: #fff;
  color: #0f172a;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.18s ease;
}

.crm-topbar-btn:hover {
  background: #f8fafc;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.crm-content {
  padding: 12px 14px 14px;
  min-width: 0;
}

.crm-svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 1024px) {
  .crm-sidebar {
    width: 82px;
  }

  .crm-nav-label {
    display: none;
  }

  .crm-topbar {
    height: 52px;
    padding: 0 10px;
  }

  .crm-profile-meta {
    display: none;
  }

  .crm-topbar-btn {
    height: 34px;
    padding: 0 10px;
    font-size: 12px;
  }
}

@media (max-width: 640px) {
  .crm-breadcrumb-inline-muted {
    display: none;
  }

  .crm-breadcrumb-inline-sep {
    display: none;
  }

  .crm-breadcrumb-inline-current {
    font-size: 12px;
  }

  .crm-topbar-right {
    gap: 6px;
  }

  .crm-profile-chip {
    padding: 4px 6px;
  }

  .crm-profile-avatar {
    width: 30px;
    height: 30px;
    font-size: 11px;
  }
}
</style>