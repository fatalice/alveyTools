<template>
  <div class="scores-page">
    <!-- 用户列表 -->
    <div v-if="!selectedUser">
      <t-table :data="users" :columns="userColumns" row-key="userId" :loading="loading" />
    </div>

    <!-- 用户积分明细 -->
    <div v-else class="detail-view">
      <div class="detail-header">
        <t-button variant="text" icon="chevron-left" @click="onBack">返回用户列表</t-button>
        <div class="detail-user">
          <span class="detail-name">{{ selectedUser.name }}</span>
          <t-tag variant="outline">{{ selectedUser.userId }}</t-tag>
          <t-tag theme="success">总积分: {{ totalScore }}</t-tag>
        </div>
      </div>

      <div class="detail-actions">
        <t-button theme="primary" @click="onOpenAdd(1)">加分</t-button>
        <t-button theme="danger" @click="onOpenAdd(-1)">减分</t-button>
      </div>

      <t-table :data="records" :columns="recordColumns" row-key="_id" :loading="detailLoading" />
    </div>

    <!-- 加分/减分弹窗 -->
    <t-dialog v-model:visible="dialogVisible" :header="dialogMode > 0 ? '手动加分' : '手动减分'" @confirm="onConfirmAdd" :confirm-btn="{ loading: adding }">
      <t-form>
        <t-form-item label="积分">
          <t-input-number v-model="addPoints" :min="1" :max="9999" />
        </t-form-item>
        <t-form-item label="原因" required-mark>
          <t-input v-model="addDesc" placeholder="请输入原因" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { Button as TButton } from 'tdesign-vue-next'
import { getUsers, addScore, getScoreDetail } from '../api'

const users = ref([])
const loading = ref(false)
const selectedUser = ref(null)
const totalScore = ref(0)
const records = ref([])
const detailLoading = ref(false)

const dialogVisible = ref(false)
const dialogMode = ref(1)
const adding = ref(false)
const addPoints = ref(10)
const addDesc = ref('')

const userColumns = [
  { colKey: 'name', title: '昵称', width: 120 },
  { colKey: 'userId', title: '用户ID (openid)', ellipsis: true },
  { colKey: 'totalScore', title: '总积分', width: 100 },
  {
    colKey: 'op', title: '操作', width: 120,
    cell: (_, { row }) => h(TButton, { size: 'small', variant: 'text', onClick: () => onSelectUser(row) }, () => '查看明细')
  },
]

const recordColumns = [
  { colKey: 'type', title: '类型', width: 100, cell: (_, { row }) => typeLabel(row.type) },
  { colKey: 'desc', title: '原因' },
  { colKey: 'points', title: '积分', width: 80, cell: (_, { row }) => (row.points > 0 ? '+' : '') + row.points },
  { colKey: 'createdAt', title: '时间', width: 160, cell: (_, { row }) => new Date(row.createdAt).toLocaleString() },
]

function typeLabel(type) {
  const map = { checkin: '签到', message: '留言', exchange: '兑换', admin: '管理员' }
  return map[type] || type
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUsers()
    users.value = res.data || []
  } finally {
    loading.value = false
  }
}

async function onSelectUser(row) {
  selectedUser.value = row
  await fetchDetail()
}

async function fetchDetail() {
  detailLoading.value = true
  try {
    const res = await getScoreDetail(selectedUser.value.userId)
    const data = res.data || res
    totalScore.value = data.total || 0
    records.value = data.records || []
  } finally {
    detailLoading.value = false
  }
}

function onBack() {
  selectedUser.value = null
  fetchUsers()
}

function onOpenAdd(mode) {
  dialogMode.value = mode
  addPoints.value = 10
  addDesc.value = ''
  dialogVisible.value = true
}

async function onConfirmAdd() {
  if (!addDesc.value.trim()) {
    return
  }
  adding.value = true
  try {
    const points = dialogMode.value > 0 ? addPoints.value : -addPoints.value
    await addScore(selectedUser.value.userId, points, addDesc.value.trim())
    dialogVisible.value = false
    fetchDetail()
  } finally {
    adding.value = false
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.detail-header {
  margin-bottom: 16px;
}
.detail-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
.detail-name {
  font-size: 18px;
  font-weight: 600;
}
.detail-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
