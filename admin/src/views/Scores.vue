<template>
  <div class="scores-page">
    <t-table :data="users" :columns="columns" row-key="userId" :loading="loading" />

    <t-dialog v-model:visible="dialogVisible" header="手动加分" @confirm="onConfirmAdd" :confirm-btn="{ loading: adding }">
      <t-form>
        <t-form-item label="用户">
          <t-input :value="selectedUser.name + ' (' + selectedUser.userId + ')'" disabled />
        </t-form-item>
        <t-form-item label="积分">
          <t-input-number v-model="addPoints" :min="1" :max="9999" />
        </t-form-item>
        <t-form-item label="原因">
          <t-input v-model="addDesc" placeholder="加分原因（可选）" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { Button as TButton } from 'tdesign-vue-next'
import { getUsers, addScore } from '../api'

const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const adding = ref(false)
const selectedUser = ref({ userId: '', name: '' })
const addPoints = ref(10)
const addDesc = ref('')

const columns = [
  { colKey: 'name', title: '昵称', width: 120 },
  { colKey: 'userId', title: '用户ID', ellipsis: true },
  { colKey: 'totalScore', title: '总积分', width: 100 },
  {
    colKey: 'op', title: '操作', width: 100,
    cell: (_, { row }) => h(TButton, { size: 'small', variant: 'text', onClick: () => onAdd(row) }, () => '加分')
  },
]

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUsers()
    users.value = res.data || []
  } finally {
    loading.value = false
  }
}

function onAdd(row) {
  selectedUser.value = row
  addPoints.value = 10
  addDesc.value = ''
  dialogVisible.value = true
}

async function onConfirmAdd() {
  adding.value = true
  try {
    await addScore(selectedUser.value.userId, addPoints.value, addDesc.value || '管理员手动加分')
    dialogVisible.value = false
    fetchUsers()
  } finally {
    adding.value = false
  }
}

onMounted(fetchUsers)
</script>
