<template>
  <div class="login-page">
    <div class="login-visual" aria-hidden="true">
      <div class="orb orb-a"></div>
      <div class="orb orb-b"></div>
      <div class="visual-copy">
        <div class="eyebrow">alveyTools Admin</div>
        <h1>学习内容与题库<br />一处打理</h1>
        <p>管理考研题库层级、学习笔记与社区运营。</p>
      </div>
    </div>

    <div class="login-panel">
      <div class="login-card">
        <h2>管理后台登录</h2>
        <p class="hint">使用管理员密码进入控制台</p>
        <t-input
          v-model="password"
          type="password"
          size="large"
          placeholder="请输入管理密码"
          @enter="onLogin"
        />
        <t-button theme="primary" block size="large" :loading="loading" @click="onLogin" class="login-btn">
          进入后台
        </t-button>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onLogin() {
  if (!password.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await login(password.value)
    if (res.code === 200 && res.data?.token) {
      sessionStorage.setItem('admin_token', res.data.token)
      router.replace('/qb')
    } else {
      error.value = res.message || '登录失败'
    }
  } catch (e) {
    error.value = '网络错误'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
}

.login-visual {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(145deg, #163229 0%, #0f6b5c 48%, #1f463c 100%);
  color: #edf7f3;
  padding: 64px;
  display: flex;
  align-items: flex-end;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(10px);
  opacity: 0.45;
}
.orb-a {
  width: 280px; height: 280px; top: -40px; right: -40px;
  background: #7ad1bd;
}
.orb-b {
  width: 180px; height: 180px; bottom: 80px; left: 40px;
  background: #c9f2e4;
}

.visual-copy { position: relative; z-index: 1; max-width: 420px; }
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.75;
  margin-bottom: 16px;
}
.visual-copy h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 44px;
  line-height: 1.15;
  font-weight: 600;
}
.visual-copy p {
  margin: 18px 0 0;
  opacity: 0.82;
  line-height: 1.6;
}

.login-panel {
  display: grid;
  place-items: center;
  padding: 32px;
  background:
    linear-gradient(180deg, rgba(243, 245, 242, 0.9), #f3f5f2),
    radial-gradient(circle at 80% 10%, rgba(15, 107, 92, 0.08), transparent 30%);
}

.login-card {
  width: min(400px, 100%);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 36px 32px;
  box-shadow: var(--shadow);
}

.login-card h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 28px;
}
.hint {
  margin: 8px 0 24px;
  color: var(--ink-soft);
  font-size: 14px;
}
.login-btn { margin-top: 16px; }
.error {
  color: var(--danger);
  font-size: 14px;
  margin: 12px 0 0;
  text-align: center;
}

@media (max-width: 900px) {
  .login-page { grid-template-columns: 1fr; }
  .login-visual { min-height: 220px; padding: 32px; }
  .visual-copy h1 { font-size: 32px; }
}
</style>
