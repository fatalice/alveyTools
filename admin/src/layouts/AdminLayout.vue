<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">A</div>
        <div>
          <div class="brand-name">alveyTools</div>
          <div class="brand-sub">管理控制台</div>
        </div>
      </div>

      <nav class="nav">
        <div class="nav-label">内容</div>
        <router-link
          v-for="item in contentMenus"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>

        <div class="nav-label">运营</div>
        <router-link
          v-for="item in opsMenus"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-foot">
        <router-link to="/settings" class="nav-item" :class="{ active: route.path === '/settings' }">
          <span class="nav-icon">⚙</span>
          <span>账号设置</span>
        </router-link>
        <button class="logout-btn" @click="onLogout">退出登录</button>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <h1 class="page-title">{{ route.meta.title || '管理后台' }}</h1>
          <p class="page-desc">{{ pageDesc }}</p>
        </div>
      </header>
      <section class="content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const contentMenus = [
  { path: '/qb', label: '题库管理', icon: '▣' },
  { path: '/notes', label: '学习笔记', icon: '✎' },
]
const opsMenus = [
  { path: '/notices', label: '社区公告', icon: '☰' },
  { path: '/scores', label: '用户积分', icon: '◆' },
]

const descMap = {
  '/qb': '分类 → 课程 → 题库 → 题目，四级结构管理',
  '/notes': '自定义笔记分类（如考研英语 / 考研政治），录入与展示学习笔记',
  '/notices': '管理开心羊圈社区公告',
  '/scores': '查看用户积分并手动加分',
  '/settings': '修改管理员登录密码',
}

const pageDesc = computed(() => descMap[route.path] || '')

function onLogout() {
  sessionStorage.removeItem('admin_token')
  router.replace('/login')
}
</script>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 248px 1fr;
}

.sidebar {
  background:
    radial-gradient(circle at top left, rgba(47, 138, 118, 0.28), transparent 42%),
    linear-gradient(180deg, #1a2d27 0%, var(--sidebar) 100%);
  color: var(--sidebar-ink);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 0 8px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #2f8a76;
  color: #fff;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}

.brand-sub {
  font-size: 12px;
  color: var(--sidebar-muted);
  margin-top: 2px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-label {
  margin: 12px 8px 8px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sidebar-muted);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--sidebar-ink);
  transition: background 0.15s ease;
}

.nav-item:hover { background: rgba(255, 255, 255, 0.06); }
.nav-item.active {
  background: rgba(47, 138, 118, 0.28);
  color: #fff;
}

.nav-icon {
  width: 18px;
  text-align: center;
  opacity: 0.9;
}

.sidebar-foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.logout-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: var(--sidebar-ink);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
}

.logout-btn:hover { background: rgba(255, 255, 255, 0.06); }

.main {
  min-width: 0;
  padding: 28px 32px 40px;
}

.topbar { margin-bottom: 8px; }

.content { min-width: 0; }

@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { min-height: auto; }
}
</style>
