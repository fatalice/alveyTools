<template>
  <div class="app">
    <Login v-if="!isLoggedIn" @success="onLoginSuccess" />
    <template v-else>
      <t-layout>
        <t-header>
          <div class="header-bar">
            <span class="header-title">alveyTools 管理后台</span>
            <t-button size="small" variant="text" @click="onLogout">退出</t-button>
          </div>
        </t-header>
        <t-content>
          <t-tabs v-model="activeTab">
            <t-tab-panel value="notices" label="社区公告">
              <Notices />
            </t-tab-panel>
            <t-tab-panel value="scores" label="用户积分">
              <Scores />
            </t-tab-panel>
          </t-tabs>
        </t-content>
      </t-layout>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Login from './views/Login.vue'
import Notices from './views/Notices.vue'
import Scores from './views/Scores.vue'

const isLoggedIn = ref(!!sessionStorage.getItem('admin_token'))
const activeTab = ref('notices')

function onLoginSuccess() {
  isLoggedIn.value = true
}

function onLogout() {
  sessionStorage.removeItem('admin_token')
  isLoggedIn.value = false
}
</script>

<style>
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
.header-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; height: 56px;
}
.header-title { font-size: 18px; font-weight: 600; }
.t-content { padding: 24px; }
</style>
