<template>
  <div class="login-page">
    <div class="login-card">
      <h2>管理后台登录</h2>
      <t-input v-model="password" type="password" placeholder="请输入管理密码" @enter="onLogin" />
      <t-button theme="primary" block :loading="loading" @click="onLogin" style="margin-top: 16px">
        登录
      </t-button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { login } from '../api'

const emit = defineEmits(['success'])
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
      emit('success')
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
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #f5f6fa;
}
.login-card {
  width: 360px; padding: 40px; background: #fff; border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}
.login-card h2 { margin: 0 0 24px; text-align: center; }
.error { color: #e34d59; font-size: 14px; margin-top: 12px; text-align: center; }
</style>
