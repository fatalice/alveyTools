<template>
  <div class="panel settings">
    <h3>修改登录密码</h3>
    <p class="tip">密码以 scrypt 加盐哈希存入数据库，不再写死在代码里。</p>
    <t-form class="form" label-width="100px">
      <t-form-item label="旧密码">
        <t-input v-model="oldPassword" type="password" placeholder="当前密码" />
      </t-form-item>
      <t-form-item label="新密码">
        <t-input v-model="newPassword" type="password" placeholder="至少 8 位" />
      </t-form-item>
      <t-form-item label="确认新密码">
        <t-input v-model="confirmPassword" type="password" placeholder="再次输入新密码" />
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" :loading="loading" @click="onSubmit">保存新密码</t-button>
      </t-form-item>
    </t-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { changePassword } from '../api'

const router = useRouter()
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)

async function onSubmit() {
  if (!oldPassword.value || !newPassword.value) {
    MessagePlugin.warning('请填写完整')
    return
  }
  if (newPassword.value.length < 8) {
    MessagePlugin.warning('新密码至少 8 位')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    MessagePlugin.warning('两次新密码不一致')
    return
  }
  loading.value = true
  try {
    const res = await changePassword(oldPassword.value, newPassword.value)
    if (res.code !== 200) {
      MessagePlugin.error(res.message || '修改失败')
      return
    }
    MessagePlugin.success('密码已更新，请重新登录')
    sessionStorage.removeItem('admin_token')
    router.replace('/login')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.settings h3 {
  margin: 0 0 8px;
  font-family: var(--font-display);
}
.tip {
  margin: 0 0 20px;
  color: var(--ink-soft);
  font-size: 14px;
}
.form { max-width: 460px; }
</style>
